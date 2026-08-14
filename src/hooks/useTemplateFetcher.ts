import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { debounce } from 'lodash-es';
import { z } from 'zod';
import { type Template } from '@/domain/template';
import { fetchTemplate, formatTemplateError } from '@/services/fetchTemplate';
import { extractTwitterShortenedLink, isTwitterShortenedLink } from '@/utils/twitterShortenedLink';

export type TemplateFetchState =
  | { status: 'idle' }
  | { status: 'invalid-url' }
  | { status: 'loading' }
  | { status: 'success'; template: Template }
  | { status: 'id-mismatch'; template: Template; actualId: string }
  | { status: 'error'; message: string };

type TemplateFetcherOptions = {
  initialUrl?: string;
  expectedId?: string;
  onSuccess?: (template: Template) => void;
};

export function useTemplateFetcher({
  initialUrl = '',
  expectedId,
  onSuccess = () => {},
}: TemplateFetcherOptions) {
  const [url, setUrl] = useState(initialUrl);
  const [state, setState] = useState<TemplateFetchState>({ status: 'idle' });

  const fetchedUrlRef = useRef<string | null>(null);
  const onSuccessRef = useRef(onSuccess);
  useLayoutEffect(() => {
    onSuccessRef.current = onSuccess;
  });

  useEffect(() => {
    const trimmed = url.trim();

    if (!trimmed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ status: 'idle' });
      return;
    }

    const urlResult = z.url().safeParse(trimmed);
    if (!urlResult.success) {
      setState({ status: 'invalid-url' });
      return;
    }

    // Skip the single effect run triggered by setUrl after a redirect and reset the Ref,
    // so the same URL can be fetched again if the user re-enters it.
    if (trimmed === fetchedUrlRef.current) {
      fetchedUrlRef.current = null;
      return;
    }

    let abortController: AbortController | null = null;
    const doFetch = async (url: string) => {
      setState({ status: 'loading' });

      abortController?.abort();
      abortController = new AbortController();

      if (isTwitterShortenedLink(url)) {
        const result = await extractTwitterShortenedLink(url);
        if (!result.success) {
          setState({ status: 'error', message: result.error });
          return;
        }
        setUrl(result.url);
        return;
      }

      try {
        const result = await fetchTemplate(url, undefined, abortController.signal);
        if (!result.success) {
          setState({ status: 'error', message: formatTemplateError(result.error) });
          return;
        }

        if (url !== result.url) {
          fetchedUrlRef.current = result.url;
          setUrl(result.url);
        }

        if (expectedId && result.template.id !== expectedId) {
          setState({
            status: 'id-mismatch',
            template: result.template,
            actualId: result.template.id,
          });
        } else {
          setState({ status: 'success', template: result.template });
        }
        onSuccessRef.current?.(result.template);
      } catch (e) {
        // Ignore AbortError
        if (e instanceof Error && e.name === 'AbortError') return;
        setState({ status: 'error', message: 'Unknown error' });
      }
    };
    const debouncedFetch = debounce(doFetch, 500);
    debouncedFetch(trimmed);

    return () => {
      debouncedFetch.cancel();
      abortController?.abort();
    };
  }, [url, expectedId]);

  return {
    url,
    setUrl,
    state,
    template: state.status === 'success' ? state.template : null,
  };
}
