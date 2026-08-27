export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  description?: string;
  owners?: Array<{
    displayName: string;
    emailAddress?: string;
    photoLink?: string;
  }>;
}

/**
 * Отримує список файлів та папок з Google Drive.
 */
export async function listDriveFiles(
  accessToken: string,
  folderId: string = 'root',
  searchQuery?: string
): Promise<GoogleDriveFile[]> {
  let query = `trashed=false and '${folderId}' in parents`;
  if (searchQuery && searchQuery.trim() !== '') {
    const escaped = searchQuery.replace(/'/g, "\\'");
    query = `trashed=false and name contains '${escaped}'`;
  }

  const encodedQuery = encodeURIComponent(query);
  const fields = encodeURIComponent('files(id,name,mimeType,modifiedTime,size,webViewLink,iconLink,thumbnailLink,description,owners)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodedQuery}&fields=${fields}&orderBy=folder,modifiedTime desc&pageSize=50`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Помилка отримання файлів Google Drive: ${err || response.statusText}`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Отримує список персональних документів (Docs, Sheets, Slides, PDF, текстові файли).
 */
export async function listPersonalDocuments(
  accessToken: string,
  searchQuery?: string
): Promise<GoogleDriveFile[]> {
  const docMimeTypes = [
    "application/vnd.google-apps.document",
    "application/vnd.google-apps.spreadsheet",
    "application/vnd.google-apps.presentation",
    "application/pdf",
    "text/plain",
    "text/markdown",
    "application/rtf"
  ];

  const mimeConditions = docMimeTypes.map(m => `mimeType='${m}'`).join(' or ');
  let query = `trashed=false and (${mimeConditions})`;

  if (searchQuery && searchQuery.trim() !== '') {
    const escaped = searchQuery.replace(/'/g, "\\'");
    query += ` and name contains '${escaped}'`;
  }

  const encodedQuery = encodeURIComponent(query);
  const fields = encodeURIComponent('files(id,name,mimeType,modifiedTime,size,webViewLink,iconLink,thumbnailLink)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodedQuery}&fields=${fields}&orderBy=modifiedTime desc&pageSize=40`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Помилка отримання персональних документів: ${err || response.statusText}`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Отримує метадані одного файлу за його ID.
 */
export async function getDriveFile(
  accessToken: string,
  fileId: string
): Promise<GoogleDriveFile> {
  const fields = encodeURIComponent('id,name,mimeType,modifiedTime,size,webViewLink,iconLink,thumbnailLink,description,owners');
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=${fields}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Помилка отримання метаданих файлу: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Отримує текстовий вміст файлу або експортує Google Docs / Google Sheets.
 */
export async function getDriveFileTextContent(
  accessToken: string,
  fileId: string,
  mimeType: string
): Promise<string> {
  let url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  if (mimeType === 'application/vnd.google-apps.document') {
    url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
  } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
    url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/csv`;
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Помилка отримання вмісту файлу: ${response.statusText}`);
  }

  return await response.text();
}

/**
 * Форматує розмір файлу у зручний для читання вигляд.
 */
export function formatFileSize(bytes?: string | number): string {
  if (!bytes) return '';
  const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (isNaN(num) || num === 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(num) / Math.log(k));
  return `${parseFloat((num / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
