import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/appsScript", () => ({
  slaListActiveOrders: vi.fn(async () => ({ success: true, orders: [{ tracking_token: "t1", status: "preparing", name: "A", order_summary: "x", delivery_slot: "14:00", delivery_date: "2026-06-14", phone: "" }] })),
  getOrderStatus: vi.fn(async () => ({ success: true, order: { name: "A", status: "preparing", deliveryDate: "2026-06-14", deliverySlot: "14:00", orderSummary: "x", orderTotal: 500 } })),
  getOrdersList: vi.fn(async () => ({ success: true, orders: [{ order_total: 500 }, { order_total: "300" }] })),
  getCrmOrdersList: vi.fn(async () => ({ success: true, orders: [] })),
  setOrderStatusByToken: vi.fn(async () => ({ success: true, status: "confirmed", previousStatus: "pending_approval" })),
  delayOrder: vi.fn(async () => ({ success: true, newLabel: "14:30" })),
  logExpense: vi.fn(async () => ({ success: true, id: "exp-1" })),
  getMenuList: vi.fn(async () => ({ success: true, items: [] })),
  getStockList: vi.fn(async () => ({ success: true, items: [] })),
  getPantryList: vi.fn(async () => ({ success: true, items: [] })),
  getAvailabilitySummary: vi.fn(async () => ({ success: true, slots: [] })),
  getContactsList: vi.fn(async () => ({ success: true, contacts: [] })),
  toggleMenuVisibility: vi.fn(async () => ({ success: true })),
  togglePantryVisibility: vi.fn(async () => ({ success: true })),
  decideRequisition: vi.fn(async () => ({ success: true })),
  orderFinalize: vi.fn(async () => ({ success: true })),
}));
vi.mock("@/lib/telegram", () => ({ sendMessage: vi.fn(async () => ({ ok: true, status: 200 })) }));

import { TOOLS, requiresConfirmation, validateMutationArgs, describeMutation, executeTool } from "./tools";
import { setOrderStatusByToken, getOrdersList, getCrmOrdersList } from "@/lib/appsScript";
// IMPORTANT: the real broadcast_group imports sendMessage from @/lib/telegram,
// so the broadcast assertion must use the telegram mock (not appsScript).
import { sendMessage } from "@/lib/telegram";

beforeEach(() => { process.env.TELEGRAM_OWNER_CHAT_ID = "555"; });
afterEach(() => vi.restoreAllMocks());

describe("tool schemas", () => {
  it("declares every catalog tool with a native function schema", () => {
    const names = TOOLS.map((t) => t.function.name);
    for (const n of ["orders_active","order_lookup","capacity_today","revenue_summary","customer_lookup","menu_list","stock_list","order_set_status","order_delay","order_finalize","menu_set_out_of_stock","requisition_decide","broadcast_group","log_expense"]) {
      expect(names).toContain(n);
    }
  });
});

describe("confirmation gate", () => {
  it("read tools never require confirmation", () => {
    expect(requiresConfirmation("orders_active", {})).toBe(false);
  });
  it("mutating tools always require confirmation", () => {
    expect(requiresConfirmation("order_set_status", { token: "t", status: "confirmed" })).toBe(true);
    expect(requiresConfirmation("log_expense", { vendor: "M", amountEgp: 10 })).toBe(true);
  });
});

describe("validateMutationArgs", () => {
  it("rejects an unknown status for order_set_status", () => {
    const r = validateMutationArgs("order_set_status", { token: "t", status: "bogus" });
    expect(r.ok).toBe(false);
  });
  it("coerces a numeric string for order_delay minutes", () => {
    const r = validateMutationArgs("order_delay", { token: "t", minutes: "15" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.args.minutes).toBe(15);
  });
  it("coerces a numeric string for log_expense amountEgp", () => {
    const r = validateMutationArgs("log_expense", { vendor: "M", amountEgp: "250" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.args.amountEgp).toBe(250);
  });
  it("rejects a missing required field", () => {
    const r = validateMutationArgs("order_set_status", { status: "confirmed" });
    expect(r.ok).toBe(false);
  });
  it("previews the SANITIZED broadcast text on the confirm card", () => {
    const summary = describeMutation("broadcast_group", { text: "Closed today‮evil" });
    expect(summary).not.toContain("‮"); // bidi stripped in the preview too
  });
  it("provides a human summary for every mutating tool", () => {
    expect(describeMutation("order_delay", { token: "t1", minutes: 15 })).toMatch(/t1/);
    expect(describeMutation("order_set_status", { token: "t1", status: "confirmed" }).length).toBeGreaterThan(0);
    expect(describeMutation("broadcast_group", { text: "hi" }).length).toBeGreaterThan(0);
    expect(describeMutation("log_expense", { vendor: "M", amountEgp: 10 }).length).toBeGreaterThan(0);
    expect(describeMutation("order_finalize", { token: "t1" }).length).toBeGreaterThan(0);
    expect(describeMutation("menu_set_out_of_stock", { id: "m1", outOfStock: true }).length).toBeGreaterThan(0);
    expect(describeMutation("requisition_decide", { id: "r1", decision: "approve" }).length).toBeGreaterThan(0);
  });
});

describe("executeTool", () => {
  it("revenue_summary aggregates order_total across read sources", async () => {
    const out = await executeTool("revenue_summary", { period: "today" }, { chatId: 1 });
    expect(out).toMatch(/800/); // 500 + 300
  });
  it("revenue_summary reports unavailable when both sources fail (never a fabricated 0)", async () => {
    vi.mocked(getOrdersList).mockResolvedValueOnce({ success: false } as never);
    vi.mocked(getCrmOrdersList).mockResolvedValueOnce({ success: false } as never);
    const out = await executeTool("revenue_summary", { period: "today" }, { chatId: 1 });
    expect(out).toMatch(/unavailable/i);
    expect(out).not.toMatch(/0 EGP/);
  });
  it("order_delay rejects a non-positive duration before calling the backend", async () => {
    const out = await executeTool("order_delay", { token: "t1", minutes: 0 }, { chatId: 1 });
    expect(out).toMatch(/positive/i);
  });
  it("order_set_status calls the apps script client", async () => {
    await executeTool("order_set_status", { token: "t1", status: "confirmed" }, { chatId: 1 });
    expect(setOrderStatusByToken).toHaveBeenCalledWith("t1", "confirmed");
  });
  it("broadcast_group sanitizes and sends to the group chat id", async () => {
    await executeTool("broadcast_group", { text: "Closed today‮evil" }, { chatId: 1 });
    expect(sendMessage).toHaveBeenCalled();
    const sent = (sendMessage as unknown as { mock: { calls: unknown[][] } }).mock.calls[0];
    expect(sent[0]).toBe("555");
    expect(sent[1]).not.toContain("‮"); // bidi stripped
  });
});
