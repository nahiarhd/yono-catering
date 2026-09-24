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

  const adminToken = signSession({
    userId: "admin-1",
    role: "admin",
    exp: Math.floor(Date.now() / 1000) + 3600,
  });
  const adminPayload = verifySessionToken(adminToken);
  assert.ok(adminPayload);
  assert.strictEqual(adminPayload?.role, "admin");

  const { isAdmin, canOrder } = await import("../auth");
  assert.strictEqual(isAdmin({ role: "yono" }), true);
  assert.strictEqual(isAdmin({ role: "admin" }), true);
  assert.strictEqual(isAdmin({ role: "member" }), false);

  assert.strictEqual(canOrder({ role: "yono" }), false);
  assert.strictEqual(canOrder({ role: "admin" }), true);
  assert.strictEqual(canOrder({ role: "member" }), true);

  console.log("auth.test.ts ok");
}

main();