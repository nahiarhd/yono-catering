import assert from "assert";
import {
  escapeHtml,
  formatMenuBroadcastMessage,
  formatReminderMessage,
  getAppUrl,
  getBotUsername,
} from "../telegram";

function testEscapeHtml() {
  assert.strictEqual(escapeHtml("<script>alert('xss')</script>"), "&lt;script&gt;alert('xss')&lt;/script&gt;");
  assert.strictEqual(escapeHtml("Ayam & Bebek"), "Ayam &amp; Bebek");
}

function testGetAppUrl() {
  const original = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = "https://katering.coofis.id///";
  assert.strictEqual(getAppUrl(), "https://katering.coofis.id");

  delete process.env.NEXT_PUBLIC_APP_URL;
  delete process.env.APP_URL;
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  assert.strictEqual(getAppUrl(), "http://localhost:3000");

  if (original) process.env.NEXT_PUBLIC_APP_URL = original;
}

function testGetBotUsername() {
  const original = process.env.TELEGRAM_BOT_USERNAME;
  process.env.TELEGRAM_BOT_USERNAME = "@yonocateringbot";
  assert.strictEqual(getBotUsername(), "yonocateringbot");

  if (original) process.env.TELEGRAM_BOT_USERNAME = original;
}

function testFormatMenuBroadcast() {
  const msg = formatMenuBroadcastMessage({
    dish: "Bebek Goreng Madura",
    cutoff: "08:00",
    note: "Bumbu hitam pedas",
    appUrl: "https://katering.coofis.id",
  });

  assert.ok(msg.includes("MENU HARI INI DIPOSTING!"));
  assert.ok(msg.includes("Bebek Goreng Madura"));
  assert.ok(msg.includes("Bumbu hitam pedas"));
  assert.ok(msg.includes("08:00 WIB"));
  assert.ok(msg.includes("https://katering.coofis.id/home"));
  assert.ok(!msg.includes("—"), "Must not contain em dash");
}

function testFormatReminderMessage() {
  const msg = formatReminderMessage({
    name: "Raihan",
    dish: "Soto Ayam Ambengan",
    cutoff: "08:00",
    appUrl: "https://katering.coofis.id",
  });

  assert.ok(msg.includes("PENGINGAT KATERING PAK YONO"));
  assert.ok(msg.includes("Raihan"));
  assert.ok(msg.includes("Soto Ayam Ambengan"));
  assert.ok(msg.includes("08:00 WIB"));
  assert.ok(msg.includes("https://katering.coofis.id/home"));
  assert.ok(!msg.includes("—"), "Must not contain em dash");
}

testEscapeHtml();
testGetAppUrl();
testGetBotUsername();
testFormatMenuBroadcast();
testFormatReminderMessage();
console.log("telegram.test.ts ok");
