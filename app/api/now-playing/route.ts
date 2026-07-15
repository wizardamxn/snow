import { getNowPlaying } from "@/lib/data/lastfm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getNowPlaying();
  return NextResponse.json(data);
}
