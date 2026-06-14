/**
 * Customer email — sent from Vercel (Node serverless) via Resend.
 *
 * ROOT CAUSE this module exists: the Apps Script web app's executing identity
 * lacks the script.external_request (UrlFetchApp→Resend) and script.send_mail
 * (MailApp) OAuth scopes, so EVERY customer email sent from Apps Script fails
 * silently. Vercel has no such restriction, so it becomes the real sender.
 *
 * The template builders (confirmationEmail/statusEmail/delayEmail/declineEmail)
 * are pure and exported for unit testing. sendEmail() performs the network call
 * and NEVER throws — callers treat email as a non-fatal side-effect.
 *
 * Domain bistro-cloud.com is verified in Resend. Sender + reply-to mirror the
 * Apps Script originals.
 */

import { slotLabel } from "./orderMessage";
import type { PaymentMethod } from "./validation";

const FROM = "Bistro Cloud <orders@bistro-cloud.com>";
const REPLY_TO = "bistrocloud3@gmail.com";

/** The single subject shared by every lifecycle email of one order, so clients
 * that thread by subject also group them. Decline keeps its own subject. */
export const ORDER_SUBJECT = "Bistro Cloud — your order";

/** Deterministic RFC Message-ID for an order, derived from its tracking token.
 * The first email of an order sends with this as Message-ID; later emails set
 * In-Reply-To/References to it so they thread under the original. */
export function orderMessageId(token: string): string {
  return `<order-${token}@bistro-cloud.com>`;
}

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cod: "Cash on delivery",
  card_on_delivery: "Card on delivery (POS)",
  instapay: "Instapay (bank transfer)",
};

/** True when a Resend API key is present, i.e. we can actually send mail. */
export function emailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/** Port of the Apps Script escapeHtml — escapes &, <, >, " for HTML bodies. */
export function escapeHtml(s: string | number | null | undefined): string {
  return String(s === undefined || s === null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** The branded header/body/footer shell — cream header with the logo image. */
export function wrap(innerHtml: string): string {
  return (
    '<div style="font-family: Helvetica Neue, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F9F5F0;">' +
    '<div style="background: #F9F5F0; padding: 28px 30px 20px; text-align: center;">' +
    '<img src="https://bistro-cloud.com/email-logo.png" width="160" alt="Bistro Cloud" style="display:inline-block; width:160px; max-width:160px; height:auto;">' +
    '<p style="color: #888; margin: 12px 0 0; font-size: 13px; letter-spacing: 0.4px;">Fresh. Natural. Delivered Daily.</p>' +
    "</div>" +
    '<div style="padding: 30px; background: white;">' +
    innerHtml +
    "</div>" +
    '<div style="padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">' +
    '<p style="color: #999; font-size: 12px; margin: 0;">Bistro Cloud El Gouna &middot; 100% Natural Ingredients &middot; Free Delivery<br>' +
    '<a href="https://bistro-cloud.com" style="color: #D94E28; text-decoration: none;">bistro-cloud.com</a></p>' +
    "</div>" +
    "</div>"
  );
}

/** orderTrackingUrl(token) — the customer-facing order-tracking page. */
export function trackingUrl(token: string): string {
  return `https://bistro-cloud.com/track?token=${token}`;
}

/** The shared orange "Track your order" CTA button (centred). */
function trackButton(token: string): string {
  return (
    '<div style="text-align: center; margin: 25px 0;">' +
    `<a href="${trackingUrl(token)}" style="display: inline-block; background: #D94E28; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">Track your order</a>` +
    "</div>"
  );
}

export type StepperStage = "confirmed" | "preparing" | "out_for_delivery" | "delivered";

const STEPPER_STEPS: { key: StepperStage; label: string }[] = [
  { key: "confirmed", label: "Confirmed" },
  { key: "preparing", label: "Being prepared" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];

/** A 4-step status bar mirroring the /track page. Completed steps show ✓ (orange),
 * the current step ● (orange, bold), future steps ○ (gray). Table-based for Outlook. */
export function statusStepper(current: StepperStage): string {
  const currentIndex = STEPPER_STEPS.findIndex((s) => s.key === current);
  const cells = STEPPER_STEPS.map((step, i) => {
    const done = i < currentIndex;
    const active = i === currentIndex;
    const marker = done ? "✓" : active ? "●" : "○";
    const markerColor = done || active ? "#D94E28" : "#cfcfcf";
    const labelColor = done || active ? "#333" : "#aaa";
    const weight = active ? "bold" : "normal";
    return (
      '<td style="text-align:center; vertical-align:top; width:25%; padding:0 4px;">' +
      `<div style="font-size:18px; line-height:1; color:${markerColor};">${marker}</div>` +
      `<div style="font-size:11px; margin-top:6px; color:${labelColor}; font-weight:${weight};">${step.label}</div>` +
      "</td>"
    );
  }).join("");
  return (
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;">' +
    `<tr>${cells}</tr></table>`
  );
}

export interface BuiltEmail {
  subject: string;
  html: string;
}

export interface ConfirmationEmailInput {
  name: string;
  orderSummary: string;
  orderTotal: number | string;
  deliverySlot: string;
  paymentMethod: PaymentMethod;
  instapayDetails?: string;
  trackingToken: string;
}

/** Order-confirmation email (port of sendOrderConfirmationEmail). */
export function confirmationEmail(o: ConfirmationEmailInput): BuiltEmail {
  const label = slotLabel(o.deliverySlot);
  let inner =
    `<h2 style="color: #2C3E50; margin-top: 0;">Order confirmed, ${escapeHtml(o.name)}!</h2>` +
    `<p style="color: #555; line-height: 1.6;">Your delivery is scheduled for <strong>today at ${escapeHtml(label)}</strong>.</p>` +
    '<div style="background: #F9F5F0; border-radius: 12px; padding: 20px; margin: 20px 0;">' +
    `<p style="color: #333; margin: 0; white-space: pre-line;">${escapeHtml(o.orderSummary)}</p>` +
    `<p style="color: #2C3E50; font-weight: bold; margin: 10px 0 0;">Total: ${escapeHtml(o.orderTotal)} EGP</p>` +
    "</div>";

  inner += `<p style="color: #555; line-height: 1.6; margin: 12px 0;">Payment: <strong>${escapeHtml(PAYMENT_LABEL[o.paymentMethod])}</strong></p>`;

  if (o.paymentMethod === "instapay" && o.instapayDetails) {
    inner +=
      '<div style="background:#F9F5F0;border-radius:12px;padding:16px;margin:12px 0;">' +
      "<strong>To pay via Instapay, transfer the total to:</strong><br>" +
      `<span style="white-space:pre-line;">${escapeHtml(o.instapayDetails)}</span><br>` +
      '<span style="color:#888;">Please transfer the total before your delivery window.</span>' +
      "</div>";
  }

  inner += trackButton(o.trackingToken);

  return {
    subject: `Bistro Cloud — order confirmed for ${label}`,
    html: wrap(inner),
  };
}

export type StatusEmailStatus = "preparing" | "out_for_delivery" | "delivered";

const STATUS_EMAIL_COPY: Record<StatusEmailStatus, { subject: string; heading: string; body: string }> = {
  preparing: {
    subject: "Your Bistro Cloud order is being prepared",
    heading: "The kitchen is on it!",
    body: "Your order is being freshly prepared right now.",
  },
  out_for_delivery: {
    subject: "Your Bistro Cloud order is out for delivery",
    heading: "On the way!",
    body: "Your order has left the kitchen and is on its way to you.",
  },
  delivered: {
    subject: "Your Bistro Cloud order has been delivered",
    heading: "Enjoy your meal!",
    body: "Your order has been delivered. Thank you for ordering with Bistro Cloud!",
  },
};

export interface StatusEmailInput {
  name: string;
  deliverySlot: string;
  trackingToken: string;
}

/** Status-update email (port of sendStatusUpdateEmail + STATUS_EMAIL_COPY). */
export function statusEmail(status: StatusEmailStatus, o: StatusEmailInput): BuiltEmail {
  const copy = STATUS_EMAIL_COPY[status];
  const inner =
    `<h2 style="color: #2C3E50; margin-top: 0;">${copy.heading}</h2>` +
    `<p style="color: #555; line-height: 1.6;">${copy.body}</p>` +
    `<p style="color: #555; line-height: 1.6;">Scheduled time: <strong>${escapeHtml(slotLabel(o.deliverySlot))}</strong></p>` +
    trackButton(o.trackingToken);
  return { subject: copy.subject, html: wrap(inner) };
}

export interface DelayEmailInput {
  name: string;
  oldLabel: string;
  newLabel: string;
  trackingToken: string;
}

/** "Running late" / new-ETA email (port of sendDelayEmail). oldLabel/newLabel
 * are already 12h-formatted (delayOrder returns them). */
export function delayEmail(o: DelayEmailInput): BuiltEmail {
  const inner =
    '<h2 style="color: #2C3E50; margin-top: 0;">Your order is running a little late</h2>' +
    `<p style="color: #555; line-height: 1.6;">New estimated delivery: <b>${escapeHtml(o.newLabel)}</b> (was ${escapeHtml(o.oldLabel)}). Thanks for your patience!</p>` +
    trackButton(o.trackingToken);
  return { subject: "Bistro Cloud — updated delivery time", html: wrap(inner) };
}

export interface DeclineEmailInput {
  name: string;
  deliverySlot: string;
  openSlotLabels?: string[];
}

/** Order-declined email (port of sendOrderDeclineEmail). openSlotLabels is
 * optional — when empty we fall back to the "no times today" copy. */
export function declineEmail(o: DeclineEmailInput): BuiltEmail {
  const labels = o.openSlotLabels || [];
  const alternatives = labels.length
    ? `<p style="color: #555; line-height: 1.6;">These times are still available today: <strong>${labels.join(", ")}</strong>. Place a new order on <a href="https://bistro-cloud.com/menu" style="color: #D94E28;">bistro-cloud.com</a> or WhatsApp us.</p>`
    : '<p style="color: #555; line-height: 1.6;">Unfortunately no more delivery times are available today. We would love to serve you tomorrow!</p>';
  const slotPhrase = /^\d{1,2}:\d{2}$/.test(String(o.deliverySlot))
    ? ` at <strong>${escapeHtml(slotLabel(o.deliverySlot))}</strong>`
    : "";
  const inner =
    `<h2 style="color: #2C3E50; margin-top: 0;">About your order, ${escapeHtml(o.name)}</h2>` +
    `<p style="color: #555; line-height: 1.6;">We're sorry — the kitchen is fully booked${slotPhrase} and we couldn't fit your order in.</p>` +
    alternatives +
    '<div style="text-align: center; margin: 25px 0;">' +
    '<a href="https://wa.me/201221288804" style="display: inline-block; background: #D94E28; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">Chat on WhatsApp</a>' +
    "</div>";
  return {
    subject: "Bistro Cloud — we couldn't fit your order in today",
    html: wrap(inner),
  };
}

export interface SendEmailOpts {
  /** The order's tracking token, used to derive the thread Message-ID. */
  threadToken?: string;
  /** "root" → set Message-ID; "reply" → set In-Reply-To + References. */
  threadRole?: "root" | "reply";
}

/**
 * Send an email via the Resend API. NEVER throws: returns {ok:false,error} on a
 * non-2xx response, a thrown fetch, or a missing API key. Callers treat the
 * send as a non-fatal side-effect.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  opts?: SendEmailOpts,
): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "not configured" };
  if (!to) return { ok: false, error: "no recipient" };
  let threadHeaders: Record<string, string> | undefined;
  if (opts?.threadToken && opts.threadRole) {
    const id = orderMessageId(opts.threadToken);
    threadHeaders =
      opts.threadRole === "root"
        ? { "Message-ID": id }
        : { "In-Reply-To": id, References: id };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        reply_to: REPLY_TO,
        subject,
        html,
        ...(threadHeaders ? { headers: threadHeaders } : {}),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (res.status >= 200 && res.status < 300) return { ok: true };
    let detail = "";
    try {
      detail = (await res.text()).slice(0, 300);
    } catch {
      /* ignore body read failure */
    }
    return { ok: false, error: `Resend HTTP ${res.status}${detail ? `: ${detail}` : ""}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown error" };
  }
}
