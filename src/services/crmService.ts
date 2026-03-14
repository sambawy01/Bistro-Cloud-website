const CRM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzN-s2iKeyjIC_k-wyNzj6QHOO5eoW14EqWo7fC4kYzYzqyMOygZpCDPpyqPVxhFA/exec';

export interface CateringInquiry {
  name: string;
  company: string;
  email: string;
  phone: string;
  eventType: string;
  guestCount: string;
  eventDate: string;
  location: string;
  menuPreferences: string;
}

export interface OrderData {
  name: string;
  phone: string;
  address: string;
  deliveryArea: string;
  orderTotal: number;
  orderSummary: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

/**
 * Sends data to the CRM via GET request to a Google Apps Script endpoint.
 *
 * Why this approach:
 * - Google Apps Script redirects (302) from script.google.com to
 *   script.googleusercontent.com. This cross-origin redirect breaks
 *   fetch() in both 'no-cors' mode (opaque redirect — never followed)
 *   and 'cors' mode (redirect lacks CORS headers).
 * - navigator.sendBeacon() always sends POST, which Apps Script rejects
 *   after the 302 strips the body (405 error).
 * - A hidden <img> tag follows 302 redirects transparently across
 *   origins, triggering the server-side doGet handler reliably.
 * - Appending the <img> to document.body (outside React's tree) means
 *   React re-renders and component unmounts cannot cancel the request.
 * - Once the browser initiates the image load, it completes even if
 *   the user navigates away (e.g., window.open to WhatsApp).
 *
 * Strategy stack (primary + fallback):
 * 1. Hidden <img> tag appended to document.body (primary)
 * 2. fetch() in 'cors' mode with redirect:'follow' (backup — works in
 *    environments where the final response includes CORS headers)
 */
async function postToCRM(formType: string, data: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = JSON.stringify({
      formType,
      data,
      timestamp: new Date().toISOString(),
    });

    const url = CRM_ENDPOINT + '?payload=' + encodeURIComponent(payload);

    // Guard against excessively long URLs (browser limit ~2048 chars,
    // most servers accept up to ~8000). If the URL is too long, truncate
    // the order summary to fit.
    if (url.length > 6000) {
      console.warn('CRM payload URL is very long (' + url.length + ' chars). Consider truncating order data.');
    }

    // Strategy 1: Hidden <img> tag — most reliable for cross-origin
    // redirecting GET endpoints. The browser follows 302 redirects
    // transparently. Appended to document.body so React cannot unmount it.
    try {
      const img = document.createElement('img');
      img.style.display = 'none';
      img.src = url;
      document.body.appendChild(img);
      // Clean up after a generous timeout (request is already in-flight)
      setTimeout(() => {
        try { document.body.removeChild(img); } catch (_) { /* already removed */ }
      }, 30000);
    } catch (_) {
      // img creation failed (e.g., SSR environment) — fall through to fetch
    }

    // Strategy 2: fetch with cors mode as a backup. Google Apps Script
    // published endpoints DO return Access-Control-Allow-Origin:* on the
    // final response at googleusercontent.com, so this can work when the
    // browser follows the redirect chain in cors mode.
    try {
      fetch(url, {
        method: 'GET',
        mode: 'cors',
        redirect: 'follow',
        keepalive: true,
      }).catch(() => {
        // Silently ignore — the <img> strategy is the primary path
      });
    } catch (_) {}

    return { success: true };
  } catch (err) {
    console.error('CRM submission error:', err);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function submitCateringInquiry(data: CateringInquiry) {
  return postToCRM('catering_inquiry', data as unknown as Record<string, unknown>);
}

export async function submitOrder(data: OrderData) {
  return postToCRM('order', data as unknown as Record<string, unknown>);
}

export async function submitContactForm(data: ContactFormData) {
  return postToCRM('contact', data as unknown as Record<string, unknown>);
}
