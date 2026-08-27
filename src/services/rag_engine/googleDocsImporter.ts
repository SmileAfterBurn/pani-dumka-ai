export interface GoogleDocMeta {
  id: string;
  name: string;
  modifiedTime: string;
}

export async function listGoogleDocs(accessToken: string): Promise<GoogleDocMeta[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.document' and trashed=false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc&pageSize=10`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Google Docs: ${response.statusText}`);
  }

  const data = await response.json();
  return data.files || [];
}

export async function getGoogleDocContent(accessToken: string, fileId: string): Promise<string> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch document content: ${response.statusText}`);
  }

  const text = await response.text();
  return text;
}
