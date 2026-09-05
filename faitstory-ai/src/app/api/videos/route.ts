import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createVideoSchema } from "@/lib/validation";
import { checkRateLimit, clientKeyFromRequest } from "@/lib/rateLimit";
import { runPipeline } from "@/lib/pipeline/orchestrator";

export async function GET() {
  const videos = await prisma.video.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      subject: true,
      title: true,
      status: true,
      durationSec: true,
      style: true,
      thumbnailPath: true,
      videoPath: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ videos });
}

export async function POST(request: NextRequest) {
  const key = clientKeyFromRequest(request);
  const rate = checkRateLimit(`create:${key}`, 5, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Trop de generations recentes. Reessaie dans ${rate.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requete JSON invalide." }, { status: 400 });
  }

  const parsed = createVideoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Entree invalide." }, { status: 400 });
  }

  const video = await prisma.video.create({ data: parsed.data });

  // Fire-and-forget: this assumes a long-lived Node process (Docker/Render),
  // not a serverless function that gets frozen right after the response.
  runPipeline(video.id).catch((err) => {
    console.error(`Pipeline video ${video.id} a echoue:`, err);
  });

  return NextResponse.json({ id: video.id }, { status: 202 });
}
