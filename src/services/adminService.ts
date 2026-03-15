const ADMIN_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzN-s2iKeyjIC_k-wyNzj6QHOO5eoW14EqWo7fC4kYzYzqyMOygZpCDPpyqPVxhFA/exec';
const STORAGE_KEY = 'bc-admin-pw';

export interface AdminItem {
  row: number;
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  dietary: string;
  status: string;
  hidden: string;
}

export interface OrderItem {
  row: number;
  date: string;
  name: string;
  phone: string;
  address: string;
  deliveryArea: string;
  orderTotal: number;
  orderSummary: string;
  status: string;
  [key: string]: string | number;
}

export function getStoredPassword(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setStoredPassword(pw: string) {
  localStorage.setItem(STORAGE_KEY, pw);
}

export function clearStoredPassword() {
  localStorage.removeItem(STORAGE_KEY);
}

let jsonpCounter = 0;

/**
 * Makes a JSONP call to the Apps Script endpoint.
 * Google Apps Script 302-redirects break fetch/POST, so we use <script> tags
 * with a callback parameter. The Apps Script returns `callbackName(json)`.
 */
function jsonpCall<T>(params: Record<string, string>): Promise<T> {
  return new Promise((resolve, reject) => {
    const callbackName = `__bcAdmin_${Date.now()}_${jsonpCounter++}`;
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Request timed out'));
    }, 15000);

    function cleanup() {
      clearTimeout(timeout);
      delete (window as Record<string, unknown>)[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    (window as Record<string, unknown>)[callbackName] = (data: T) => {
      cleanup();
      resolve(data);
    };

    const qs = new URLSearchParams({ ...params, callback: callbackName }).toString();
    const script = document.createElement('script');
    script.src = `${ADMIN_ENDPOINT}?${qs}`;
    script.onerror = () => {
      cleanup();
      reject(new Error('Network error'));
    };
    document.body.appendChild(script);
  });
}

interface AdminResponse {
  success: boolean;
  error?: string;
  data?: AdminItem[] | OrderItem[];
}

export async function adminList(sheet: string, password: string): Promise<AdminItem[] | OrderItem[]> {
  const res = await jsonpCall<AdminResponse>({
    action: 'list',
    sheet,
    password,
  });
  if (!res.success) throw new Error(res.error || 'Failed to fetch');
  return res.data || [];
}

export async function adminAdd(sheet: string, password: string, item: Record<string, string>): Promise<void> {
  const res = await jsonpCall<AdminResponse>({
    action: 'add',
    sheet,
    password,
    payload: JSON.stringify(item),
  });
  if (!res.success) throw new Error(res.error || 'Failed to add');
}

export async function adminUpdate(sheet: string, password: string, row: number, item: Record<string, string>): Promise<void> {
  const res = await jsonpCall<AdminResponse>({
    action: 'update',
    sheet,
    password,
    row: String(row),
    payload: JSON.stringify(item),
  });
  if (!res.success) throw new Error(res.error || 'Failed to update');
}

export async function adminDelete(sheet: string, password: string, row: number, id: string): Promise<void> {
  const res = await jsonpCall<AdminResponse>({
    action: 'delete',
    sheet,
    password,
    row: String(row),
    id,
  });
  if (!res.success) throw new Error(res.error || 'Failed to delete');
}

export async function adminToggle(sheet: string, password: string, row: number, field: string, value: string): Promise<void> {
  const res = await jsonpCall<AdminResponse>({
    action: 'toggle',
    sheet,
    password,
    row: String(row),
    field,
    value,
  });
  if (!res.success) throw new Error(res.error || 'Failed to toggle');
}

export async function adminArchive(password: string, row: number, id: string): Promise<void> {
  const res = await jsonpCall<AdminResponse>({
    action: 'archive',
    sheet: 'Opportunities',
    password,
    row: String(row),
    id,
  });
  if (!res.success) throw new Error(res.error || 'Failed to archive');
}

export async function verifyPassword(password: string): Promise<boolean> {
  try {
    await adminList('Menu', password);
    return true;
  } catch {
    return false;
  }
}
