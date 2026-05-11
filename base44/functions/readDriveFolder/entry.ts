import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { folder_id } = await req.json();
    if (!folder_id) return Response.json({ error: 'folder_id required' }, { status: 400 });

    // Validar formato básico do folder_id (somente alfanuméricos, hífens e underscores)
    if (!/^[\w\-]+$/.test(folder_id)) {
      return Response.json({ error: 'folder_id inválido' }, { status: 400 });
    }

    // Buscar token uma única vez
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const headers = { Authorization: `Bearer ${accessToken}` };

    // Escapar folder_id para uso seguro na query
    const safeFolderId = folder_id.replace(/'/g, "\\'");
    const listUrl = `https://www.googleapis.com/drive/v3/files?q='${safeFolderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType)&pageSize=20`;
    const listRes = await fetch(listUrl, { headers });
    const listData = await listRes.json();
    const files = (listData.files || []).filter(f =>
      f.mimeType === 'application/vnd.google-apps.document' ||
      f.mimeType === 'text/plain' ||
      f.mimeType === 'text/markdown' ||
      f.mimeType === 'text/csv'
    );

    // Paralelizar download dos arquivos suportados
    const results = (await Promise.all(files.map(async (file) => {
      let url;
      if (file.mimeType === 'application/vnd.google-apps.document') {
        url = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`;
      } else {
        url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
      }
      const res = await fetch(url, { headers });
      if (!res.ok) return null;
      const content = await res.text();
      return { name: file.name, content: content.slice(0, 4000) };
    }))).filter(Boolean);

    return Response.json({ files: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});