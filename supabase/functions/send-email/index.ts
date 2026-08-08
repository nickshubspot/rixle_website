// supabase/functions/send-email/index.ts
//
// Sends a notification email when a new row is inserted into
// public.contact_submissions. Intended to be invoked by a Supabase
// Database Webhook (Database → Webhooks → INSERT on
// contact_submissions → HTTP Request → this function), NOT called
// directly from the public website.
//
// Required secrets (set via `supabase secrets set`):
//   RESEND_API_KEY   - API key for the Resend transactional email API
//   NOTIFY_TO_EMAIL  - Address that should receive lead notifications
//   NOTIFY_FROM_EMAIL- Verified "from" address on the Resend domain
//   FUNCTION_SECRET  - Shared secret; must match the webhook's
//                      configured "Authorization: Bearer <secret>" header
//
// This function deliberately does NOT use the anon key and is not
// meant to be reachable from client-side JS.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const NOTIFY_TO_EMAIL = Deno.env.get('NOTIFY_TO_EMAIL');
const NOTIFY_FROM_EMAIL = Deno.env.get('NOTIFY_FROM_EMAIL');
const FUNCTION_SECRET = Deno.env.get('FUNCTION_SECRET');

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

interface ContactSubmissionRecord {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company: string | null;
  subject: string;
  message: string;
  created_at: string;
}

interface DatabaseWebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: ContactSubmissionRecord | null;
  old_record: ContactSubmissionRecord | null;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateRecord(record: unknown): record is ContactSubmissionRecord {
  if (typeof record !== 'object' || record === null) return false;
  const r = record as Record<string, unknown>;
  return (
    isNonEmptyString(r.id) &&
    isNonEmptyString(r.full_name) &&
    isNonEmptyString(r.email) &&
    isNonEmptyString(r.phone) &&
    isNonEmptyString(r.subject) &&
    isNonEmptyString(r.message) &&
    isNonEmptyString(r.created_at) &&
    (r.company === null || typeof r.company === 'string')
  );
}

function buildEmailHtml(record: ContactSubmissionRecord): string {
  const rows: Array<[string, string]> = [
    ['Full Name', record.full_name],
    ['Email', record.email],
    ['Phone', record.phone],
    ['Company', record.company ?? '—'],
    ['Inquiry Category', record.subject],
    ['Submitted At', record.created_at]
  ];

  const rowsHtml = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:8px 12px;font-weight:600;color:#333;white-space:nowrap;">${escapeHtml(label)}</td>
          <td style="padding:8px 12px;color:#111;">${escapeHtml(value)}</td>
        </tr>`
    )
    .join('');

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;">
      <h2 style="color:#111;">New Contact Form Submission</h2>
      <table style="border-collapse:collapse;width:100%;">
        ${rowsHtml}
      </table>
      <div style="margin-top:16px;">
        <div style="font-weight:600;color:#333;margin-bottom:4px;">Message</div>
        <div style="white-space:pre-wrap;background:#f5f5f5;border-radius:6px;padding:12px;color:#111;">${escapeHtml(record.message)}</div>
      </div>
    </div>
  `;
}

async function sendNotificationEmail(record: ContactSubmissionRecord): Promise<void> {
  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: NOTIFY_FROM_EMAIL,
      to: [NOTIFY_TO_EMAIL],
      reply_to: record.email,
      subject: `New Inquiry: ${record.subject} — ${record.full_name}`,
      html: buildEmailHtml(record)
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Resend API error (${response.status}): ${errorText}`);
  }
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  if (!RESEND_API_KEY || !NOTIFY_TO_EMAIL || !NOTIFY_FROM_EMAIL || !FUNCTION_SECRET) {
    console.error('send-email function is missing required environment configuration.');
    return jsonResponse({ error: 'Server misconfiguration' }, 500);
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const expected = `Bearer ${FUNCTION_SECRET}`;
  if (authHeader !== expected) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  let payload: DatabaseWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  if (payload.type !== 'INSERT' || payload.table !== 'contact_submissions') {
    // Not an event we care about; acknowledge without side effects.
    return jsonResponse({ skipped: true }, 200);
  }

  if (!validateRecord(payload.record)) {
    return jsonResponse({ error: 'Malformed contact_submissions record' }, 400);
  }

  try {
    await sendNotificationEmail(payload.record);
  } catch (err) {
    console.error('Failed to send notification email:', err);
    return jsonResponse({ error: 'Failed to send notification email' }, 502);
  }

  return jsonResponse({ success: true }, 200);
});
