import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { TemplateCollection } from '@/domain/template';
import { ImageOptionsContext } from '@/contexts/imageOptions';
import { useTemplate } from '@/contexts/template';
import { useActiveProfile } from '@/stores/profileSessionStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { ProfileFlags, profileHasFlag } from '@/domain/profile';
import { downloadFile, shareAPISupported, shareFile } from '@/utils/fileUtils';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { FullScreenModal } from '../ui/FullScreenModal';
import { OffscreenCaptureArea, type CaptureResult } from '../ui/OffscreenCaptureArea';
import { CollectionImageContent } from '../CollectionImageContent';
import { ImageCheckCard } from '../ImageCheckCard';
import { BADGE_POSITIONS, BADGE_SIZES } from '../CountBadgeProps';
import { StepIndicator } from '../ui/StepIndicator';
import { OptionPicker } from '../ui/OptionPicker';
import { getErrorMessage } from '@/utils/error';
import { computeItemWidth, resolveLayout } from '@/utils/layoutUtils';
import { normalizeStatusNumber } from '@/utils/utils';

type Step = 'select' | 'customize' | 'preview';

type ImageGenerateModalProps = {
  collections: TemplateCollection[];
  onClose: () => void;
  preSelectedId?: string;
  maxItems?: number;
};

function buildInitialSelectedIds(
  collections: TemplateCollection[],
  maxCollections: number | null,
  maxItems: number | null
) {
  const selectedIds: string[] = [];
  let totalItems = 0;

  for (const collection of collections) {
    if (maxCollections && selectedIds.length >= maxCollections) break;
    if (maxItems && totalItems + collection.items.length > maxItems) continue;

    selectedIds.push(collection.id);
    totalItems += collection.items.length;
  }

  return selectedIds;
}

export function ImageGenerateModal({
  collections,
  onClose,
  preSelectedId,
  maxItems = 180,
}: ImageGenerateModalProps) {
  const { t, i18n } = useTranslation();

  const { profileId, enableCount, statusMap } = useActiveProfile(
    useShallow(state => ({
      profileId: state.profile.id,
      enableCount: profileHasFlag(state.profile, ProfileFlags.ENABLE_COUNT),
      statusMap: state.profile.collections,
    }))
  );
  const { name: templateName, id: templateId, layout: templateLayout } = useTemplate();

  const [step, setStep] = useState<Step>(() => (preSelectedId ? 'customize' : 'select'));

  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    // Select 3 collections by default
    preSelectedId ? [preSelectedId] : buildInitialSelectedIds(collections, 3, maxItems)
  );
  const [generating, setGenerating] = useState(false);
  const [captureTime, setCaptureTime] = useState('');
  const fileNameRef = useRef('');

  const imageOptions = useSettingsStore(state => state.imageOptions);
  const setImageOptions = useSettingsStore(state => state.setImageOptions);

  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const collectionMap = useMemo(
    () => new Map(collections.map(collection => [collection.id, collection])),
    [collections]
  );

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const selectedCollections = useMemo(
    () => collections.filter(collection => selectedIdSet.has(collection.id)),
    [collections, selectedIdSet]
  );

  const selectedItemCount = useMemo(
    () => selectedCollections.reduce((sum, collection) => sum + collection.items.length, 0),
    [selectedCollections]
  );

  // Collections that can still be selected (not yet at limits)
  const selectableCollections = useMemo(
    () =>
      collections.filter(
        collection =>
          selectedIdSet.has(collection.id) ||
          selectedItemCount + collection.items.length <= maxItems
      ),
    [collections, selectedIdSet, selectedItemCount, maxItems]
  );

  const allSelectableSelected = useMemo(
    () =>
      selectableCollections.length > 0 &&
      selectableCollections.every(collection => selectedIdSet.has(collection.id)),
    [selectableCollections, selectedIdSet]
  );

  const toggleCollection = useCallback(
    (collection: TemplateCollection) => {
      setSelectedIds(prev => {
        if (prev.includes(collection.id)) {
          return prev.filter(id => id !== collection.id);
        }

        const currentItemCount = prev.reduce(
          (sum, id) => sum + (collectionMap.get(id)?.items.length ?? 0),
          0
        );
        if (currentItemCount + collection.items.length > maxItems) return prev;

        return [...prev, collection.id];
      });
    },
    [collectionMap, maxItems]
  );

  const handleGenerate = useCallback(() => {
    if (selectedCollections.length === 0) return;

    setCaptureTime(new Date().toLocaleString(i18n.language, { timeZoneName: 'short' }));
    fileNameRef.current =
      selectedCollections.length === 1
        ? `${templateId}-${selectedCollections[0].id}.png`
        : `${templateId}-${profileId}.png`;

    setStep('preview');
    setGenerating(true);
  }, [i18n.language, selectedCollections, templateId, profileId]);

  // Pick the first non-zero item for preview
  const previewItem = (() => {
    for (const collection of selectedCollections) {
      const collectionStatus = statusMap?.[collection.id];
      const candidate =
        collection.items.find(item => {
          const status = collectionStatus?.[item.id];
          return normalizeStatusNumber(status) !== 0;
        }) ?? collection.items[0];
      if (candidate) {
        return { collection, item: candidate, status: collectionStatus?.[candidate.id] };
      }
    }
    return null;
  })();

  const imageCardLayout = useMemo(
    () =>
      resolveLayout(
        imageOptions.flatten ? undefined : selectedCollections[0]?.layout,
        templateLayout
      ),
    [selectedCollections, templateLayout, imageOptions.flatten]
  );
  const imageCardWidth = useMemo(
    // Export grid width is 1600px
    () => computeItemWidth(1600, imageCardLayout, previewItem?.item?.rotated),
    [imageCardLayout, previewItem]
  );

  const handleCapture = useCallback(
    (result: CaptureResult) => {
      setGenerating(false);

      if (result.success) {
        // Revoke the old URL before replacing
        setImageUrl(prev => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(result.blob);
        });
        setImageBlob(result.blob);
      } else {
        setStep('customize');
        toast.error(t('toast.error', { error: result.error }));
      }
    },
    [t]
  );

  const handleSave = useCallback(() => {
    if (!imageBlob || !fileNameRef.current) return;
    const file = new File([imageBlob], fileNameRef.current, { type: imageBlob.type });
    downloadFile(file);
  }, [imageBlob]);

  const handleShare = useCallback(async () => {
    if (!imageBlob || !fileNameRef.current) return;
    if (!shareAPISupported) return;

    const file = new File([imageBlob], fileNameRef.current, { type: imageBlob.type });
    try {
      await shareFile(file);
    } catch (e) {
      toast.error(t('toast.error', { error: getErrorMessage(e) }));
    }
  }, [imageBlob, t]);

  return (
    <>
      <FullScreenModal isOpen onClose={onClose} title={t('collection.generate-image')}>
        <div className="flex h-full min-h-0 flex-col">
          <div className="shrink-0 px-4 py-2 md:px-6">
            <StepIndicator
              steps={[
                { key: 'select', label: t('dialog.image-generate.step-select') },
                { key: 'customize', label: t('dialog.image-generate.step-customize') },
                { key: 'preview', label: t('dialog.image-generate.step-preview') },
              ]}
              current={step}
            />
          </div>

          {step === 'select' && (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto border-t border-gray-100">
                {collections.length === 0 ? (
                  <div
                    className="flex h-full items-center justify-center px-6 text-sm text-gray-500"
                  >
                    {t('collection.no-result')}
                  </div>
                ) : (
                  <div className="px-4 md:px-6">
                    <div
                      className="sticky top-0 z-10 flex gap-4 border-b border-gray-100 bg-white
                        py-3"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedIds(buildInitialSelectedIds(collections, null, maxItems))
                        }
                        disabled={generating || allSelectableSelected}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700
                          disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {t('common.select-all')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedIds([])}
                        disabled={generating || selectedIds.length === 0}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700
                          disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {t('common.deselect-all')}
                      </button>
                    </div>
                    <div className="space-y-1 py-2">
                      {collections.map(collection => {
                        const checked = selectedIdSet.has(collection.id);
                        const disabled =
                          generating ||
                          (!checked && selectedItemCount + collection.items.length > maxItems);

                        return (
                          <label
                            key={collection.id}
                            className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2
                              hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={disabled}
                              onChange={() => toggleCollection(collection)}
                              className="mt-1 h-4 w-4 rounded border-gray-300 accent-blue-600
                                focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-4">
                                <span
                                  className={`truncate text-sm font-medium ${
                                    disabled && !checked ? 'text-gray-400' : 'text-gray-900'
                                  }`}
                                >
                                  {collection.name}
                                </span>
                                <span className="shrink-0 text-xs text-gray-400">
                                  {collection.items.length}
                                </span>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Select step footer */}
              <div className="shrink-0 border-t border-gray-100 px-4 py-3 md:px-6 md:py-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-gray-400">
                    {t('dialog.image-generate.selected-count', {
                      collections: selectedCollections.length,
                      items: selectedItemCount,
                      maxItems,
                    })}
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep('customize')}
                    disabled={generating || selectedCollections.length === 0}
                    className="min-w-28 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium
                      text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {t('dialog.image-generate.next')}
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 'customize' && (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto border-t border-gray-100">
                <div className="flex flex-col gap-6 p-4 md:flex-row md:items-start md:p-6">
                  {/* Preview */}
                  <div className="mx-auto flex justify-center md:mx-0 md:shrink-0 md:justify-start">
                    {previewItem && (
                      <div style={{ width: `${imageCardWidth}px` }}>
                        <ImageOptionsContext value={imageOptions}>
                          <ImageCheckCard
                            collectionId={previewItem.collection.id}
                            item={previewItem.item}
                            mode="export"
                            aspectRatio={imageCardLayout.aspectRatio}
                            enableCount={enableCount}
                            status={previewItem.status}
                          />
                        </ImageOptionsContext>
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="mx-auto min-w-xs space-y-6 md:mx-0 md:w-full">
                    {/* Badge options only apply when counts are enabled */}
                    {enableCount && (
                      <>
                        {/* Position picker */}
                        <div>
                          <p className="mb-2 text-sm font-medium text-gray-700">
                            {t('dialog.image-generate.options.badge-position-label')}
                          </p>
                          <OptionPicker
                            columns={3}
                            options={BADGE_POSITIONS.map(position => ({
                              value: position,
                              label: t(`dialog.image-generate.options.position.${position}`),
                            }))}
                            value={imageOptions.badge.position}
                            onChange={position =>
                              setImageOptions({ badge: { ...imageOptions.badge, position } })
                            }
                          />
                        </div>

                        {/* Size picker */}
                        <div>
                          <p className="mb-2 text-sm font-medium text-gray-700">
                            {t('dialog.image-generate.options.badge-size-label')}
                          </p>
                          <OptionPicker
                            columns={4}
                            options={BADGE_SIZES.map(size => ({
                              value: size,
                              label: t(`dialog.image-generate.options.size.${size}`),
                            }))}
                            value={imageOptions.badge.size}
                            onChange={size =>
                              setImageOptions({ badge: { ...imageOptions.badge, size } })
                            }
                          />
                        </div>
                      </>
                    )}

                    {/* Do not dim untoggled items checkbox */}
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!imageOptions.dimUntoggled}
                        onChange={e => setImageOptions({ dimUntoggled: !e.target.checked })}
                        disabled={generating}
                        className="h-4 w-4 rounded border-gray-300 accent-blue-600
                          focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {t('dialog.image-generate.options.not-dim-untoggled-label')}
                      </span>
                    </label>

                    {/* Flatten collections checkbox */}
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={imageOptions.flatten}
                        onChange={e => setImageOptions({ flatten: e.target.checked })}
                        disabled={generating}
                        className="h-4 w-4 rounded border-gray-300 accent-blue-600
                          focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {t('dialog.image-generate.options.flatten-collections-label')}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Options step footer */}
              <div className="shrink-0 border-t border-gray-100 px-4 py-3 md:px-6 md:py-4">
                <div className="flex items-center justify-between gap-4">
                  {preSelectedId ? (
                    <span />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setStep('select')}
                      disabled={generating}
                      className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium
                        text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed
                        disabled:opacity-50"
                    >
                      <ArrowLeftIcon className="h-4 w-4" />
                      {t('common.back')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={generating || selectedCollections.length === 0}
                    className="min-w-28 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium
                      text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {t('dialog.image-generate.generate')}
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 'preview' && (
            <>
              {/* Preview step body */}
              <div className="min-h-0 flex-1 overflow-auto border-t border-gray-100">
                <div className="flex min-h-full flex-col p-4">
                  {generating ? (
                    <div className="flex flex-1 items-center justify-center">
                      <div className="flex flex-col items-center gap-3">
                        <div
                          className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200
                            border-t-blue-600"
                        />
                        <span className="text-sm text-gray-500">
                          {t('dialog.image-generate.generating-hint')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    imageUrl && (
                      <img
                        src={imageUrl}
                        className="h-auto max-w-full rounded-md border border-gray-200"
                      />
                    )
                  )}
                </div>
              </div>

              {/* Preview step footer */}
              <div className="shrink-0 border-t border-gray-100 px-4 py-3 md:px-6 md:py-4">
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setStep('customize')}
                    disabled={generating}
                    className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium
                      text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed
                      disabled:opacity-50"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    {t('common.back')}
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleShare}
                      disabled={generating || !imageBlob || !shareAPISupported}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white
                        hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      {t('common.share')}
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={generating || !imageBlob}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white
                        hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      {t('common.download')}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </FullScreenModal>

      <OffscreenCaptureArea active={generating} onComplete={handleCapture} width={1664}>
        <CollectionImageContent
          templateName={templateName}
          templateId={templateId}
          profileId={profileId}
          collections={selectedCollections}
          captureTime={captureTime}
          imageOptions={imageOptions}
        />
      </OffscreenCaptureArea>
    </>
  );
}
