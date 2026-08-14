// services/templateService.ts
import { TemplateSchema, type Template } from '@/domain/template';
import { debugLog } from './debug';
import { getErrorMessage } from './error';

export type FetchTemplateResult =
  { success: true; url: string; template: Template } | { success: false; error: TemplateError };

export type TemplateError =
  | { type: 'network'; message: string }
  | { type: 'http'; status: number; statusText: string }
  | { type: 'parse'; message: string }
  | { type: 'id-mismatch'; expectedId: string; actualId: string };

export function formatTemplateError(error: TemplateError): string {
  switch (error.type) {
    case 'network':
      return error.message;
    case 'http':
      return `HTTP ${error.status}: ${error.statusText}`;
    case 'parse':
      return `Invalid template:\n${error.message}`;
    case 'id-mismatch':
      return `Template ID mismatch: expected "${error.expectedId}", got "${error.actualId}"`;
  }
}

export async function fetchTemplate(
  url: string,
  expectedId?: string,
  signal?: AbortSignal
): Promise<FetchTemplateResult> {
  let response: Response;
  try {
    response = await fetch(url, { signal, redirect: 'follow' });
  } catch (e) {
    // AbortError should be handled by caller
    if (e instanceof Error && e.name === 'AbortError') {
      throw e;
    }
    return {
      success: false,
      error: {
        type: 'network',
        message: e instanceof Error ? e.message : 'Network error',
      },
    };
  }

  if (!response.ok) {
    return {
      success: false,
      error: {
        type: 'http',
        status: response.status,
        statusText: response.statusText,
      },
    };
  }

  let template: Template;
  try {
    const data = await response.json();
    template = TemplateSchema.parse(data);
  } catch (e) {
    return {
      success: false,
      error: { type: 'parse', message: getErrorMessage(e) },
    };
  }

  if (expectedId && template.id !== expectedId) {
    return {
      success: false,
      error: {
        type: 'id-mismatch',
        expectedId,
        actualId: template.id,
      },
    };
  }

  if (response.redirected) {
    debugLog.network.log(`Template URL redirected from ${url} to ${response.url}`);
  }

  debugLog.network.log(`Fetched template ${template.name}, ${template.id}`);
  return { success: true, url: response.url, template };
}
