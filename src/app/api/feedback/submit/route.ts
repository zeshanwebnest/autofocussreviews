import { NextRequest, NextResponse, after } from 'next/server';
import { DataRepository } from '@/lib/data-repository';
import { validateCustomerName, validateIndianPhone, validateRating, sanitizeComment } from '@/lib/validations';
import { dispatchSubmissionWebhook } from '@/lib/webhook';
import { dispatchNegativeReviewAlert } from '@/lib/alerts';
import { WebhookPayload } from '@/types/app.types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, name, phone, rating, comment, source } = body;

    if (!clientId) {
      return NextResponse.json({ success: false, error: 'Client ID is required.' }, { status: 400 });
    }

    // 1. Fetch client config. The shop a submission belongs to is always
    //    resolved server-side from this record, never trusted from the body.
    const client = await DataRepository.getClientById(clientId);
    if (!client) {
      return NextResponse.json({ success: false, error: 'Business not found.' }, { status: 404 });
    }

    if (client.status !== 'active') {
      return NextResponse.json({ success: false, error: 'This business feedback capture is currently paused.' }, { status: 403 });
    }

    // 2. Validate input fields
    const ratingVal = validateRating(rating);
    if (!ratingVal.isValid || ratingVal.value === undefined) {
      return NextResponse.json({ success: false, error: ratingVal.error }, { status: 400 });
    }

    const nameVal = validateCustomerName(name);
    if (!nameVal.isValid || !nameVal.value) {
      return NextResponse.json({ success: false, error: nameVal.error }, { status: 400 });
    }

    const phoneVal = validateIndianPhone(phone);
    if (!phoneVal.isValid || !phoneVal.value) {
      return NextResponse.json({ success: false, error: phoneVal.error }, { status: 400 });
    }

    const cleanComment = sanitizeComment(comment);

    // 3. Insert submission
    const submission = await DataRepository.insertSubmission({
      client_id: client.id,
      name: nameVal.value,
      phone: phoneVal.value,
      rating: ratingVal.value,
      comment: cleanComment,
      source: source || 'qr',
    });

    const isAlert = ratingVal.value <= client.alert_threshold;

    // 4. Notify the shop. Both of these run through `after()` so the customer
    //    gets their thank-you screen immediately, while the work still
    //    completes — a bare floating promise can be cut off when a serverless
    //    function returns its response.
    if (isAlert) {
      after(async () => {
        const result = await dispatchNegativeReviewAlert(client, submission);
        if (result.status !== 'sent') {
          console.warn(
            `[Submit] alert for ${submission.id} (${client.id}) was ${result.status}: ${result.reason ?? 'no reason given'}`
          );
        }
      });
    }

    // The Make.com webhook is retained alongside email for shops that use it.
    if (client.webhook_url && client.id !== 'demo') {
      const webhookPayload: WebhookPayload = {
        event: 'submission.created',
        submissionId: submission.id,
        clientId: client.id,
        businessName: client.business_name,
        customer: {
          name: submission.name,
          phone: submission.phone,
        },
        rating: submission.rating,
        isAlert,
        comment: submission.comment,
        source: submission.source,
        ownerContact: {
          whatsapp: client.owner_whatsapp,
          email: client.owner_email,
        },
        googleReviewUrl: client.google_review_url,
        timestamp: submission.created_at,
      };

      after(async () => {
        try {
          await dispatchSubmissionWebhook(client.webhook_url, webhookPayload);
        } catch (err) {
          console.error('[Webhook Dispatch Error]', err);
        }
      });
    }

    // 5. Respond with client info needed for thank you / recovery states
    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      client: {
        id: client.id,
        business_name: client.business_name,
        brand_colour: client.brand_colour,
        google_review_url: client.google_review_url,
        alert_threshold: client.alert_threshold,
      },
    });
  } catch (error: any) {
    console.error('[Submit API Error]', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
