import { Client, Submission } from '@/types/app.types';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Every read and write goes to Supabase.
 *
 * This repository deliberately has NO in-memory fallback. An earlier version
 * swallowed database errors and returned hard-coded sample records instead,
 * which made failures invisible: the feedback form reported success while the
 * submission was dropped. Now that shop owners have their own dashboards it
 * would be worse than invisible — a transient error could serve one shop the
 * sample data belonging to another. Failing loudly is the only safe behaviour.
 */
function admin() {
  const supabase = createAdminClient();
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Both NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.'
    );
  }
  return supabase;
}

function fail(operation: string, error: { message: string }): never {
  throw new Error(`[DataRepository] ${operation} failed: ${error.message}`);
}

export const DataRepository = {
  /** Returns null when the shop genuinely does not exist; throws on any error. */
  async getClientById(id: string): Promise<Client | null> {
    const { data, error } = await admin()
      .from('clients')
      .select('*')
      .eq('id', id.toLowerCase())
      .maybeSingle();

    if (error) fail(`getClientById(${id})`, error);
    return (data ?? null) as Client | null;
  },

  async getAllClients(): Promise<Client[]> {
    const { data, error } = await admin()
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) fail('getAllClients', error);
    return (data ?? []) as Client[];
  },

  async upsertClient(
    client: Partial<Client> & { id: string; business_name: string; google_review_url: string }
  ): Promise<Client> {
    const cleanId = client.id.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-');

    const clientRecord: Client = {
      id: cleanId,
      business_name: client.business_name.trim(),
      logo_url: client.logo_url || null,
      brand_colour: client.brand_colour || '#2563EB',
      google_review_url: client.google_review_url.trim(),
      owner_whatsapp: client.owner_whatsapp || null,
      owner_email: client.owner_email || null,
      alert_threshold: client.alert_threshold ?? 3,
      webhook_url: client.webhook_url || null,
      status: client.status || 'active',
      location_id: client.location_id || null,
      created_at: client.created_at || new Date().toISOString(),
    };

    const { data, error } = await (admin().from('clients') as any)
      .upsert(clientRecord)
      .select()
      .single();

    if (error) fail(`upsertClient(${cleanId})`, error);
    return data as Client;
  },

  async deleteClient(id: string): Promise<boolean> {
    const { error } = await admin().from('clients').delete().eq('id', id.toLowerCase());
    if (error) fail(`deleteClient(${id})`, error);
    return true;
  },

  async insertSubmission(data: {
    client_id: string;
    name: string;
    phone: string;
    rating: number;
    comment?: string | null;
    source?: string;
  }): Promise<Submission> {
    const { data: inserted, error } = await (admin().from('submissions') as any)
      .insert({
        client_id: data.client_id.toLowerCase(),
        name: data.name.trim(),
        phone: data.phone.trim(),
        rating: data.rating,
        comment: data.comment ? data.comment.trim() : null,
        source: data.source || 'qr',
      })
      .select()
      .single();

    if (error) fail('insertSubmission', error);
    return inserted as Submission;
  },

  async getSubmissionsByClientId(clientId: string): Promise<Submission[]> {
    const { data, error } = await admin()
      .from('submissions')
      .select('*')
      .eq('client_id', clientId.toLowerCase())
      .order('created_at', { ascending: false });

    if (error) fail(`getSubmissionsByClientId(${clientId})`, error);
    return (data ?? []) as Submission[];
  },

  async getAllSubmissions(): Promise<Submission[]> {
    const { data, error } = await admin()
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) fail('getAllSubmissions', error);
    return (data ?? []) as Submission[];
  },

  async getClientStats(clientId: string) {
    const submissions = await this.getSubmissionsByClientId(clientId);
    return computeStats(submissions);
  },
};

/**
 * Shared so the central admin, the shop filter and the owner dashboard all
 * report identical numbers from the same rows.
 */
export function computeStats(submissions: Submission[]) {
  const count = submissions.length;
  if (count === 0) {
    return { count: 0, averageRating: 0, happyCount: 0, alertCount: 0 };
  }
  const sum = submissions.reduce((acc, curr) => acc + curr.rating, 0);
  return {
    count,
    averageRating: parseFloat((sum / count).toFixed(1)),
    happyCount: submissions.filter((s) => s.rating >= 4).length,
    alertCount: submissions.filter((s) => s.rating <= 3).length,
  };
}
