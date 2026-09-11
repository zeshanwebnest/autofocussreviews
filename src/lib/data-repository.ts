import { Client, Submission } from '@/types/app.types';
import { createAdminClient } from '@/lib/supabase/admin';

// Fallback seed database for local development and test runs
let localClients: Client[] = [
  {
    id: 'tambi',
    business_name: 'Tambi Filter Coffee',
    logo_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=120&auto=format&fit=crop&q=80',
    brand_colour: '#B45309', // Warm South Indian filter coffee amber/brown
    google_review_url: 'https://g.page/r/CS7_SFlSItxZEBM/review',
    owner_whatsapp: '+919820012345',
    owner_email: 'owner@tambicafe.in',
    alert_threshold: 3,
    webhook_url: 'https://hook.eu2.make.com/demo-tambi-webhook',
    status: 'active',
    location_id: 'vasai-west',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'demo',
    business_name: 'Demo Café & Kitchen',
    logo_url: null,
    brand_colour: '#2563EB',
    google_review_url: 'https://g.page/r/CS7_SFlSItxZEBM/review',
    owner_whatsapp: '+919999999999',
    owner_email: 'demo@autofocuss.com',
    alert_threshold: 3,
    webhook_url: null,
    status: 'active',
    location_id: null,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

let localSubmissions: Submission[] = [
  {
    id: 'sub-tambi-001',
    client_id: 'tambi',
    name: 'Rohan Sharma',
    phone: '9820198201',
    rating: 5,
    comment: 'Authentic degree filter coffee and piping hot medu vada! Best spot in Vasai.',
    source: 'qr',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'sub-tambi-002',
    client_id: 'tambi',
    name: 'Priya Patil',
    phone: '9769123456',
    rating: 5,
    comment: 'Quick service and lovely atmosphere for morning breakfast.',
    source: 'qr',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: 'sub-tambi-003',
    client_id: 'tambi',
    name: 'Amit Sawant',
    phone: '9167890123',
    rating: 2,
    comment: 'Waiting time for the table was almost 25 minutes on Sunday morning.',
    source: 'qr',
    created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
  },
];

export const DataRepository = {
  async getClientById(id: string): Promise<Client | null> {
    const supabase = createAdminClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id.toLowerCase())
        .single();
      if (!error && data) {
        return data as Client;
      }
    }
    const client = localClients.find((c) => c.id.toLowerCase() === id.toLowerCase());
    return client || null;
  },

  async getAllClients(): Promise<Client[]> {
    const supabase = createAdminClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        return data as Client[];
      }
    }
    return [...localClients];
  },

  async upsertClient(client: Partial<Client> & { id: string; business_name: string; google_review_url: string }): Promise<Client> {
    const supabase = createAdminClient();
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

    if (supabase) {
      const { data, error } = await (supabase.from('clients') as any)
        .upsert(clientRecord)
        .select()
        .single();
      if (!error && data) {
        return data as Client;
      }
    }

    const idx = localClients.findIndex((c) => c.id === cleanId);
    if (idx >= 0) {
      localClients[idx] = clientRecord;
    } else {
      localClients.unshift(clientRecord);
    }
    return clientRecord;
  },

  async deleteClient(id: string): Promise<boolean> {
    const cleanId = id.toLowerCase();
    const supabase = createAdminClient();
    if (supabase) {
      const { error } = await supabase.from('clients').delete().eq('id', cleanId);
      if (!error) return true;
    }
    localClients = localClients.filter((c) => c.id !== cleanId);
    localSubmissions = localSubmissions.filter((s) => s.client_id !== cleanId);
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
    const supabase = createAdminClient();
    const submissionRecord: Submission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      client_id: data.client_id.toLowerCase(),
      name: data.name.trim(),
      phone: data.phone.trim(),
      rating: data.rating,
      comment: data.comment ? data.comment.trim() : null,
      source: data.source || 'qr',
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      const { data: inserted, error } = await (supabase.from('submissions') as any)
        .insert({
          client_id: submissionRecord.client_id,
          name: submissionRecord.name,
          phone: submissionRecord.phone,
          rating: submissionRecord.rating,
          comment: submissionRecord.comment,
          source: submissionRecord.source,
        })
        .select()
        .single();
      if (!error && inserted) {
        return inserted as Submission;
      }
    }

    localSubmissions.unshift(submissionRecord);
    return submissionRecord;
  },

  async getSubmissionsByClientId(clientId: string): Promise<Submission[]> {
    const cleanId = clientId.toLowerCase();
    const supabase = createAdminClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('client_id', cleanId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        return data as Submission[];
      }
    }
    return localSubmissions.filter((s) => s.client_id === cleanId);
  },

  async getAllSubmissions(): Promise<Submission[]> {
    const supabase = createAdminClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        return data as Submission[];
      }
    }
    return [...localSubmissions];
  },

  async getClientStats(clientId: string) {
    const submissions = await this.getSubmissionsByClientId(clientId);
    const count = submissions.length;
    if (count === 0) {
      return { count: 0, averageRating: 0, happyCount: 0, alertCount: 0 };
    }
    const sum = submissions.reduce((acc, curr) => acc + curr.rating, 0);
    const happyCount = submissions.filter((s) => s.rating >= 4).length;
    const alertCount = submissions.filter((s) => s.rating <= 3).length;
    return {
      count,
      averageRating: parseFloat((sum / count).toFixed(1)),
      happyCount,
      alertCount,
    };
  },
};
