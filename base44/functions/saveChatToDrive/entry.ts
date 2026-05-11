import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Saves/updates a chat session as a .json file in a specific Drive folder.
// Creates the file on first call, updates it on subsequent calls using the stored Drive file ID.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // --- Auth guard: require authenticated user ---
    let user;
    try {
      user = await base44.auth.me();
    } catch (_) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { sessionId, sessionTitle, messages, folderId, driveFileId } = await req.json();

    if (!sessionId || !folderId) {
      return Response.json({ error: 'sessionId and folderId are required' }, { status: 400 });
    }

    // --- Security: verify the session belongs to the authenticated user ---
    const session = await base44.asServiceRole.entities.ChatSession.get(sessionId);
    if (!session) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }
    if (session.created_by !== user.email) {
      return Response.json({ error: 'Forbidden: session does not belong to you' }, { status: 403 });
    }

    // --- Get Drive access token ---
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('googledrive');
      accessToken = conn.accessToken;
    } catch (_) {
      return Response.json({ error: 'Google Drive connector not authorized' }, { status: 503 });
    }

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
        if (res.status === 404) {
          return Response.json({ driveFileId: null, error: 'File not found on Drive, will recreate on next save' }, { status: 200 });
        }
        if (res.status === 403) {
          return Response.json({ error: 'Sem permissão para atualizar o arquivo no Drive. Verifique as permissões.' }, { status: 403 });
        }
        if (res.status === 507 || (err && err.includes('storageQuotaExceeded'))) {
          return Response.json({ error: 'Cota de armazenamento do Google Drive esgotada.' }, { status: 507 });
        }
        return Response.json({ error: `Drive PATCH failed (${res.status}): ${err}` }, { status: 500 });
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
        if (res.status === 403) {
          return Response.json({ error: 'Sem permissão para criar arquivo no Drive. Verifique as permissões da pasta.' }, { status: 403 });
        }
        if (res.status === 507 || (err && err.includes('storageQuotaExceeded'))) {
          return Response.json({ error: 'Cota de armazenamento do Google Drive esgotada.' }, { status: 507 });
        }
        return Response.json({ error: `Drive POST failed (${res.status}): ${err}` }, { status: 500 });
      }

      const data = await res.json();
      fileId = data.id;

      // Set "anyone with link" as reader so the end user can access the file
      await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
        {
          method: 'POST',
          headers: {
            ...authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'anyone', role: 'reader' }),
        }
      );

      return Response.json({ driveFileId: fileId });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});