import "dotenv/config";
import { app } from "./app.js";
import { startReminderScheduler } from "./reminders.js";

const port = Number(process.env.PORT || 3000);

app.listen(port, "0.0.0.0", () => {
  console.log(`Discipline 30 API: http://localhost:${port}`);
});

startReminderScheduler();
