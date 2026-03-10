const CRM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbysX2U-5j6HCverVl3uRTtdjne7mYEPvlNtWdsUEnT-o4-8aT8LJTwiOdII3I4wIjBY/exec';

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
    const response = await fetch(CRM_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({ formType, data }),
    });
    const result = await response.json();
    return result;
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
