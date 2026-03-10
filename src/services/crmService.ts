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

async function postToCRM(formType: string, data: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
  try {
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe');
      iframe.name = 'crm-submit-target-' + Date.now();
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = CRM_ENDPOINT;
      form.target = iframe.name;

      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'payload';
      input.value = JSON.stringify({ formType, data, timestamp: new Date().toISOString() });
      form.appendChild(input);

      document.body.appendChild(form);
      form.submit();

      setTimeout(() => {
        try {
          document.body.removeChild(form);
          document.body.removeChild(iframe);
        } catch (e) {}
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
