import { Prisma } from "@prisma/client";
import webpush from "web-push";
import type { PushSubscription } from "web-push";
import { db } from "./db";

function configure() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@example.com";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? process.env.VAPID_PUBLIC_KEY ?? "";
}

export async function sendPush(
  userIds: string[],
  payload: { title: string; body: string; url?: string },
) {
  if (!configure() || userIds.length === 0) return;

  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, pushSubscription: true },
  });

  await Promise.all(
    users.map(async (user) => {
      const sub = user.pushSubscription as PushSubscription | null;
      if (!sub) return;
      try {
        await webpush.sendNotification(sub, JSON.stringify(payload));
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410) {
          await db.user.update({
            where: { id: user.id },
            data: { pushSubscription: Prisma.JsonNull },
          });
        }
      }
    }),
  );
}