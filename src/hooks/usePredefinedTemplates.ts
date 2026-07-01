import { useEffect, useState } from 'react';
import { TemplateManifestSchema, type TemplateManifestEntry } from '@/domain/template';
import { getErrorMessage } from '@/utils/error';
import { debugLog } from '@/utils/debug';

const manifestUrl = import.meta.env.VITE_PREDEFINED_TEMPLATES?.trim();

export function usePredefinedTemplates() {
  const [templates, setTemplates] = useState<TemplateManifestEntry[]>([]);
  const [loading, setLoading] = useState(Boolean(manifestUrl));

  useEffect(() => {
    if (!manifestUrl) return;

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(manifestUrl, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const result = TemplateManifestSchema.safeParse(data);
        if (!result.success) {
          debugLog.network.error('Failed to parse template manifest: ', result.error);
          return;
        }
        setTemplates(result.data.templates);
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        debugLog.network.error('Failed to load template manifest:', getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  return { configured: !!manifestUrl, loading, templates };
}
