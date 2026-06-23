"use server";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function savePushSubscription(sub: PushSubscriptionJSON) {
  const user = await requireUser();
  await db.user.update({
    where: { id: user.id },
    data: { pushSubscription: sub as object },
  });
}