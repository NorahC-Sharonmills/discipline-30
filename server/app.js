import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ZodError } from "zod";
import { createToken, requireAuth } from "./auth.js";
import { query } from "./db.js";
import { sendReminder } from "./reminders.js";
import {
  authSchema,
  dayIdSchema,
  editSchema,
  goalSchema,
  logSchema,
  planSchema,
  resetProgressSchema
} from "./validation.js";

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:4173" }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/api/health", async (_req, res, next) => {
  try {
    await query("SELECT 1");
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const input = authSchema.extend({ name: authSchema.shape.name.unwrap() }).parse(req.body);
    const passwordHash = await bcrypt.hash(input.password, 12);
    const result = await query(
      `WITH new_user AS (
         INSERT INTO users (email, password_hash, name)
         VALUES ($1, $2, $3)
         RETURNING id, email, name, created_at
       ), new_plan AS (
         INSERT INTO plans (user_id, start_date, end_date, plan_data)
         SELECT id, CURRENT_DATE, CURRENT_DATE + 29, '{}'::jsonb
         FROM new_user
       )
       SELECT id, email, name, created_at FROM new_user`,
      [input.email, passwordHash, input.name]
    );
    const user = result.rows[0];
    res.status(201).json({ token: createToken(user), user });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Email này đã được sử dụng." });
    }
    next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const input = authSchema.omit({ name: true }).parse(req.body);
    const result = await query(
      "SELECT id, email, name, password_hash, created_at FROM users WHERE email = $1",
      [input.email]
    );
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(input.password, user.password_hash))) {
      return res.status(401).json({ error: "Email hoặc mật khẩu không đúng." });
    }
    delete user.password_hash;
    res.json({ token: createToken(user), user });
  } catch (error) {
    next(error);
  }
});

app.get("/api/me", requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      "SELECT id, email, name, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

app.get("/api/data", requireAuth, async (req, res, next) => {
  try {
    const [logs, edits, goals, plan] = await Promise.all([
      query(
        `SELECT day_id, checklists, measurements, notes, completed
         FROM daily_logs WHERE user_id = $1 ORDER BY day_id`,
        [req.user.id]
      ),
      query(
        "SELECT day_id, edit_data FROM plan_edits WHERE user_id = $1 ORDER BY day_id",
        [req.user.id]
      ),
      query("SELECT goal_data FROM goals WHERE user_id = $1", [req.user.id]),
      query(
        `SELECT start_date::text AS "startDate", end_date::text AS "endDate",
                plan_data AS "planData"
         FROM plans WHERE user_id = $1`,
        [req.user.id]
      )
    ]);

    res.json({
      logs: Object.fromEntries(logs.rows.map((row) => [
        row.day_id,
        {
          checklist: row.checklists,
          ...row.measurements,
          note: row.notes,
          completed: row.completed
        }
      ])),
      planEdits: Object.fromEntries(edits.rows.map((row) => [row.day_id, row.edit_data])),
      goals: goals.rows[0]?.goal_data || {},
      plan: plan.rows[0] || null
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/plan", requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT start_date::text AS "startDate", end_date::text AS "endDate",
              plan_data AS "planData"
       FROM plans WHERE user_id = $1`,
      [req.user.id]
    );
    res.json(result.rows[0] || null);
  } catch (error) {
    next(error);
  }
});

app.put("/api/plan", requireAuth, async (req, res, next) => {
  try {
    const plan = planSchema.parse(req.body);
    await query(
      `INSERT INTO plans (user_id, start_date, end_date, plan_data)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        plan_data = EXCLUDED.plan_data,
        updated_at = NOW()`,
      [req.user.id, plan.startDate, plan.endDate, plan.planData]
    );
    res.json({ ok: true, plan });
  } catch (error) {
    next(error);
  }
});

app.put("/api/logs/:dayId", requireAuth, async (req, res, next) => {
  try {
    const dayId = dayIdSchema.parse(req.params.dayId);
    const log = logSchema.parse(req.body);
    const measurements = {
      actualKcal: log.actualKcal,
      actualWaterLiter: log.actualWaterLiter,
      weight: log.weight,
      waist: log.waist
    };
    await query(
      `INSERT INTO daily_logs
        (user_id, day_id, checklists, measurements, notes, completed)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, day_id) DO UPDATE SET
        checklists = EXCLUDED.checklists,
        measurements = EXCLUDED.measurements,
        notes = EXCLUDED.notes,
        completed = EXCLUDED.completed,
        updated_at = NOW()`,
      [req.user.id, dayId, log.checklist, measurements, log.note, log.completed]
    );
    res.json({ ok: true, log });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/logs/:dayId", requireAuth, async (req, res, next) => {
  try {
    const dayId = dayIdSchema.parse(req.params.dayId);
    await query("DELETE FROM daily_logs WHERE user_id = $1 AND day_id = $2", [
      req.user.id,
      dayId
    ]);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.put("/api/plan-edits/:dayId", requireAuth, async (req, res, next) => {
  try {
    const dayId = dayIdSchema.parse(req.params.dayId);
    const edit = editSchema.parse(req.body);
    await query(
      `INSERT INTO plan_edits (user_id, day_id, edit_data)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, day_id) DO UPDATE SET
        edit_data = EXCLUDED.edit_data,
        updated_at = NOW()`,
      [req.user.id, dayId, edit]
    );
    res.json({ ok: true, edit });
  } catch (error) {
    next(error);
  }
});

app.put("/api/goals", requireAuth, async (req, res, next) => {
  try {
    const goals = goalSchema.parse(req.body);
    await query(
      `INSERT INTO goals (user_id, goal_data)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET goal_data = EXCLUDED.goal_data, updated_at = NOW()`,
      [req.user.id, goals]
    );
    res.json({ ok: true, goals });
  } catch (error) {
    next(error);
  }
});

app.post("/api/reset", requireAuth, async (req, res, next) => {
  try {
    const { startDate } = resetProgressSchema.parse(req.body);
    const result = await query(
      `WITH deleted_logs AS (
         DELETE FROM daily_logs WHERE user_id = $1
       ), deleted_edits AS (
         DELETE FROM plan_edits WHERE user_id = $1
       ), deleted_goals AS (
         DELETE FROM goals WHERE user_id = $1
       ), deleted_deliveries AS (
         DELETE FROM reminder_deliveries WHERE user_id = $1
       )
       INSERT INTO plans (user_id, start_date, end_date, plan_data)
       VALUES ($1, $2::date, $2::date + 29, '{}'::jsonb)
       ON CONFLICT (user_id) DO UPDATE SET
         start_date = EXCLUDED.start_date,
       end_date = EXCLUDED.end_date,
       plan_data = EXCLUDED.plan_data,
       updated_at = NOW()
       RETURNING start_date::text AS "startDate", end_date::text AS "endDate",
                 plan_data AS "planData"`,
      [req.user.id, startDate]
    );
    res.json({ ok: true, plan: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

app.post("/api/import", requireAuth, async (req, res, next) => {
  try {
    const logs = req.body.logs || {};
    const planEdits = req.body.planEdits || {};
    for (const [rawDayId, rawLog] of Object.entries(logs)) {
      const dayId = dayIdSchema.parse(rawDayId);
      const log = logSchema.parse(rawLog);
      await query(
        `INSERT INTO daily_logs (user_id, day_id, checklists, measurements, notes, completed)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, day_id) DO NOTHING`,
        [
          req.user.id,
          dayId,
          log.checklist,
          {
            actualKcal: log.actualKcal,
            actualWaterLiter: log.actualWaterLiter,
            weight: log.weight,
            waist: log.waist
          },
          log.note,
          log.completed
        ]
      );
    }
    for (const [rawDayId, rawEdit] of Object.entries(planEdits)) {
      const dayId = dayIdSchema.parse(rawDayId);
      const edit = editSchema.parse(rawEdit);
      await query(
        `INSERT INTO plan_edits (user_id, day_id, edit_data)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, day_id) DO NOTHING`,
        [req.user.id, dayId, edit]
      );
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/push/subscribe", requireAuth, async (req, res, next) => {
  try {
    const subscription = req.body;
    if (!subscription?.endpoint) {
      return res.status(400).json({ error: "Push subscription không hợp lệ." });
    }
    await query(
      `INSERT INTO push_subscriptions (user_id, endpoint, subscription)
       VALUES ($1, $2, $3)
       ON CONFLICT (endpoint) DO UPDATE SET subscription = EXCLUDED.subscription`,
      [req.user.id, subscription.endpoint, subscription]
    );
    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/reminders/test", requireAuth, async (req, res, next) => {
  try {
    const channels = await sendReminder({
      id: req.user.id,
      email: req.user.email,
      emailReminder: true
    });
    res.json({ ok: true, channels });
  } catch (error) {
    next(error);
  }
});

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(serverDir, "../dist");
app.use(express.static(distDir));
app.get("/{*path}", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(distDir, "index.html"), (error) => {
    if (error) next();
  });
});

app.use((error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "Dữ liệu không hợp lệ.",
      details: error.issues
    });
  }
  console.error(error);
  res.status(500).json({ error: "Máy chủ gặp lỗi. Vui lòng thử lại." });
});
