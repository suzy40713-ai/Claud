import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import "express-async-errors";
import { env } from "./lib/env.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { dailyLogRouter } from "./modules/daily-log/daily-log.routes.js";
import { activitiesRouter } from "./modules/activities/activities.routes.js";
import { coachRouter } from "./modules/coach/coach.routes.js";
import { trainingPlanRouter } from "./modules/training-plan/training-plan.routes.js";
import { pushRouter } from "./modules/push/push.routes.js";
import { stravaRouter } from "./modules/strava/strava.routes.js";
import { startOverloadAlertScheduler } from "./lib/scheduler.js";
import { apiRateLimiter } from "./lib/rate-limit.js";

// Filet de securite : une exception non geree ne doit jamais faire tomber
// tout le serveur pour tous les utilisateurs. On logge et on continue plutot
// que de laisser Node terminer le process (comportement par defaut depuis
// Node 15).
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

const app = express();

app.use(cors({ origin: env.frontendOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", apiRateLimiter);

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/daily-logs", dailyLogRouter);
app.use("/api/activities", activitiesRouter);
app.use("/api/coach/messages", coachRouter);
app.use("/api/training-plan", trainingPlanRouter);
app.use("/api/push", pushRouter);
app.use("/api/strava", stravaRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Erreur serveur inattendue" });
});

app.listen(env.port, () => {
  console.log(`Backend demarre sur http://localhost:${env.port}`);
  startOverloadAlertScheduler();
});
