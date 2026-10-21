import { createAdminClient } from '@/lib/supabase/admin';

export interface NotificationSettings {
  id: string;
  scope: 'global' | 'client';
  client_id: string | null;
  recipient_email: string | null;
  cc_emails: string[];
  enabled: boolean;
  updated_at: string;
}

export interface EmailLogEntry {
  id: string;
  submission_id: string | null;
  client_id: string | null;
  kind: string;
  recipients: string[];
  cc: string[];
  subject: string | null;
  status: 'sent' | 'failed' | 'skipped';
  provider_id: string | null;
  error: string | null;
  created_at: string;
}

function admin() {
  const supabase = createAdminClient();
  if (!supabase) {
    throw new Error('Supabase is not configured; notification settings are unavailable.');
  }
  return supabase;
}

function fail(operation: string, error: { message: string }): never {
  throw new Error(`[NotificationsRepository] ${operation} failed: ${error.message}`);
}

/** Basic shape check — enough to stop obvious typos reaching the mail provider. */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function normaliseEmails(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  for (const raw of values) {
    if (typeof raw !== 'string') continue;
    const cleaned = raw.trim().toLowerCase();
    if (cleaned && isValidEmail(cleaned)) seen.add(cleaned);
  }
  return [...seen];
}

export const NotificationsRepository = {
  async getGlobal(): Promise<NotificationSettings | null> {
    const { data, error } = await admin()
      .from('notification_settings')
      .select('*')
      .eq('scope', 'global')
      .maybeSingle();
    if (error) fail('getGlobal', error);
    return (data ?? null) as NotificationSettings | null;
  },

  async getForClient(clientId: string): Promise<NotificationSettings | null> {
    const { data, error } = await admin()
      .from('notification_settings')
      .select('*')
      .eq('scope', 'client')
      .eq('client_id', clientId.toLowerCase())
      .maybeSingle();
    if (error) fail(`getForClient(${clientId})`, error);
    return (data ?? null) as NotificationSettings | null;
  },

  async listClientSettings(): Promise<NotificationSettings[]> {
    const { data, error } = await admin()
      .from('notification_settings')
      .select('*')
      .eq('scope', 'client');
    if (error) fail('listClientSettings', error);
    return (data ?? []) as NotificationSettings[];
  },

  async saveGlobal(input: {
    recipient_email: string | null;
    cc_emails: string[];
    enabled: boolean;
    updated_by?: string | null;
  }): Promise<NotificationSettings> {
    const existing = await this.getGlobal();
    const payload = {
      scope: 'global' as const,
      client_id: null,
      recipient_email: input.recipient_email,
      cc_emails: input.cc_emails,
      enabled: input.enabled,
      updated_at: new Date().toISOString(),
      updated_by: input.updated_by ?? null,
    };

    const query = existing
      ? (admin().from('notification_settings') as any).update(payload).eq('id', existing.id)
      : (admin().from('notification_settings') as any).insert(payload);

    const { data, error } = await query.select().single();
    if (error) fail('saveGlobal', error);
    return data as NotificationSettings;
  },

  async saveForClient(
    clientId: string,
    input: {
      recipient_email: string | null;
      cc_emails: string[];
      enabled: boolean;
      updated_by?: string | null;
    }
  ): Promise<NotificationSettings> {
    const id = clientId.toLowerCase();
    const existing = await this.getForClient(id);
    const payload = {
      scope: 'client' as const,
      client_id: id,
      recipient_email: input.recipient_email,
      cc_emails: input.cc_emails,
      enabled: input.enabled,
      updated_at: new Date().toISOString(),
      updated_by: input.updated_by ?? null,
    };

    const query = existing
      ? (admin().from('notification_settings') as any).update(payload).eq('id', existing.id)
      : (admin().from('notification_settings') as any).insert(payload);

    const { data, error } = await query.select().single();
    if (error) fail(`saveForClient(${clientId})`, error);
    return data as NotificationSettings;
  },

  /**
   * Who should be told about a negative review at this shop.
   *
   * The shop's own recipients and the central admin's are merged into one
   * message. Only addresses configured for THIS shop (plus the global admin)
   * are ever included, so no shop can see another shop's contacts.
   */
  async resolveRecipients(clientId: string): Promise<{
    to: string[];
    cc: string[];
    reason?: string;
  }> {
    const [global, forClient] = await Promise.all([
      this.getGlobal(),
      this.getForClient(clientId),
    ]);

    const to = new Set<string>();
    const cc = new Set<string>();

    if (global?.enabled && global.recipient_email) {
      to.add(global.recipient_email.toLowerCase());
      normaliseEmails(global.cc_emails).forEach((e) => cc.add(e));
    }
    if (forClient?.enabled && forClient.recipient_email) {
      to.add(forClient.recipient_email.toLowerCase());
      normaliseEmails(forClient.cc_emails).forEach((e) => cc.add(e));
    }

    // Never CC somebody who is already a primary recipient.
    to.forEach((addr) => cc.delete(addr));

    if (to.size === 0) {
      return {
        to: [],
        cc: [],
        reason:
          'No notification recipient configured for this shop or globally. Set one in the admin panel.',
      };
    }
    return { to: [...to], cc: [...cc] };
  },

  /** True when this submission already produced a successful alert. */
  async hasBeenAlerted(submissionId: string, kind = 'negative_review'): Promise<boolean> {
    const { data, error } = await admin()
      .from('email_log')
      .select('id')
      .eq('submission_id', submissionId)
      .eq('kind', kind)
      .eq('status', 'sent')
      .limit(1);
    if (error) fail('hasBeenAlerted', error);
    return (data ?? []).length > 0;
  },

  async log(entry: {
    submission_id: string | null;
    client_id: string | null;
    kind?: string;
    recipients: string[];
    cc: string[];
    subject: string | null;
    status: 'sent' | 'failed' | 'skipped';
    provider_id?: string | null;
    error?: string | null;
  }): Promise<void> {
    const { error } = await (admin().from('email_log') as any).insert({
      submission_id: entry.submission_id,
      client_id: entry.client_id,
      kind: entry.kind ?? 'negative_review',
      recipients: entry.recipients,
      cc: entry.cc,
      subject: entry.subject,
      status: entry.status,
      provider_id: entry.provider_id ?? null,
      error: entry.error ?? null,
    });

    // A logging failure must never break the customer's submission. The unique
    // index on successful sends can also reject a genuine duplicate here, which
    // is the dedupe working as intended.
    if (error) {
      console.error('[NotificationsRepository] could not write email_log:', error.message);
    }
  },

  async recentLog(clientId: string | null, limit = 50): Promise<EmailLogEntry[]> {
    let query = admin()
      .from('email_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (clientId) query = query.eq('client_id', clientId.toLowerCase());

    const { data, error } = await query;
    if (error) fail('recentLog', error);
    return (data ?? []) as EmailLogEntry[];
  },
};
