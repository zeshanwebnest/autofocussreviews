import { WebhookPayload } from '@/types/app.types';

export interface WebhookDispatchResult {
  dispatched: boolean;
  statusCode?: number;
  error?: string;
}

/**
 * Dispatches an asynchronous POST webhook to the client's configured Make.com URL.
 */
export async function dispatchSubmissionWebhook(
  webhookUrl: string | null | undefined,
  payload: WebhookPayload
): Promise<WebhookDispatchResult> {
  // If demo client or no webhook configured, gracefully skip
  if (!webhookUrl || webhookUrl.trim() === '' || payload.clientId === 'demo') {
    return { dispatched: false, error: 'No webhook URL configured or demo client.' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Autofocuss-Webhook-Dispatcher/1.0',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[Webhook] Webhook endpoint responded with status ${response.status}`);
      return {
        dispatched: false,
        statusCode: response.status,
        error: `Webhook returned status ${response.status}`,
      };
    }

    return {
      dispatched: true,
      statusCode: response.status,
    };
  } catch (err: any) {
    console.error('[Webhook] Failed to dispatch webhook:', err.message);
    return {
      dispatched: false,
      error: err.name === 'AbortError' ? 'Webhook request timed out' : err.message,
    };
  }
}
