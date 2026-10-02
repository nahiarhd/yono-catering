import assert from "assert";
import { clearLoginFailures, loginLockMinutes, recordLoginFailure } from "../login-throttle";

const t0 = 1_000_000;

for (let i = 0; i < 4; i++) recordLoginFailure("u1", t0);
assert.strictEqual(loginLockMinutes("u1", t0), 0);

recordLoginFailure("u1", t0);
assert.strictEqual(loginLockMinutes("u1", t0), 15);
assert.strictEqual(loginLockMinutes("u1", t0 + 14 * 60_000 + 1), 1);
assert.strictEqual(loginLockMinutes("u1", t0 + 15 * 60_000), 0);
assert.strictEqual(loginLockMinutes("u2", t0), 0);

clearLoginFailures("u1");
for (let i = 0; i < 4; i++) recordLoginFailure("u1", t0);
assert.strictEqual(loginLockMinutes("u1", t0), 0);

console.log("login-throttle.test.ts ok");
