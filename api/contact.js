// ============================================================
// RURAL SYSTEMS — Contact Form API
// Vercel Serverless Function
// Sends form submissions via Brevo Transactional Email API
// ============================================================

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const RECIPIENT_EMAIL = 'connect@ruralsystems.org';
const SENDER_EMAIL = 'connect@ruralsystems.org';
const SENDER_NAME = 'Rural Systems';

// Form type metadata — maps data-form values to readable labels and subjects
const FORM_CONFIG = {
  'business-inquiry': {
    label: 'Business & Investor Inquiry',
    subject: 'New Business Inquiry',
    confirmSubject: 'Thank you for your interest in partnering with Rural Systems',
  },
  'community-interest': {
    label: 'Community Expression of Interest',
    subject: 'New Community Expression of Interest',
    confirmSubject: 'Thank you for reaching out to Rural Systems',
  },
  'government-inquiry': {
    label: 'Government & Agency Inquiry',
    subject: 'New Government / Agency Inquiry',
    confirmSubject: 'Thank you for contacting Rural Systems',
  },
  'talent-inquiry': {
    label: 'Talent & Collaborator Application',
    subject: 'New Talent Application',
    confirmSubject: 'Thank you for wanting to join the mission',
  },
};

// Field display names for cleaner email formatting
const FIELD_LABELS = {
  company: 'Company / Organization',
  name: 'Contact Name',
  email: 'Email',
  sector: 'Industry / Sector',
  investment_range: 'Investment Range',
  message: 'Message',
  community: 'Community Name',
  contact: 'Contact Person',
  contact_info: 'Email or Phone',
  location: 'Location / Region',
  region: 'Region / Country',
  households: 'Approximate Households',
  organization: 'Organization / Ministry',
  country: 'Country / Region',
  interest_area: 'Area of Interest',
  expertise: 'Area of Expertise',
};

/**
 * Builds a clean HTML email body from form data
 */
function buildNotificationEmail(formType, fields) {
  const config = FORM_CONFIG[formType] || { label: 'General Inquiry' };

  const rows = Object.entries(fields)
    .filter(([key]) => key !== '_form_type') // Skip internal fields
    .map(([key, value]) => {
      const label = FIELD_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return `
        <tr>
          <td style="padding: 10px 16px; font-weight: 600; color: #A89F91; vertical-align: top; white-space: nowrap; border-bottom: 1px solid #232726; width: 180px;">${label}</td>
          <td style="padding: 10px 16px; color: #F0EDE6; border-bottom: 1px solid #232726;">${escapeHtml(String(value))}</td>
        </tr>`;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; background: #0D0F0E; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 24px;">
        <div style="margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid #C9A84C;">
          <h1 style="margin: 0; font-size: 14px; letter-spacing: 0.15em; text-transform: uppercase; color: #C9A84C; font-weight: 600;">Rural Systems</h1>
        </div>
        <h2 style="margin: 0 0 8px; font-size: 22px; color: #F0EDE6; font-weight: 400;">${config.label}</h2>
        <p style="margin: 0 0 32px; font-size: 14px; color: #6B6560;">Received from ruralsystems.org</p>
        <table style="width: 100%; border-collapse: collapse; background: #1A1D1C; border-radius: 8px; overflow: hidden;">
          ${rows}
        </table>
        <p style="margin-top: 32px; font-size: 12px; color: #6B6560;">This is an automated notification from the Rural Systems website contact forms.</p>
      </div>
    </body>
    </html>`;
}

/**
 * Builds a confirmation email for the person who submitted the form
 */
function buildConfirmationEmail(formType, contactName) {
  const config = FORM_CONFIG[formType] || { confirmSubject: 'Thank you for contacting Rural Systems' };
  const name = contactName || 'there';

  return `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; background: #0D0F0E; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 560px; margin: 0 auto; padding: 40px 24px;">
        <div style="margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid #C9A84C;">
          <h1 style="margin: 0; font-size: 14px; letter-spacing: 0.15em; text-transform: uppercase; color: #C9A84C; font-weight: 600;">Rural Systems</h1>
        </div>
        <p style="font-size: 16px; color: #F0EDE6; line-height: 1.7;">Hello ${escapeHtml(name)},</p>
        <p style="font-size: 16px; color: #A89F91; line-height: 1.7;">Thank you for reaching out to Rural Systems. We have received your message and will respond within 48 hours.</p>
        <p style="font-size: 16px; color: #A89F91; line-height: 1.7;">In the meantime, you can explore our vision and model at <a href="https://ruralsystems.org" style="color: #C9A84C;">ruralsystems.org</a>.</p>
        <p style="font-size: 16px; color: #A89F91; line-height: 1.7; margin-top: 24px;">With purpose,<br><strong style="color: #F0EDE6;">Rural Systems</strong></p>
        <div style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #232726;">
          <p style="font-size: 12px; color: #6B6560; margin: 0;">Rural Systems · The operating system for rural reinvention.<br>connect@ruralsystems.org · ruralsystems.org</p>
        </div>
      </div>
    </body>
    </html>`;
}

/**
 * Sends an email via the Brevo Transactional API
 */
async function sendEmail(to, toName, subject, htmlContent) {
  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: to, name: toName || to }],
      subject: subject,
      htmlContent: htmlContent,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Brevo API error (${response.status}): ${errorBody}`);
  }

  return response.json();
}

/**
 * Simple HTML escaping to prevent injection
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================
// Vercel Serverless Handler
// ============================================================
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate API key is configured
  if (!process.env.BREVO_API_KEY) {
    console.error('BREVO_API_KEY environment variable is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const body = req.body;

    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const formType = body._form_type || 'general';
    const config = FORM_CONFIG[formType] || { subject: 'New Inquiry', label: 'General Inquiry', confirmSubject: 'Thank you' };

    // 1. Send notification email to Rural Systems
    const notificationHtml = buildNotificationEmail(formType, body);
    await sendEmail(
      RECIPIENT_EMAIL,
      SENDER_NAME,
      `${config.subject} — ruralsystems.org`,
      notificationHtml
    );

    // 2. Send confirmation email to the submitter (if they provided an email)
    const submitterEmail = body.email || body.contact_info;
    const submitterName = body.name || body.contact || null;

    if (submitterEmail && submitterEmail.includes('@')) {
      const confirmationHtml = buildConfirmationEmail(formType, submitterName);
      await sendEmail(
        submitterEmail,
        submitterName || submitterEmail,
        config.confirmSubject,
        confirmationHtml
      );
    }

    return res.status(200).json({ success: true, message: 'Form submitted successfully' });

  } catch (error) {
    console.error('Form submission error:', error.message);
    return res.status(500).json({ error: 'Failed to process submission. Please try again.' });
  }
}
