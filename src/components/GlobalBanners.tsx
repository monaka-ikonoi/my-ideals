import { InstallAppBanner } from './banners/InstallAppBanner';
import { AppleItpWarning } from './banners/AppleItpWarning';
import { TwitterBrowserWarning } from './banners/TwitterBrowserWarning';

export function GlobalBanners() {
  return (
    <div
      className="mx-auto w-full max-w-[512px] space-y-6 px-4 pt-6 empty:hidden md:max-w-[1024px]
        2xl:max-w-[1664px]"
    >
      <TwitterBrowserWarning />
      <InstallAppBanner />
      <AppleItpWarning />
    </div>
  );
}
