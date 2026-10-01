export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Jalankan scheduler di background Node.js
    const { checkAndSendReminders } = await import("@/lib/reminder-service");

    // Lakukan pengecekan setiap 30 detik
    setInterval(async () => {
      try {
        await checkAndSendReminders();
      } catch (err) {
        console.error("[Scheduler] Error checking automatic reminders:", err);
      }
    }, 30 * 1000);
  }
}
