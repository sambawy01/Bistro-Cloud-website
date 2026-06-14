/**
 * Server-side client for the existing Bistro Cloud Apps Script web app.
 * GET-only (POST bodies are lost in Google's 302 redirect). The Apps Script
 * remains the capacity + storage + calendar + customer-email authority;
 * this client just drives it.
 */

export interface PlaceOrderInput {
  name: string;
  phone: string;
  email: string;
  address: string;
  orderTotal: number;
  orderSummary: string;
  itemCount: number;
  deliverySlot: string;
  expectedStatus: "open" | "busy";
  note: string;
  location: string;
  paymentMethod: string;
  instapayDetails?: string;
}

export type PlaceOrderResult =
  | { success: true; status: "confirmed" | "pending_approval"; trackingToken: string; deliverySlot: string; deliveryDate: string; id?: number }
  | { success: false; code: "slot_full" | "slot_unavailable" | "busy_retry" | "daily_limit"; error?: string };

function endpoint(): string {
  const url = process.env.APPS_SCRIPT_URL;
  if (!url) throw new Error("APPS_SCRIPT_URL is not configured");
  return url;
}

async function appsScriptGet<T>(params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${endpoint()}?${qs}`, { redirect: "follow", signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`Apps Script HTTP ${res.status}`);
  return (await res.json()) as T;
}

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  return appsScriptGet<PlaceOrderResult>({
    action: "placeOrder",
    channel: "web",
    // Fast checkout: Apps Script skips the kitchen calendar, confirmation email,
    // and Customers upsert; the route runs orderFinalize() out-of-band afterwards.
    defer: "true",
    name: input.name,
    phone: input.phone,
    email: input.email,
    address: input.address,
    deliveryArea: "El Gouna",
    orderTotal: String(input.orderTotal),
    orderSummary: input.orderSummary,
    itemCount: String(input.itemCount),
    deliverySlot: input.deliverySlot,
    expectedStatus: input.expectedStatus,
    note: input.note,
    location: input.location || "",
    paymentMethod: input.paymentMethod,
    instapayDetails: input.instapayDetails || "",
  });
}

/**
 * Run the deferred side-effects for a fast-checkout order: kitchen calendar,
 * confirmation email, and Customers upsert. placeOrder (defer=true) skips these
 * so the customer gets an instant response; this is called out-of-band via
 * `after()`. Idempotent in Apps Script (ScriptCache flag), so a retry is safe.
 * `instapayDetails` isn't stored on the row, so we thread it through to keep the
 * instapay confirmation-email bank block intact.
 */
export async function orderFinalize(
  token: string,
  instapayDetails?: string,
): Promise<{ success: boolean; alreadyDone?: boolean; skipped?: string; error?: string }> {
  const password = process.env.APPS_SCRIPT_ADMIN_PASSWORD;
  if (!password) throw new Error("APPS_SCRIPT_ADMIN_PASSWORD is not configured");
  return appsScriptGet({ action: "orderFinalize", password, token, instapayDetails: instapayDetails || "" });
}

export type OrderStatus =
  | "pending_approval" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "declined" | "cancelled";

export async function setOrderStatusByToken(token: string, status: OrderStatus): Promise<{ success: boolean; status?: string; previousStatus?: string; error?: string }> {
  const password = process.env.APPS_SCRIPT_ADMIN_PASSWORD;
  if (!password) throw new Error("APPS_SCRIPT_ADMIN_PASSWORD is not configured");
  return appsScriptGet({ action: "setOrderStatusByToken", password, token, status });
}

/**
 * Shift an order's delivery slot forward by N minutes (15/30/60) via the
 * admin-gated Apps Script `delayOrder` action. Apps Script also emails the
 * customer the new ETA. Returns the human labels for the Telegram confirmation.
 */
export async function delayOrder(token: string, minutes: number): Promise<{ success: boolean; newLabel?: string; oldLabel?: string; error?: string }> {
  const password = process.env.APPS_SCRIPT_ADMIN_PASSWORD;
  if (!password) throw new Error("APPS_SCRIPT_ADMIN_PASSWORD is not configured");
  return appsScriptGet({ action: "delayOrder", password, token, minutes: String(minutes) });
}

export interface OrderStatusDetail {
  success: boolean;
  order?: {
    name: string;
    status: string;
    deliveryDate: string;
    deliverySlot: string;
    orderSummary: string;
    orderTotal: number | string;
    // Private fields — only returned when a valid admin password is supplied.
    email?: string;
    phone?: string;
    address?: string;
    note?: string;
    paymentMethod?: string;
  };
  error?: string;
}

/**
 * Fetch an order by its tracking token. With `withPrivate` (admin password
 * present) the Apps Script also returns phone/address/note/paymentMethod, which
 * the Telegram approve path needs to build a Loyverse receipt. Without it, only
 * the public (customer-tracking) fields come back.
 */
export async function getOrderStatus(token: string, withPrivate = false): Promise<OrderStatusDetail> {
  const params: Record<string, string> = { action: "getOrderStatus", token };
  if (withPrivate) {
    const password = process.env.APPS_SCRIPT_ADMIN_PASSWORD;
    if (password) params.password = password;
  }
  return appsScriptGet<OrderStatusDetail>(params);
}

export interface SlaActiveOrder {
  id: number | string;
  tracking_token: string;
  status: string;
  status_changed_at: string; // ISO; Apps Script falls back to creation timestamp
  sla_alerted_at: string;     // ISO or "" (never alerted)
  name: string;
  phone: string;
  delivery_date: string;      // yyyy-MM-dd (Cairo wall-clock) — needed to build the slot instant
  delivery_slot: string;      // HH:mm (Cairo wall-clock)
  order_summary: string;
}

/** Today's (Cairo) active orders with the fields the SLA cron needs. Admin-gated. */
export async function slaListActiveOrders(): Promise<{ success: boolean; orders?: SlaActiveOrder[]; error?: string }> {
  const password = process.env.APPS_SCRIPT_ADMIN_PASSWORD;
  if (!password) throw new Error("APPS_SCRIPT_ADMIN_PASSWORD is not configured");
  return appsScriptGet({ action: "slaListActiveOrders", password });
}

/** Record that an SLA breach alert was just sent for this order. Admin-gated. */
export async function markSlaAlerted(token: string): Promise<{ success: boolean; error?: string }> {
  const password = process.env.APPS_SCRIPT_ADMIN_PASSWORD;
  if (!password) throw new Error("APPS_SCRIPT_ADMIN_PASSWORD is not configured");
  return appsScriptGet({ action: "markSlaAlerted", password, token });
}

/**
 * Owner-DM Telegram agent clients.
 *
 * Each wraps an Apps Script action via the same GET-only `appsScriptGet`
 * pattern as the order clients above. They return a discriminated
 * `{ success: boolean; ... }` so the agent's tools can treat a non-success
 * response as a tool error rather than throwing into the tool-calling loop.
 *
 * The read/mutate actions (getMenu/getPantry/getStock/getAvailability/getOrders/
 * getCRMOrders/getContacts/toggleVisibility/togglePantryVisibility/
 * approveRequisition/rejectRequisition) are assumed to exist server-side;
 * `logExpense` is net-new and added to the Apps Script in Task 12. Live
 * existence of these actions must be confirmed during rollout.
 */

function adminPassword(): string {
  const p = process.env.APPS_SCRIPT_ADMIN_PASSWORD;
  if (!p) throw new Error("APPS_SCRIPT_ADMIN_PASSWORD is not configured");
  return p;
}

// ---- Read clients (admin-gated where they expose PII) ----

export interface MenuItem { id: string; name: string; visible?: boolean; price?: number | string; }
export async function getMenuList(): Promise<{ success: boolean; items?: MenuItem[]; error?: string }> {
  return appsScriptGet({ action: "getMenu" });
}

export interface PantryItem { id: string; name: string; visible?: boolean; }
export async function getPantryList(): Promise<{ success: boolean; items?: PantryItem[]; error?: string }> {
  return appsScriptGet({ action: "getPantry" });
}

export interface StockRow { id: string; name: string; qty?: number | string; unit?: string; }
export async function getStockList(): Promise<{ success: boolean; items?: StockRow[]; error?: string }> {
  return appsScriptGet({ action: "getStock", password: adminPassword() });
}

export interface AvailabilitySlot { slot: string; ordersLeft?: number; itemsLeft?: number; }
export async function getAvailabilitySummary(slot?: string): Promise<{ success: boolean; slots?: AvailabilitySlot[]; error?: string }> {
  return appsScriptGet({ action: "getAvailability", ...(slot ? { slot } : {}) });
}

export interface AdminOrder {
  id: number | string; tracking_token: string; status: string; name: string; phone?: string;
  order_total: number | string; order_summary: string; delivery_date: string; delivery_slot: string; created_at?: string;
}
export async function getOrdersList(range: "today" | "week" = "today"): Promise<{ success: boolean; orders?: AdminOrder[]; error?: string }> {
  return appsScriptGet({ action: "getOrders", password: adminPassword(), range });
}
export async function getCrmOrdersList(range: "today" | "week" = "week"): Promise<{ success: boolean; orders?: AdminOrder[]; error?: string }> {
  return appsScriptGet({ action: "getCRMOrders", password: adminPassword(), range });
}

export interface Contact { name: string; phone?: string; email?: string; orders?: number; }
export async function getContactsList(query: string): Promise<{ success: boolean; contacts?: Contact[]; error?: string }> {
  return appsScriptGet({ action: "getContacts", password: adminPassword(), q: query });
}

// ---- Mutate clients (always reached via the confirm gate) ----

export async function toggleMenuVisibility(id: string, visible: boolean): Promise<{ success: boolean; error?: string }> {
  return appsScriptGet({ action: "toggleVisibility", password: adminPassword(), id, visible: String(visible) });
}
export async function togglePantryVisibility(id: string, visible: boolean): Promise<{ success: boolean; error?: string }> {
  return appsScriptGet({ action: "togglePantryVisibility", password: adminPassword(), id, visible: String(visible) });
}
export async function decideRequisition(id: string, decision: "approve" | "reject"): Promise<{ success: boolean; error?: string }> {
  return appsScriptGet({
    action: decision === "approve" ? "approveRequisition" : "rejectRequisition",
    password: adminPassword(),
    id,
  });
}

export interface LogExpenseArgs { vendor: string; amountEgp: number; date?: string; category?: string; note?: string; }
export async function logExpense(args: LogExpenseArgs): Promise<{ success: boolean; id?: string; error?: string }> {
  const vendor = (args.vendor ?? "").trim();
  if (!vendor) return { success: false, error: "vendor is required" };
  if (!Number.isFinite(args.amountEgp) || args.amountEgp <= 0) return { success: false, error: "amount must be a positive number" };
  return appsScriptGet({
    action: "logExpense",
    password: adminPassword(),
    vendor,
    amount: String(args.amountEgp),
    date: args.date ?? "",
    category: args.category ?? "other",
    note: args.note ?? "",
    source: "telegram-agent",
  });
}
