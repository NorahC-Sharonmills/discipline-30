import nodemailer from "nodemailer";
import webpush from "web-push";
import { query } from "./db.js";

function currentParts(timezone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date());
  const value = (type) => parts.find((part) => part.type === type)?.value;
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    time: `${value("hour")}:${value("minute")}`
  };
}

function mailTransport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined
  });
}

function configurePush() {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@example.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  return true;
}

export async function sendReminder(user, channels = { email: true, push: true }) {
  const delivered = [];
  const transporter = mailTransport();
  if (channels.email && user.emailReminder && transporter) {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: "Nhắc ghi nhật ký Discipline 30",
      text: "Đến giờ cập nhật checklist, số đo và ghi chú hôm nay."
    });
    delivered.push("email");
  }

  if (channels.push && configurePush()) {
    const subscriptions = await query(
      "SELECT id, subscription FROM push_subscriptions WHERE user_id = $1",
      [user.id]
    );
    await Promise.all(
      subscriptions.rows.map((row) =>
        webpush.sendNotification(
          row.subscription,
          JSON.stringify({
            title: "Discipline 30",
            body: "Đến giờ cập nhật tiến độ hôm nay."
          })
        ).catch(async (error) => {
          if (error.statusCode === 404 || error.statusCode === 410) {
            await query("DELETE FROM push_subscriptions WHERE id = $1", [row.id]);
          }
        })
      )
    );
    if (subscriptions.rowCount) delivered.push("push");
  }
  return delivered;
}

export async function runReminderCycle() {
  const result = await query(
    `SELECT u.id, u.email, g.goal_data
     FROM users u
     JOIN goals g ON g.user_id = u.id`
  );

  for (const row of result.rows) {
    const goals = row.goal_data || {};
    const timezone = goals.timezone || "Asia/Bangkok";
    const now = currentParts(timezone);
    if (now.time !== (goals.reminderTime || "20:00")) continue;

    const existing = await query(
      `SELECT channel FROM reminder_deliveries
       WHERE user_id = $1 AND delivery_date = $2`,
      [row.id, now.date]
    );
    const sentChannels = new Set(existing.rows.map((item) => item.channel));
    const delivered = await sendReminder({
      id: row.id,
      email: row.email,
      emailReminder: Boolean(goals.emailReminder)
    }, {
      email: !sentChannels.has("email"),
      push: !sentChannels.has("push")
    });

    for (const channel of delivered) {
      await query(
        `INSERT INTO reminder_deliveries (user_id, delivery_date, channel)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, delivery_date, channel) DO NOTHING`,
        [row.id, now.date, channel]
      );
    }
  }
}

export function startReminderScheduler() {
  const timer = setInterval(() => {
    runReminderCycle().catch((error) => console.error("Reminder cycle failed", error));
  }, 60_000);
  timer.unref();
  return timer;
}
