import { timingSafeEqual } from "node:crypto";
import { setOrderStatusByToken, getOrderStatus } from "@/lib/appsScript";
import { answerCallbackQuery, editMessageText, sendMessage } from "@/lib/telegram";
import { actionToStatus, keyboardForStatus } from "@/lib/orderMessage";
import { loyverseConfigured, pushReceipt, parseOrderSummary, type LoyverseOrder } from "@/lib/loyverse";

const PAYMENT_METHODS: LoyverseOrder["paymentMethod"][] = ["cod", "card_on_delivery", "instapay"];

/**
 * Best-effort: push a freshly-approved (pending_approval -> confirmed) order to
 * Loyverse. The webhook only carries the token + new status, so we fetch the
 * order detail from Apps Script (admin-gated fields: phone/address/payment) and
 * reconstruct the line items from the stored order_summary. Never throws; on
 * failure it warns the owner via Telegram. Non-fatal end to end.
 */
async function pushApprovedOrderToLoyverse(token: string, ownerChatId: number): Promise<void> {
  try {
    const detail = await getOrderStatus(token, true);
    if (!detail.success || !detail.order) {
      console.error("[webhook] Loyverse push: could not load order", token, detail.error);
      return;
    }
    const o = detail.order;
    // If private fields are missing, the admin-password gate in Apps Script
    // didn't open (e.g. APPS_SCRIPT_ADMIN_PASSWORD rotated to a non-role value).
    // We can still push, but payment defaults to Cash and the note loses
    // phone/address — warn so it's not silently wrong.
    if (!o.phone && !o.paymentMethod) {
      console.warn("[webhook] Loyverse push: order detail had no private fields — check APPS_SCRIPT_ADMIN_PASSWORD is a valid role password");
    }
    const orderTotal = Number(o.orderTotal) || 0;
    const parsed = parseOrderSummary(o.orderSummary);
    // Fall back to a single custom line item for the total if we couldn't
    // reconstruct the cart (so the sale + total still record in Loyverse).
    const items = parsed.length
      ? parsed
      : [{ name: `Order ${token}`, quantity: 1, price: orderTotal }];
    const paymentMethod = (PAYMENT_METHODS as string[]).includes(o.paymentMethod || "")
      ? (o.paymentMethod as LoyverseOrder["paymentMethod"])
      : "cod";

    const r = await pushReceipt({
      items,
      name: o.name || "",
      phone: o.phone || "",
      address: o.address || "",
      deliverySlot: o.deliverySlot || "",
      paymentMethod,
      orderTotal,
      trackingToken: token,
    });
    if (!r.ok) {
      console.error("[webhook] Loyverse push failed (non-fatal):", r.error);
      await sendMessage(ownerChatId, `⚠️ Order didn't sync to Loyverse: ${r.error || "unknown error"}`).catch(() => {});
    }
  } catch (err) {
    console.error("[webhook] Loyverse push threw (non-fatal):", err);
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TgCallback {
  id: string;
  data?: string;
  message?: { message_id: number; chat: { id: number }; text?: string };
}
interface TgUpdate {
  update_id?: number;
  callback_query?: TgCallback;
  message?: unknown;
}

function secretOk(received: string | null): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected || !received) return false;
  const a = Buffer.from(received, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) {
    timingSafeEqual(a, a); // constant-time even on length mismatch
    return false;
  }
  return timingSafeEqual(a, b);
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: "✅ Confirmed",
  declined: "❌ Declined",
  preparing: "👨‍🍳 Being prepared",
  out_for_delivery: "🛵 Out for delivery",
  delivered: "📦 Delivered",
  cancelled: "🚫 Cancelled",
};

export async function POST(request: Request): Promise<Response> {
  if (!secretOk(request.headers.get("X-Telegram-Bot-Api-Secret-Token"))) {
    return new Response("unauthorized", { status: 401 });
  }

  let update: TgUpdate;
  try {
    update = (await request.json()) as TgUpdate;
  } catch {
    return new Response("ok", { status: 200 }); // never make Telegram redeliver
  }

  const cb = update.callback_query;
  if (!cb || !cb.data || !cb.message) {
    return new Response("ok", { status: 200 });
  }

  if (process.env.TELEGRAM_OWNER_CHAT_ID && String(cb.message.chat.id) !== process.env.TELEGRAM_OWNER_CHAT_ID) {
    return new Response("ok", { status: 200 });
  }

  const [action, token] = cb.data.split(":");
  const status = actionToStatus(action || "");
  if (!status || !token) {
    await answerCallbackQuery(cb.id, "Unknown action").catch(() => {});
    return new Response("ok", { status: 200 });
  }

  try {
    const r = await setOrderStatusByToken(token, status);
    if (r.success) {
      const original = cb.message.text || "Order";
      await editMessageText(cb.message.chat.id, cb.message.message_id, `${original}\n\n— ${STATUS_LABEL[status] || status}`, keyboardForStatus(status, token));
      await answerCallbackQuery(cb.id, STATUS_LABEL[status] || status);
      // Part 2: push the now-confirmed order to Loyverse (non-fatal). Gate on the
      // GENUINE pending_approval -> confirmed transition (r.previousStatus) so a
      // double-tap or a Telegram webhook redelivery can't create a second
      // receipt — the second call sees previousStatus === "confirmed".
      if (
        action === "approve" &&
        status === "confirmed" &&
        r.previousStatus === "pending_approval" &&
        loyverseConfigured()
      ) {
        await pushApprovedOrderToLoyverse(token, cb.message.chat.id);
      }
    } else {
      await answerCallbackQuery(cb.id, r.error || "Update failed");
    }
  } catch (err) {
    console.error("[webhook] status update failed:", err);
    await answerCallbackQuery(cb.id, "Update failed").catch(() => {});
  }

  return new Response("ok", { status: 200 });
}
