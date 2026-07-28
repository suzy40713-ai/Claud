import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./lib/env.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { dailyLogRouter } from "./modules/daily-log/daily-log.routes.js";
import { activitiesRouter } from "./modules/activities/activities.routes.js";
import { coachRouter } from "./modules/coach/coach.routes.js";

const app = express();

app.use(cors({ origin: env.frontendOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/daily-logs", dailyLogRouter);
app.use("/api/activities", activitiesRouter);
app.use("/api/coach/messages", coachRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Erreur serveur inattendue" });
});

app.listen(env.port, () => {
  console.log(`Backend demarre sur http://localhost:${env.port}`);
});
