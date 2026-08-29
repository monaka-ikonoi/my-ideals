import { memo, useCallback } from 'react';
import { type TemplateCollectionItem } from '@/domain/template';
import {
  getPrimaryField,
  type ItemRecord,
  type RecordField,
  type RecordMode,
  type RecordValue,
} from '@/domain/profile';
import { useImageOptions } from '@/contexts/imageOptions';
import { useTemplate } from '@/contexts/template';
import { getActiveProfile } from '@/stores/profileSessionStore';
import { debugLog } from '@/utils/debug';
import { normalizeStatusBoolean } from '@/utils/utils';
import { readField } from '@/utils/recordUtils';
import { formatImageUrl } from '@/utils/templateUtils';
import { ItemBadge } from './ItemBadge';
import { ItemCaption } from './ItemCaption';
import { ItemImage } from './ItemImage';
import { RecordFieldList } from './RecordFieldList';
import { type ItemCardMode } from './types';

type ItemCardProps = {
  collectionId: string;
  item: TemplateCollectionItem;
  mode?: ItemCardMode;
  aspectRatio?: string;
  fields: RecordField[];
  recordMode: RecordMode;
  record: ItemRecord | undefined;
};

export const ItemCard = memo(function ItemCard({
  collectionId,
  item,
  mode = 'normal',
  aspectRatio = '7/10',
  fields,
  recordMode,
  record,
}: ItemCardProps) {
  debugLog.render.log(`ItemCard: ${collectionId} ${item.id}`);

  const imageOptions = useImageOptions();
  const { imageBaseUrl, revision } = useTemplate();

  const primaryField = getPrimaryField(fields);
  const primaryValue = readField(record, primaryField);
  const captionField = recordMode === 'standard' ? primaryField : undefined;

  const handleChange = useCallback(
    (fieldId: string, value: RecordValue) =>
      getActiveProfile().setFieldValue(collectionId, item.id, fieldId, value),
    [collectionId, item.id]
  );

  const handleCaptionToggle = useCallback(() => {
    if (!captionField) return;
    handleChange(captionField.id, !normalizeStatusBoolean(primaryValue));
  }, [captionField, handleChange, primaryValue]);

  const isToggled = typeof primaryValue === 'boolean' ? primaryValue : primaryValue !== 0;
  const dimmed = mode === 'export' && !imageOptions.dimUntoggled ? false : !isToggled;
  const showBadges = mode === 'export' || mode === 'edit';

  return (
    <div
      className={`flex w-full flex-col overflow-hidden rounded-md
        ${captionField ? 'cursor-pointer' : ''}`}
      onClick={captionField ? handleCaptionToggle : undefined}
    >
      <ItemImage
        src={item.image ?? formatImageUrl(imageBaseUrl, revision, collectionId, item.id)}
        fallbackSrc={imageBaseUrl?.fallback}
        alt={item.name}
        aspectRatio={item.rotated ? aspectRatio.split('/').reverse().join('/') : aspectRatio}
        dimmed={dimmed}
        eager={mode === 'export'}
      >
        {showBadges &&
          fields.map(field => {
            const badge = imageOptions.badges[field.id];
            if (!badge) return null;

            const value = readField(record, field);
            if (value === field.default) return null;

            return (
              <ItemBadge
                key={field.id}
                field={field}
                value={value}
                config={badge}
                rotated={item.rotated}
              />
            );
          })}

        <ItemCaption name={item.name} mode={mode}>
          {captionField && (
            <input
              id={`dummy-${collectionId}-${item.id}`}
              readOnly
              type="checkbox"
              checked={normalizeStatusBoolean(primaryValue)}
              className="pointer-events-none accent-blue-600"
            />
          )}
        </ItemCaption>
      </ItemImage>

      {mode !== 'export' && !captionField && (
        <RecordFieldList
          fields={fields}
          record={record}
          showLabel={recordMode === 'custom'}
          mode={mode}
          onChange={handleChange}
        />
      )}
    </div>
  );
});
