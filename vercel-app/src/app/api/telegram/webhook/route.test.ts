import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/appsScript", () => ({
  setOrderStatusByToken: vi.fn(async () => ({ success: true, status: "confirmed", previousStatus: "pending_approval" })),
  getOrderStatus: vi.fn(async () => ({
    success: true,
    order: {
      name: "Sara Ali", status: "confirmed", deliveryDate: "2026-06-13", deliverySlot: "14:30",
      orderSummary: "2x Grilled Chicken (400 EGP)", orderTotal: 400,
      phone: "+201001234567", address: "12 West Golf", note: "Instapay (bank transfer)", paymentMethod: "instapay",
    },
  })),
}));
vi.mock("@/lib/telegram", () => ({
  answerCallbackQuery: vi.fn(async () => ({ ok: true, status: 200 })),
  editMessageText: vi.fn(async () => ({ ok: true, status: 200 })),
  sendMessage: vi.fn(async () => ({ ok: true, status: 200 })),
}));
vi.mock("@/lib/loyverse", () => ({
  loyverseConfigured: vi.fn(() => true),
  pushReceipt: vi.fn(async () => ({ ok: true, receiptNumber: "1-1001" })),
  parseOrderSummary: vi.fn((s: string) =>
    s === "2x Grilled Chicken (400 EGP)" ? [{ name: "Grilled Chicken", quantity: 2, price: 200 }] : []),
}));

import { POST } from "./route";
import { setOrderStatusByToken, getOrderStatus } from "@/lib/appsScript";
import { answerCallbackQuery, editMessageText, sendMessage } from "@/lib/telegram";
import { pushReceipt } from "@/lib/loyverse";

const SECRET = "hook-secret";

function update(data: string) {
  return {
    update_id: 1,
    callback_query: { id: "cb1", data, message: { message_id: 55, chat: { id: 999 }, text: "NEW ORDER" } },
  };
}

function req(body: unknown, secret = SECRET): Request {
  return new Request("https://api.test/api/telegram/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Telegram-Bot-Api-Secret-Token": secret },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.TELEGRAM_BOT_TOKEN = "tok";
  process.env.TELEGRAM_WEBHOOK_SECRET = SECRET;
  process.env.TELEGRAM_OWNER_CHAT_ID = "999";
});

describe("POST /api/telegram/webhook", () => {
  it("rejects a bad secret with 401 and changes nothing", async () => {
    const res = await POST(req(update("approve:tok-1"), "wrong-secret"));
    expect(res.status).toBe(401);
    expect(setOrderStatusByToken).not.toHaveBeenCalled();
  });

  it("maps an Approve tap to setOrderStatusByToken(confirmed) and edits the message with next-status keyboard", async () => {
    const res = await POST(req(update("approve:tok-abc")));
    expect(res.status).toBe(200);
    expect(setOrderStatusByToken).toHaveBeenCalledWith("tok-abc", "confirmed");
    expect(editMessageText).toHaveBeenCalled();
    const keyboard = (editMessageText as any).mock.calls[0][3];
    expect(keyboard).toBeDefined();
    expect(keyboard.inline_keyboard.flat().length).toBeGreaterThan(0);
    expect(answerCallbackQuery).toHaveBeenCalled();
  });

  it("on Approve, pushes the now-confirmed order to Loyverse (fetched by token)", async () => {
    const res = await POST(req(update("approve:tok-abc")));
    expect(res.status).toBe(200);
    expect(getOrderStatus).toHaveBeenCalledWith("tok-abc", true);
    expect(pushReceipt).toHaveBeenCalledOnce();
    expect(pushReceipt).toHaveBeenCalledWith(expect.objectContaining({
      items: [{ name: "Grilled Chicken", quantity: 2, price: 200 }],
      paymentMethod: "instapay",
      orderTotal: 400,
      trackingToken: "tok-abc",
    }));
  });

  it("does NOT push to Loyverse for non-approve transitions (e.g. preparing)", async () => {
    await POST(req(update("preparing:t")));
    expect(pushReceipt).not.toHaveBeenCalled();
  });

  it("does NOT push again when the order was already confirmed (re-tap / redelivery)", async () => {
    (setOrderStatusByToken as any).mockResolvedValueOnce({ success: true, status: "confirmed", previousStatus: "confirmed" });
    const res = await POST(req(update("approve:tok-dup")));
    expect(res.status).toBe(200);
    expect(pushReceipt).not.toHaveBeenCalled();
  });

  it("a Loyverse push failure on Approve warns the owner but still answers 200", async () => {
    (pushReceipt as any).mockResolvedValueOnce({ ok: false, error: "Loyverse HTTP 500" });
    const res = await POST(req(update("approve:tok-x")));
    expect(res.status).toBe(200);
    expect(sendMessage).toHaveBeenCalledOnce();
    expect((sendMessage as any).mock.calls[0][1]).toContain("didn't sync to Loyverse");
  });

  it("a thrown getOrderStatus during the push never breaks the 200", async () => {
    (getOrderStatus as any).mockRejectedValueOnce(new Error("apps script down"));
    const res = await POST(req(update("approve:tok-y")));
    expect(res.status).toBe(200);
    expect(setOrderStatusByToken).toHaveBeenCalled();
  });

  it("passes terminal (no-button) keyboard when delivered", async () => {
    await POST(req(update("delivered:t")));
    expect(editMessageText).toHaveBeenCalled();
    const keyboard = (editMessageText as any).mock.calls[0][3];
    expect(keyboard).toEqual({ inline_keyboard: [] });
  });

  it("maps cancel and delivered actions", async () => {
    await POST(req(update("cancel:t1")));
    expect(setOrderStatusByToken).toHaveBeenCalledWith("t1", "cancelled");
    await POST(req(update("delivered:t2")));
    expect(setOrderStatusByToken).toHaveBeenCalledWith("t2", "delivered");
  });

  it("ignores an unknown action but still answers 200 (no redelivery)", async () => {
    const res = await POST(req(update("bogus:t1")));
    expect(res.status).toBe(200);
    expect(setOrderStatusByToken).not.toHaveBeenCalled();
  });

  it("answers 200 for a non-callback update (e.g. a plain message)", async () => {
    const res = await POST(req({ update_id: 2, message: { message_id: 1, chat: { id: 1 }, text: "hi" } }));
    expect(res.status).toBe(200);
    expect(setOrderStatusByToken).not.toHaveBeenCalled();
  });

  it("ignores callbacks not from the owner chat (owner-id check)", async () => {
    const foreignUpdate = {
      update_id: 1,
      callback_query: { id: "cb1", data: "approve:tok-1", message: { message_id: 55, chat: { id: 12345 }, text: "NEW ORDER" } },
    };
    const res = await POST(req(foreignUpdate));
    expect(res.status).toBe(200);
    expect(setOrderStatusByToken).not.toHaveBeenCalled();
  });
});
