'use server';

import { google } from 'googleapis';

export async function getGscPerformanceData(siteUrl: string, days: number = 28) {
  if (!process.env.GSC_CLIENT_EMAIL || !process.env.GSC_PRIVATE_KEY) {
    return { success: false, error: 'Missing environment variables.' };
  }

  const privateKey = process.env.GSC_PRIVATE_KEY.replace(/\\n/g, '\n');

  try {
    const auth = new google.auth.JWT({
      email: process.env.GSC_CLIENT_EMAIL,
      key: privateKey,
      // Request Search Console read-only scope
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const searchconsole = google.searchconsole({ version: 'v1', auth });

    // Calculate start date (e.g., 28 days ago)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Query performance metrics grouped by URL (Page) or Query (Keywords)
    const response = await searchconsole.searchanalytics.query({
      siteUrl: siteUrl, // e.g., "https://example.com/" or "sc-domain:example.com"
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page', 'query'], // Retrieve URLs alongside ranked search terms
        rowLimit: 25,
      },
    });

    return {
      success: true,
      rows: response.data.rows ?? [], // Returns clicks, impressions, ctr, and position (average rank)
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch GSC metrics' };
  }
}