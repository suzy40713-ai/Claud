import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const video = await prisma.video.findUnique({ where: { id } });
  if (!video) {
    return NextResponse.json({ error: "Video introuvable." }, { status: 404 });
  }
  return NextResponse.json({ video });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 200) : "";
  if (!title) {
    return NextResponse.json({ error: "Titre invalide." }, { status: 400 });
  }

  const video = await prisma.video.update({ where: { id }, data: { title } }).catch(() => null);
  if (!video) {
    return NextResponse.json({ error: "Video introuvable." }, { status: 404 });
  }
  return NextResponse.json({ video });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const video = await prisma.video.delete({ where: { id } }).catch(() => null);
  if (!video) {
    return NextResponse.json({ error: "Video introuvable." }, { status: 404 });
  }

  const dir = path.join(process.cwd(), "public", "generated", id);
  await fs.rm(dir, { recursive: true, force: true }).catch(() => {});

  return NextResponse.json({ ok: true });
}
