'use server';

import { google } from 'googleapis';

export async function getVerifiedSites() {
  if (!process.env.GSC_CLIENT_EMAIL || !process.env.GSC_PRIVATE_KEY) {
    return { success: false, error: 'Missing environment variables.' };
  }

  const privateKey = process.env.GSC_PRIVATE_KEY.replace(/\\n/g, '\n');

  try {
    const auth = new google.auth.JWT({
      email: process.env.GSC_CLIENT_EMAIL,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const searchconsole = google.searchconsole({ version: 'v1', auth });
    const response = await searchconsole.sites.list();

    const siteEntries = response.data.siteEntry || [];
    const siteUrls = siteEntries.map((site) => site.siteUrl).filter(Boolean) as string[];

    return {
      success: true,
      sites: siteUrls,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch verified sites.' };
  }
}