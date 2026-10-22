import assert from "assert";

process.env.SESSION_SECRET = "test-secret";
process.env.TELEGRAM_BOT_USERNAME = "testbot";

async function main() {
  const { telegramLinkUrl, verifyTelegramLinkPayload, telegramStatus } = await import("../telegram-status");
  const { isUnreachable } = await import("../telegram");

  const url = telegramLinkUrl("cmabc123userid0000000000x");
  const payload = new URL(url).searchParams.get("start")!;
  assert.ok(url.startsWith("https://t.me/testbot?start="));
  // Telegram only accepts [A-Za-z0-9_-] up to 64 chars as a start payload
  assert.match(payload, /^[A-Za-z0-9_-]{1,64}$/);
  assert.strictEqual(verifyTelegramLinkPayload(payload), "cmabc123userid0000000000x");
  assert.strictEqual(verifyTelegramLinkPayload(payload.replace(/^cm/, "cx")), null);
  assert.strictEqual(verifyTelegramLinkPayload(payload.slice(0, -1)), null);
  assert.strictEqual(verifyTelegramLinkPayload("noUnderscore"), null);
  // Signatures often contain "_" themselves; every one must still verify
  for (let i = 0; i < 200; i++) {
    const uid = `cm${i.toString(36).padStart(23, "0")}`;
    const p = new URL(telegramLinkUrl(uid)).searchParams.get("start")!;
    assert.strictEqual(verifyTelegramLinkPayload(p), uid, p);
  }
  assert.strictEqual(verifyTelegramLinkPayload("_abc"), null);

  assert.strictEqual(telegramStatus({ telegramChatId: null, telegramFailedAt: null }), "none");
  assert.strictEqual(telegramStatus({ telegramChatId: "1", telegramFailedAt: new Date() }), "failed");
  assert.strictEqual(telegramStatus({ telegramChatId: "1", telegramFailedAt: null }), "ok");

  assert.ok(isUnreachable("Forbidden: bot was blocked by the user"));
  assert.ok(isUnreachable("Bad Request: chat not found"));
  assert.ok(isUnreachable("Forbidden: bot can't initiate conversation with a user"));
  assert.ok(!isUnreachable("Too Many Requests: retry after 5"));

  console.log("telegram-link.test.ts ok");
}

main();
