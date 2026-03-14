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
 * Sends data to the CRM via a hidden iframe GET request.
 * Google Apps Script redirects (302) strip POST bodies, so we use GET.
 * An iframe navigating to the URL reliably follows all redirects and
 * lets the server process the request cross-origin without CORS issues.
 */
async function postToCRM(formType: string, data: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = JSON.stringify({
      formType,
      data,
      timestamp: new Date().toISOString(),
    });

    const url = CRM_ENDPOINT + '?payload=' + encodeURIComponent(payload);

    return new Promise((resolve) => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);

      // Clean up after the server has had time to process
      setTimeout(() => {
        try { document.body.removeChild(iframe); } catch (_) {}
        resolve({ success: true });
      }, 4000);
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
