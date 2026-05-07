import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { folder_id } = await req.json();
    if (!folder_id) return Response.json({ error: 'folder_id required' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const headers = { Authorization: `Bearer ${accessToken}` };

    // List files in folder (docs, text, pdf)
    const listUrl = `https://www.googleapis.com/drive/v3/files?q='${folder_id}'+in+parents+and+trashed=false&fields=files(id,name,mimeType)&pageSize=20`;
    const listRes = await fetch(listUrl, { headers });
    const listData = await listRes.json();
    const files = listData.files || [];

    const results = [];

    for (const file of files) {
      let content = '';

      if (file.mimeType === 'application/vnd.google-apps.document') {
        // Export Google Doc as plain text
        const exportRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`,
          { headers }
        );
        content = await exportRes.text();
      } else if (
        file.mimeType === 'text/plain' ||
        file.mimeType === 'text/markdown' ||
        file.mimeType === 'text/csv'
      ) {
        const dlRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
          { headers }
        );
        content = await dlRes.text();
      } else {
        // Skip binary/unsupported files
        continue;
      }

      // Truncate to avoid huge prompts (max 4000 chars per file)
      results.push({
        name: file.name,
        content: content.slice(0, 4000),
      });
    }

    return Response.json({ files: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});