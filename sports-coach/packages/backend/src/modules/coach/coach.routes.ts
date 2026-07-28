import { Router } from "express";
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.js";
import { buildUserContext } from "./coach.context.js";
import { buildSystemBlocks, streamCoachReply } from "./coach.service.js";
import { toCoachMessageDTO } from "./coach.mapper.js";

export const coachRouter = Router();
coachRouter.use(requireAuth);

const HISTORY_LIMIT = 30;

const sendMessageSchema = z.object({
  content: z.string().trim().min(1, "Le message ne peut pas etre vide").max(4000),
});

coachRouter.get("/", async (req, res) => {
  const messages = await prisma.coachMessage.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "asc" },
    take: HISTORY_LIMIT,
  });
  res.json({ messages: messages.map(toCoachMessageDTO) });
});

coachRouter.post("/", async (req, res) => {
  const parsed = sendMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Requete invalide" });
    return;
  }

  const anthropicConfigured = Boolean(process.env.ANTHROPIC_API_KEY);
  if (!anthropicConfigured) {
    res.status(503).json({ error: "Le coach IA n'est pas configure sur ce serveur." });
    return;
  }

  const userId = req.userId!;
  const { content } = parsed.data;

  const userMessage = await prisma.coachMessage.create({
    data: { userId, role: "user", content },
  });

  const [context, history] = await Promise.all([
    buildUserContext(userId),
    prisma.coachMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      take: HISTORY_LIMIT,
    }),
  ]);

  const systemBlocks = buildSystemBlocks(JSON.stringify(context));
  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role === "user" ? "user" : "assistant",
    content: m.content,
  }));

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: "user_message", message: toCoachMessageDTO(userMessage) })}\n\n`);

  try {
    const fullReply = await streamCoachReply({
      systemBlocks,
      messages,
      onDelta: (delta) => {
        res.write(`data: ${JSON.stringify({ type: "delta", text: delta })}\n\n`);
      },
    });

    const assistantMessage = await prisma.coachMessage.create({
      data: { userId, role: "assistant", content: fullReply },
    });

    res.write(
      `data: ${JSON.stringify({ type: "done", message: toCoachMessageDTO(assistantMessage) })}\n\n`
    );
  } catch (error) {
    res.write(
      `data: ${JSON.stringify({
        type: "error",
        error: error instanceof Error ? error.message : "Erreur du coach IA",
      })}\n\n`
    );
  } finally {
    res.end();
  }
});
