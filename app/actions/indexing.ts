'use server';

import { google } from 'googleapis';

export async function submitUrlsToGSC(urls: string[], type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED') {
  if (!process.env.GSC_CLIENT_EMAIL || !process.env.GSC_PRIVATE_KEY) {
    return { success: false, error: 'Missing environment variables for Google Service Account.' };
  }

  // Handle line breaks in private key
  const privateKey = process.env.GSC_PRIVATE_KEY.replace(/\\n/g, '\n');

  try {
    const auth = new google.auth.JWT({
      email: process.env.GSC_CLIENT_EMAIL,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    const indexing = google.indexing({ version: 'v3', auth });
    const results = [];

    for (const url of urls) {
      try {
        const response = await indexing.urlNotifications.publish({
          requestBody: {
            url: url.trim(),
            type,
          },
        });
        results.push({ url, status: 'success', data: response.data });
      } catch (err: any) {
        results.push({ url, status: 'error', error: err.message || 'Failed to submit' });
      }
    }

    return { success: true, results };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}