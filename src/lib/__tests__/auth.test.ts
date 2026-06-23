import assert from "assert";

async function main() {
  process.env.SESSION_SECRET = "test-secret-for-unit-tests-only";
  const { signSession, verifySessionToken } = await import("../session");

  const token = signSession({
    userId: "user-1",
    role: "member",
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  const payload = verifySessionToken(token);
  assert.ok(payload);
  assert.strictEqual(payload?.userId, "user-1");
  assert.strictEqual(payload?.role, "member");

  const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
  assert.strictEqual(verifySessionToken(tampered), null);

  console.log("auth.test.ts ok");
}

main();