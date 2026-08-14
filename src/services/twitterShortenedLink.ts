import { debugLog } from '../utils/debug';

export function isTwitterShortenedLink(url: string): boolean {
  if (!url) return false;

  const parsedUrl = new URL(url);
  return parsedUrl.hostname === 't.co';
}

export type TwitterShortenedLinkResult =
  { success: true; url: string } | { success: false; error: string };

export async function extractTwitterShortenedLink(
  url: string
): Promise<TwitterShortenedLinkResult> {
  if (!url || !isTwitterShortenedLink(url))
    return { success: false, error: 'Invalid Twitter shortened link' };

  debugLog.network.log(`Extracting Twitter shortened link: ${url}`);

  try {
    const response = await fetch(url, {});

    if (!response.ok) {
      return {
        success: false,
        error: `Twitter shortened link fetch failed: ${response.status} ${response.statusText}`,
      };
    }

    const htmlString = await response.text();

    // Match location.replace("...")
    const jsMatch = htmlString.match(/location\.replace\s*\(\s*['"]([^'"]+)['"]\s*\)/i);
    if (jsMatch && jsMatch[1]) {
      const link = jsMatch[1].replace(/\\\//g, '/');
      debugLog.network.log(
        `Extracted URL from Twitter shortened link: ${link}, matched: location.replace`
      );
      return { success: true, url: link };
    }

    // Match <meta http-equiv="refresh">
    const metaMatch = htmlString.match(/<meta[^>]*?content=["'][^;]*;\s*url=([^"']+)["']/i);
    if (metaMatch && metaMatch[1]) {
      debugLog.network.log(
        `Extracted URL from Twitter shortened link: ${metaMatch[1]}, matched: <meta http-equiv="refresh">`
      );
      return { success: true, url: metaMatch[1] };
    }

    // Match <title>
    const titleMatch = htmlString.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      debugLog.network.log(
        `Extracted URL from Twitter shortened link: ${titleMatch[1]}, matched: <title>`
      );
      return { success: true, url: titleMatch[1] };
    }

    return { success: false, error: 'Failed to extract URL from Twitter shortened link' };
  } catch (error) {
    return { success: false, error: `Error extracting Twitter shortened link: ${error}` };
  }
}
