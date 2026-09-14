'use server';

export async function fetchSitemapUrls(domainUrl: string) {
  try {
    if (!domainUrl) return { success: false, error: 'No site domain provided.' };

    const cleanDomain = domainUrl.replace(/^sc-domain:/, '').trim();
    const baseUrl = cleanDomain.startsWith('http') ? cleanDomain : `https://${cleanDomain}`;

    const commonSitemapPaths = [
      '/sitemap.xml',
      '/sitemap_index.xml',
      '/sitemap-index.xml',
      '/sitemap-0.xml',
    ];

    let allUrls: string[] = [];

    // Helper function to recursively fetch and parse XML sitemaps
    async function parseSitemap(url: string, depth = 0): Promise<string[]> {
      if (depth > 3) return []; // Limit depth to prevent infinite loops

      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          },
          cache: 'no-store',
        });

        if (!res.ok) return [];

        const xmlText = await res.text();
        const extractedUrls: string[] = [];

        // Match all <loc> values
        const locRegex = /<loc>(.*?)<\/loc>/gi;
        let match;

        const foundLocs: string[] = [];
        while ((match = locRegex.exec(xmlText)) !== null) {
          if (match[1]) {
            foundLocs.push(match[1].trim());
          }
        }

        for (const loc of foundLocs) {
          // If the URL points to a sub-sitemap XML, fetch it recursively
          if (loc.endsWith('.xml') || loc.includes('sitemap')) {
            const nested = await parseSitemap(loc, depth + 1);
            extractedUrls.push(...nested);
          } else {
            extractedUrls.push(loc);
          }
        }

        return extractedUrls;
      } catch {
        return [];
      }
    }

    // Attempt fetching from standard sitemap paths
    for (const path of commonSitemapPaths) {
      const targetUrl = `${baseUrl.replace(/\/$/, '')}${path}`;
      const results = await parseSitemap(targetUrl);

      if (results.length > 0) {
        allUrls.push(...results);
        break; // Stop checking once a valid sitemap tree is resolved
      }
    }

    const uniqueUrls = Array.from(new Set(allUrls));

    if (uniqueUrls.length === 0) {
      return {
        success: false,
        error: `No valid URLs found at ${baseUrl}/sitemap.xml. Verify your sitemap route in a browser.`,
      };
    }

    return { success: true, urls: uniqueUrls };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to parse sitemap.' };
  }
}