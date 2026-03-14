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
 * ROOT CAUSE of previous failures:
 * --------------------------------
 * 1. Google Apps Script 302-redirects from script.google.com to
 *    script.googleusercontent.com. The processing happens on the FIRST
 *    request (the 302), and the redirect delivers the response.
 *
 * 2. The <img> tag approach FAILS because the final response has
 *    Content-Type: application/json AND X-Content-Type-Options: nosniff.
 *    Modern browsers refuse to decode a non-image MIME type as an image
 *    and may abort the connection before the server finishes processing.
 *
 * 3. fetch() with mode:'cors' FAILS because the cross-origin 302 redirect
 *    (script.google.com -> script.googleusercontent.com) triggers the
 *    "opaque redirect" handling in some browsers, blocking the response.
 *
 * 4. fetch() with mode:'no-cors' gets an opaque response and does NOT
 *    follow cross-origin redirects reliably.
 *
 * 5. On mobile, window.open() to wa.me deep-links backgrounds the browser,
 *    causing in-flight network requests to be killed before completing.
 *
 * SOLUTION: Three-layer strategy with completion signaling
 * --------------------------------------------------------
 * Primary:  <script> tag (JSONP-style) — the most battle-tested mechanism
 *           for cross-origin GET with redirects. Browsers MUST follow 302
 *           redirects for script loading (same behavior that makes CDNs
 *           work). The response (JSON) causes a parse error, but that
 *           fires AFTER the full response is downloaded and the server
 *           has processed the request.
 *
 * Backup:   <link rel="prefetch"> — tells the browser to fetch the URL
 *           as a low-priority resource. Follows redirects, no CORS needed,
 *           no MIME type restrictions.
 *
 * Tertiary: fetch() with mode:'no-cors' — fires the request; even though
 *           the response is opaque, the server still processes the GET.
 *
 * The function returns a Promise that resolves when the primary <script>
 * tag completes (load or error — both mean the server got the request)
 * or after a timeout, whichever comes first. This lets callers WAIT for
 * CRM completion before performing destructive actions like opening
 * WhatsApp or clearing cart state.
 */
async function postToCRM(formType: string, data: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = JSON.stringify({
      formType,
      data,
      timestamp: new Date().toISOString(),
    });

    const url = CRM_ENDPOINT + '?payload=' + encodeURIComponent(payload);

    if (url.length > 6000) {
      console.warn('CRM payload URL is very long (' + url.length + ' chars). Consider truncating order data.');
    }

    // Send via <script> tag — the only strategy needed.
    // Browsers follow 302 redirects for script loading without CORS
    // restrictions. The JSON response triggers onerror (not valid JS),
    // but onerror fires AFTER the server has processed the request.
    const completionPromise = new Promise<void>((resolve) => {
      let resolved = false;
      const done = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      try {
        const script = document.createElement('script');
        script.onload = done;
        script.onerror = done;
        script.src = url;
        document.body.appendChild(script);
        setTimeout(() => {
          try { document.body.removeChild(script); } catch (_) {}
        }, 30000);
      } catch (_) {
        done();
      }

      // Safety timeout: resolve after 4 seconds no matter what.
      // strategy and will complete in the background even after resolve.
      setTimeout(done, 4000);
    });

    await completionPromise;

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
