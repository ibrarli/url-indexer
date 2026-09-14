'use server';

import { google } from 'googleapis';

export async function inspectUrlGSC(targetUrl: string, siteUrl: string) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GSC_CLIENT_EMAIL,
        private_key: process.env.GSC_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const searchconsole = google.searchconsole({ version: 'v1', auth });

    const res = await searchconsole.urlInspection.index.inspect({
      requestBody: {
        inspectionUrl: targetUrl,
        siteUrl: siteUrl,
      },
    });

    // Safeguard against undefined response data
    if (!res.data || !res.data.inspectionResult) {
      return { success: false, error: 'No inspection data returned from Search Console.' };
    }

    return { success: true, data: res.data.inspectionResult };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to inspect URL.' };
  }
}   