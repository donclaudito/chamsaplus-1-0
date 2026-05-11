import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Saves/updates a chat session as a .json file in a specific Drive folder.
// Creates the file on first call, updates it on subsequent calls using the stored Drive file ID.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { sessionId, sessionTitle, messages, folderId, driveFileId } = await req.json();

    if (!sessionId || !folderId) {
      return Response.json({ error: 'sessionId and folderId are required' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    const fileContent = JSON.stringify({
      sessionId,
      title: sessionTitle || 'Chat sem título',
      user: user.email,
      updatedAt: new Date().toISOString(),
      messages: messages || [],
    }, null, 2);

    const metadata = {
      name: `chamsa_chat_${sessionId}.json`,
      mimeType: 'application/json',
    };

    let fileId = driveFileId;

    if (fileId) {
      // PATCH — update existing file content
      const boundary = '-------chamsa_boundary';
      const body =
        `--${boundary}\r\nContent-Type: application/json\r\n\r\n` +
        JSON.stringify(metadata) +
        `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n` +
        fileContent +
        `\r\n--${boundary}--`;

      const res = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`,
        {
          method: 'PATCH',
          headers: {
            ...authHeader,
            'Content-Type': `multipart/related; boundary="${boundary}"`,
          },
          body,
        }
      );
      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: `Drive PATCH failed: ${err}` }, { status: 500 });
      }
      return Response.json({ driveFileId: fileId });
    } else {
      // POST — create new file in the folder
      const metadataWithParent = { ...metadata, parents: [folderId] };
      const boundary = '-------chamsa_boundary';
      const body =
        `--${boundary}\r\nContent-Type: application/json\r\n\r\n` +
        JSON.stringify(metadataWithParent) +
        `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n` +
        fileContent +
        `\r\n--${boundary}--`;

      const res = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
        {
          method: 'POST',
          headers: {
            ...authHeader,
            'Content-Type': `multipart/related; boundary="${boundary}"`,
          },
          body,
        }
      );
      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: `Drive POST failed: ${err}` }, { status: 500 });
      }
      const data = await res.json();
      return Response.json({ driveFileId: data.id });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});