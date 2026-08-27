export interface GoogleSheetMeta {
  id: string;
  name: string;
  modifiedTime: string;
}

export async function listGoogleSheets(accessToken: string): Promise<GoogleSheetMeta[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc&pageSize=10`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Google Sheets: ${response.statusText}`);
  }

  const data = await response.json();
  return data.files || [];
}

export interface SheetData {
  range: string;
  majorDimension: string;
  values: string[][];
}

export async function getGoogleSheetData(accessToken: string, spreadsheetId: string, range: string = 'A1:Z100'): Promise<SheetData> {
  // Try to get data from the first sheet by default, or you can specify a range like "Sheet1!A1:Z"
  // Without sheet name, just "A1:Z" might fail or default to the first visible sheet.
  // We can query the spreadsheet metadata first to get the first sheet's name, or just try A1:Z100
  // which often works for the default sheet if no sheet name is provided, but Sheets API prefers SheetName!A1:Z
  
  // Let's first get the spreadsheet info to get the title of the first sheet
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`;
  const metaResponse = await fetch(metaUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!metaResponse.ok) {
    throw new Error(`Failed to fetch spreadsheet metadata: ${metaResponse.statusText}`);
  }

  const metaData = await metaResponse.json();
  const firstSheetTitle = metaData.sheets?.[0]?.properties?.title || 'Sheet1';

  const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(firstSheetTitle + '!A1:Z100')}`;
  const valuesResponse = await fetch(valuesUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!valuesResponse.ok) {
    throw new Error(`Failed to fetch spreadsheet values: ${valuesResponse.statusText}`);
  }

  return await valuesResponse.json();
}
