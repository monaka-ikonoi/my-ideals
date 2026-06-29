import { useEffect, useState } from 'react';
import { TemplateManifestSchema, type TemplateManifestEntry } from '@/domain/template';
import { getErrorMessage } from '@/utils/error';
import { debugLog } from '@/utils/debug';

export function usePredefinedTemplates() {
  const [templates, setTemplates] = useState<TemplateManifestEntry[]>([]);

  useEffect(() => {
    const listUrl = import.meta.env.VITE_PREDEFINED_TEMPLATES;
    if (!listUrl || !listUrl.trim()) return;

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(listUrl, { signal: controller.signal });
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
      }
    })();

    return () => controller.abort();
  }, []);

  return templates;
}
