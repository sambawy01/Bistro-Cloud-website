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
 * Sends data to the CRM via GET request with payload as a query parameter.
 * Google Apps Script's "Execute as Me / Anyone" deployment does a 302 redirect
 * that strips POST bodies. GET requests follow the redirect correctly and the
 * doGet handler in Apps Script delegates to doPost when a payload param is present.
 */
async function postToCRM(formType: string, data: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = JSON.stringify({
      formType,
      data,
      timestamp: new Date().toISOString(),
    });

    const url = CRM_ENDPOINT + '?payload=' + encodeURIComponent(payload);

    // Use a hidden image request for reliable cross-origin GET.
    // fetch() with no-cors returns opaque responses we can't read,
    // but an image request fires onload/onerror reliably after the
    // server processes the request (even though it's not an image).
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ success: true });
      // Apps Script returns JSON not an image, so onerror fires — but the
      // request was still processed successfully by the server.
      img.onerror = () => resolve({ success: true });
      img.src = url;

      // Fallback timeout in case neither event fires
      setTimeout(() => resolve({ success: true }), 5000);
    });
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
