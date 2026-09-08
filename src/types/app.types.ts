export type ClientStatus = 'active' | 'paused';

export interface Client {
  id: string; // e.g. "tambi", "demo"
  business_name: string;
  logo_url: string | null;
  brand_colour: string;
  google_review_url: string;
  owner_whatsapp: string | null;
  owner_email: string | null;
  alert_threshold: number; // default: 3
  webhook_url: string | null;
  status: ClientStatus;
  location_id: string | null;
  created_at: string;
}

export interface Submission {
  id: string;
  client_id: string;
  name: string;
  phone: string;
  rating: number; // 1 to 5
  comment: string | null;
  source: string; // default: 'qr'
  created_at: string;
}

export interface WebhookPayload {
  event: 'submission.created';
  submissionId: string;
  clientId: string;
  businessName: string;
  customer: {
    name: string;
    phone: string;
  };
  rating: number;
  isAlert: boolean;
  comment: string | null;
  source: string;
  ownerContact: {
    whatsapp: string | null;
    email: string | null;
  };
  googleReviewUrl: string;
  timestamp: string;
}

export interface SubmitFeedbackInput {
  clientId: string;
  name: string;
  phone: string;
  rating: number;
  comment?: string | null;
  source?: string;
}

export interface SubmitFeedbackResult {
  success: boolean;
  submissionId?: string;
  client?: {
    id: string;
    business_name: string;
    brand_colour: string;
    google_review_url: string;
    alert_threshold: number;
  };
  error?: string;
}
