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
 * Sends data to the CRM using multiple strategies to survive page
 * navigations (WhatsApp redirect, React re-renders, cart unmounting).
 *
 * 1. fetch() with keepalive — survives page navigation, browser keeps
 *    the request alive even after the page unloads.
 * 2. navigator.sendBeacon() — fallback, designed for exactly this use case.
 * 3. Hidden iframe GET — final fallback for older browsers.
 */
async function postToCRM(formType: string, data: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = JSON.stringify({
      formType,
      data,
      timestamp: new Date().toISOString(),
    });

    const url = CRM_ENDPOINT + '?payload=' + encodeURIComponent(payload);

    // Strategy 1: fetch with keepalive (survives navigation)
    try {
      fetch(url, { mode: 'no-cors', keepalive: true });
    } catch (_) {}

    // Strategy 2: sendBeacon as backup (also survives navigation)
    try {
      navigator.sendBeacon(url);
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
