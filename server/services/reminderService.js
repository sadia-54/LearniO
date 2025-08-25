const prisma = require('../db');
const { sendEmail } = require('./emailService');
const cron = require('node-cron');

function formatMinutes(mins) {
  if (!mins) return '0 mins';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m} mins`;
}

async function buildTodaySummary(userId) {
  const start = new Date(); start.setHours(0,0,0,0);
  const end = new Date(); end.setHours(23,59,59,999);
  const [user, tasks, completedAgg] = await Promise.all([
    prisma.users.findUnique({ where: { user_id: userId } }),
    prisma.tasks.findMany({
      where: {
        plan: { goal: { user_id: userId } },
        plan: { date: { gte: start, lte: end } },
      },
      select: { title: true, status: true }
    }),
    prisma.tasks.aggregate({
      _sum: { estimated_duration: true },
      where: { status: 'complete', completed_at: { gte: start, lte: end }, plan: { goal: { user_id: userId } } }
    })
  ]);
  const pending = tasks.filter(t => t.status === 'incomplete').map(t => `• ${t.title}`).join('<br/>' ) || 'No pending tasks today.';
  const completed = tasks.filter(t => t.status === 'complete').length;
  const skipped = tasks.filter(t => t.status === 'skipped').length;
  const minutes = completedAgg._sum.estimated_duration || 0;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif">
      <h2>Today's Study Reminder</h2>
      <p>Hello ${user?.name || ''}, here is your quick summary for today:</p>
      <ul>
        <li>Completed tasks: <b>${completed}</b></li>
        <li>Skipped tasks: <b>${skipped}</b></li>
        <li>Time studied: <b>${formatMinutes(minutes)}</b></li>
      </ul>
      <h3>Pending Tasks</h3>
      <p>${pending}</p>
    </div>
  `;
  return { to: user?.email, subject: "LearniO • Today's Study Reminder", html };
}

async function sendDailyReminder(userId) {
  const msg = await buildTodaySummary(userId);
  if (!msg.to) return { skipped: true };
  return sendEmail(msg);
}

// Cron job: run at 08:00 local time daily
function startDailyReminderCron() {
  if (process.env.DISABLE_REMINDER_CRON === 'true') return;
  cron.schedule('0 8 * * *', async () => {
    try {
      // Find users who opted into email reminders
      const users = await prisma.settings.findMany({ where: { email_reminder: true }, select: { user_id: true } });
      for (const s of users) {
        try { await sendDailyReminder(s.user_id); } catch (e) { console.error('Reminder send failed:', e?.message || e); }
      }
      console.log('Daily reminder cron executed');
    } catch (err) {
      console.error('Cron error:', err?.message || err);
    }
  });
}

module.exports = { sendDailyReminder, startDailyReminderCron };
