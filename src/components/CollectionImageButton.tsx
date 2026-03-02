import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { toBlob } from 'html-to-image';
import type { TemplateCollection } from '@/domain/template';
import { CollectionGrid } from './CollectionGrid';
import { useDialogStore } from '@/stores/dialogStore';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { APP_NAME, LONG_VERSION } from '@/utils/appInfo';
import { PhotoIcon } from '@heroicons/react/24/outline';

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

type CollectionImageButtonProps = {
  collection: TemplateCollection;
};

export function CollectionImageButton({ collection }: CollectionImageButtonProps) {
  const { t, i18n } = useTranslation();

  const [mountCapture, setMountCapture] = useState(false);
  const [captureNode, setCaptureNode] = useState<HTMLDivElement | null>(null);
  const [generating, setGenerating] = useState(false);

  const templateName = useActiveProfileStore(state => state.template!.name);
  const templateId = useActiveProfileStore(state => state.template!.id);
  const profileId = useActiveProfileStore(state => state.profile!.id);
  const fileName = `${templateId}-${collection.id}.png`;

  const runningRef = useRef(false);

  const handleGenerate = useCallback(() => {
    if (runningRef.current) return;
    setMountCapture(true);
  }, []);

  useEffect(() => {
    if (!mountCapture || !captureNode || runningRef.current) return;

    let cancelled = false;
    runningRef.current = true;

    (async () => {
      setGenerating(true);

      await waitTwoFrames();
      await waitForImagesSettled(captureNode);
      if (cancelled) return;

      const blob = await toBlob(captureNode);
      if (cancelled || !blob) return;

      useDialogStore.getState().openCollectionImagePreview(blob, fileName);
    })()
      .catch(e => {
        if (!cancelled) console.error(e);
      })
      .finally(() => {
        runningRef.current = false;
        if (!cancelled) {
          setGenerating(false);
          setMountCapture(false);
          setCaptureNode(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mountCapture, captureNode, fileName]);

  return (
    <>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={generating}
        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        title={t('collection.generate-image')}
      >
        {generating ? (
          <div
            className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600"
          />
        ) : (
          <PhotoIcon className="h-4 w-4" />
        )}
      </button>

      {/* Image rendering area */}
      {mountCapture &&
        createPortal(
          <div className="fixed top-0 left-[-10000px] w-[1664px] bg-white">
            <div ref={setCaptureNode} className="bg-white text-gray-900">
              {/* Header */}
              <div className="px-8 pt-6">
                <h1 className="text-3xl leading-tight font-bold">{collection.name}</h1>
                <p className="mt-1 text-xl font-medium text-gray-700">{templateName}</p>
              </div>

              {/* Grid */}
              <div className="px-8 py-4">
                <CollectionGrid collection={collection} mode="export" />
              </div>

              {/* Footer meta: left / right */}
              <div className="text-md px-8 pb-4 text-gray-500">
                <div className="grid grid-cols-[1fr_auto] items-end gap-4">
                  <div>
                    Template: {templateId} / Collection: {collection.id} / Profile: {profileId}
                  </div>
                  <div className="text-right whitespace-nowrap">
                    {APP_NAME} {LONG_VERSION} / {window.location.hostname} /{' '}
                    {new Date().toLocaleString(i18n.language, { timeZoneName: 'short' })}
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
