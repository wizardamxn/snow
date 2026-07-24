import { NextResponse } from "next/server";
import { getRedis } from "@/lib/analytics/redis";
import { isTrackEvent } from "@/lib/analytics/events";

export async function POST(request: Request) {
  const redis = getRedis();
  if (!redis) return NextResponse.json({ ok: false });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const event = (body as { event?: unknown })?.event;
  if (!isTrackEvent(event)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await redis.incr(`stats:${event}`);
  return NextResponse.json({ ok: true });
}
