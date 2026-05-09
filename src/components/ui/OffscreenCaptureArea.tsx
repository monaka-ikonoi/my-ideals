import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { debugLog } from '@/utils/debug';

const waitTwoFrames = () =>
  new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

function getImageSignature(root: HTMLElement) {
  return Array.from(root.querySelectorAll('img'))
    .map(img => `${img.currentSrc || img.src}|${img.complete ? 1 : 0}|${img.naturalWidth}`)
    .join('||');
}

async function waitForImagesRound(root: HTMLElement, timeoutMs = 4000) {
  const imgs = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    imgs.map(
      img =>
        new Promise<void>(resolve => {
          if (img.complete) return resolve();

          let doneCalled = false;
          const done = () => {
            if (doneCalled) return;
            doneCalled = true;
            clearTimeout(timer);
            img.removeEventListener('load', done);
            img.removeEventListener('error', done);
            resolve();
          };

          const timer = window.setTimeout(done, timeoutMs);
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
        })
    )
  );
}

async function waitForImagesSettled(root: HTMLElement, maxRounds = 6) {
  let prev: string | null = null;
  for (let i = 0; i < maxRounds; i++) {
    await waitForImagesRound(root);
    await waitTwoFrames();
    const next = getImageSignature(root);
    if (next === prev) return;
    prev = next;
  }
}

export type CaptureResult = { success: true; blob: Blob } | { success: false; error: string };

type OffscreenCaptureAreaProps = {
  active: boolean;
  onComplete: (result: CaptureResult) => void;
  children: ReactNode;
  width: number | string;
};

export function OffscreenCaptureArea({
  active,
  onComplete,
  children,
  width,
}: OffscreenCaptureAreaProps) {
  const [captureNode, setCaptureNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!active || !captureNode) return;

    let cancelled = false;

    (async () => {
      await waitTwoFrames();
      await waitForImagesSettled(captureNode);
      if (cancelled) return;

      debugLog.perf.time('toBlob');
      const { toBlob } = await import('html-to-image');
      const blob = await toBlob(captureNode, { pixelRatio: 1 });
      debugLog.perf.timeEnd('toBlob');
      if (cancelled) return;

      if (blob) {
        onComplete({ success: true, blob });
      } else {
        onComplete({
          success: false,
          error: 'toBlob returned null',
        });
      }
    })().catch(e => {
      if (!cancelled)
        onComplete({
          success: false,
          error: e instanceof Error ? e.message : 'Failed to generate image blob',
        });
    });

    return () => {
      cancelled = true;
    };
  }, [active, captureNode, onComplete]);

  return (
    active &&
    createPortal(
      <div className="fixed top-0 left-[-10000px]" style={{ width }}>
        <div ref={setCaptureNode}>{children}</div>
      </div>,
      document.body
    )
  );
}
