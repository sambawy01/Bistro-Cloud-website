const CRM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzwhYQ44aHHJrLCf9up8zTyYFuvNQrGAOvqgXWHLTn86GlzDPuUV8TcP19b_IET7kvr/exec';

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
 * Posts data to the CRM via a hidden form + iframe.
 * This bypasses CORS entirely — HTML form submissions don't have CORS restrictions.
 * Google Apps Script's 302 redirect breaks fetch() (POST becomes GET, losing body),
 * but form submissions follow redirects correctly and preserve the POST body.
 */
async function postToCRM(formType: string, data: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
  try {
    return new Promise((resolve) => {
      // Create a hidden iframe to receive the form's response
      const iframeName = 'crm-submit-' + Date.now();
      const iframe = document.createElement('iframe');
      iframe.name = iframeName;
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      // Create a hidden form targeting the iframe
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = CRM_ENDPOINT;
      form.target = iframeName;
      form.style.display = 'none';

      // Pack all data as a single JSON payload field
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'payload';
      input.value = JSON.stringify({
        formType,
        data,
        timestamp: new Date().toISOString(),
      });
      form.appendChild(input);

      document.body.appendChild(form);
      form.submit();

      // Clean up after a delay (Apps Script needs time to process)
      setTimeout(() => {
        try {
          document.body.removeChild(form);
          document.body.removeChild(iframe);
        } catch (e) {
          // Ignore cleanup errors
        }
        resolve({ success: true });
      }, 3000);
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
