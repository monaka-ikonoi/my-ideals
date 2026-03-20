export function isIos(ua: string) {
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

export function isMacSafari(ua: string) {
  return (
    /Macintosh/.test(ua) &&
    navigator.maxTouchPoints === 0 &&
    /Safari/.test(ua) &&
    !/Chrome|Chromium|Edg|OPR|Firefox/.test(ua)
  );
}
