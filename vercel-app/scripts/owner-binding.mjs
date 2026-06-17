#!/usr/bin/env node
/**
 * Diagnose and (when needed) reset the bound owner of the Bistro Cloud owner-DM
 * Telegram assistant. The binding lives in Vercel Blob at telegram/owner.json
 * and is written ONCE, by the /start handler — re-binding is by design a manual
 * step (delete the record, then re-/start from the correct chat). This script
 * is that manual step, plus the diagnostics that tell you whether you need it.
 *
 * Usage (run from vercel-app/):
 *   node scripts/owner-binding.mjs            inspect the binding + recent intrusions
 *   node scripts/owner-binding.mjs --audit    also dump more audit lines (default 20)
 *   node scripts/owner-binding.mjs --unbind    DELETE telegram/owner.json (re-bind enabled)
 *
 * Prerequisite: BLOB_READ_WRITE_TOKEN must be set — the same token the app uses
 * (Vercel sets it automatically when a Blob store is linked). Put it in
 * vercel-app/.env.local or export it in your shell, e.g.
 *   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx node scripts/owner-binding.mjs
 *
 * Why a binding can point at the wrong chat (so the owner sees the refusal):
 *   - The first /start happened in a GROUP — group chat ids are NEGATIVE and
 *     unrelated to the user id. A later DM is a different chat → refusal.
 *   - A different Telegram account (a dev/test phone) did the first bind.
 * A negative stored chatId, or one that differs from the userId in the recent
 * "unauthorized-message" audit lines below, confirms it. Then run --unbind and
 * re-send /start <ADMIN_PASS> from the owner's real 1:1 DM with the bot.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { del, get, list } from "@vercel/blob";

const __dirname = dirname(fileURLToPath(import.meta.url));

const OWNER_PATH = "telegram/owner.json";
const AUDIT_PATH = "telegram/audit.jsonl";
const INTRUSION_KINDS = new Set([
  "unauthorized-message",
  "unauthorized-callback",
  "start-wrong-pass",
  "start-rebind-blocked",
]);

// --- env: mirror setup-telegram.mjs's tiny .env.local reader -----------------
function loadEnvLocal() {
  const env = {};
  try {
    const text = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)="?([^"]*)"?$/);
      if (m) env[m[1]] = m[2].trim();
    }
  } catch {
    // no .env.local — rely on process.env
  }
  return env;
}

const env = loadEnvLocal();
const TOKEN =
  process.env.BLOB_READ_WRITE_TOKEN || env.BLOB_READ_WRITE_TOKEN;

if (!TOKEN) {
  console.error(
    "BLOB_READ_WRITE_TOKEN missing.\n" +
      "Add it to vercel-app/.env.local (or export it), then re-run. It's the\n" +
      "same token the app uses — copy it from the Vercel project's Blob store.",
  );
  process.exit(1);
}
// The @vercel/blob SDK reads the token from this env var.
process.env.BLOB_READ_WRITE_TOKEN = TOKEN;

const opts = { access: "private", useCache: false, token: TOKEN };

async function readBlobText(pathname) {
  // list() first so a genuinely-missing blob is a clean "not found" rather than
  // a thrown 404 from get().
  const { blobs } = await list({ prefix: pathname, token: TOKEN });
  const hit = blobs.find((b) => b.pathname === pathname);
  if (!hit) return null;
  const res = await get(pathname, opts);
  if (!res || res.statusCode !== 200) return null;
  return await new Response(res.stream).text();
}

const mode = process.argv[2] ?? "";

// --- inspect the owner binding -----------------------------------------------
const ownerText = await readBlobText(OWNER_PATH);
if (!ownerText) {
  console.log(`No owner bound (${OWNER_PATH} does not exist).`);
  console.log("The next /start <ADMIN_PASS> from any private DM will bind it.");
} else {
  let owner;
  try {
    owner = JSON.parse(ownerText);
  } catch {
    console.log(`⚠️  ${OWNER_PATH} exists but is not valid JSON:\n${ownerText}`);
    owner = null;
  }
  if (owner) {
    const { chatId, boundAt } = owner;
    console.log(`Bound owner chatId: ${chatId}`);
    if (boundAt) console.log(`Bound at:           ${boundAt}`);
    if (typeof chatId === "number" && chatId < 0) {
      console.log(
        "⚠️  NEGATIVE chatId → this is a GROUP chat, not a 1:1 DM. A direct\n" +
          "    message to the bot is a different chat and will be refused. Run\n" +
          "    --unbind and re-/start from the owner's private DM with the bot.",
      );
    }
  }
}

// --- recent intrusion attempts from the audit log ----------------------------
const auditText = await readBlobText(AUDIT_PATH);
if (auditText) {
  const wantMore = mode === "--audit" || process.argv.includes("--audit");
  const limit = wantMore ? 20 : 8;
  const intrusions = auditText
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter((e) => e && INTRUSION_KINDS.has(e.kind))
    .slice(-limit);

  if (intrusions.length) {
    console.log(`\nRecent refused attempts (last ${intrusions.length}):`);
    for (const e of intrusions) {
      const uid = e.detail?.userId ?? e.detail?.chatId ?? e.chatId ?? "?";
      const user = e.detail?.username ? ` @${e.detail.username}` : "";
      console.log(`  ${e.at}  ${e.kind}  chatId=${e.chatId} userId=${uid}${user}`);
    }
    console.log(
      "\nCompare these chat/user ids to the bound owner chatId above. If the\n" +
        "owner's OWN id appears here, the binding points at a different chat.",
    );
  }
}

// --- optional: delete the binding so a clean re-bind is possible -------------
if (mode === "--unbind") {
  if (!ownerText) {
    console.log("\nNothing to unbind (no owner record).");
    process.exit(0);
  }
  await del(OWNER_PATH, { token: TOKEN });
  console.log(`\n✅ Deleted ${OWNER_PATH}.`);
  console.log(
    "Now, from the owner's real 1:1 DM with the bot (NOT a group), send:\n" +
      "    /start <ADMIN_PASS>\n" +
      "The first /start after deletion binds whatever chat sends it — send once,\n" +
      "from the correct chat. Re-run this script to confirm the new chatId.",
  );
}
