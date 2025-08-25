const prisma = require('../db');

function defaults() {
  return {
    email_reminder: true,
    reminderFrequency: 'Daily',
    reminderTypes: ['Pending Tasks', 'Upcoming Deadlines'],
    inAppNotifications: true,
    notificationSound: true,
    motivationalTips: true,
    tipFrequency: 'Daily',
    daily_study_hours: 2,
    interface_theme: 'light',
    weekend_days: [],
  };
}

async function getUserSettings(userId) {
  const s = await prisma.settings.findUnique({ where: { user_id: userId } });
  if (!s) return defaults();
  const prefs = s.preferred_time_blocks ? (typeof s.preferred_time_blocks === 'object' ? s.preferred_time_blocks : {}) : {};
  return {
    email_reminder: s.email_reminder,
    daily_study_hours: s.daily_study_hours,
    interface_theme: s.interface_theme,
    weekend_days: s.weekend_days || [],
    reminderFrequency: prefs.reminderFrequency ?? 'Daily',
    reminderTypes: prefs.reminderTypes ?? ['Pending Tasks', 'Upcoming Deadlines'],
    inAppNotifications: prefs.inAppNotifications ?? true,
    notificationSound: prefs.notificationSound ?? true,
    motivationalTips: prefs.motivationalTips ?? true,
    tipFrequency: prefs.tipFrequency ?? 'Daily',
  };
}

async function updateUserSettings(userId, update) {
  // Fetch current to merge JSON prefs
  const existing = await prisma.settings.findUnique({ where: { user_id: userId } });
  const currentPrefs = existing?.preferred_time_blocks && typeof existing.preferred_time_blocks === 'object' ? existing.preferred_time_blocks : {};
  const nextPrefs = {
    ...currentPrefs,
    ...(update.reminderFrequency !== undefined ? { reminderFrequency: update.reminderFrequency } : {}),
    ...(update.reminderTypes !== undefined ? { reminderTypes: update.reminderTypes } : {}),
    ...(update.inAppNotifications !== undefined ? { inAppNotifications: update.inAppNotifications } : {}),
    ...(update.notificationSound !== undefined ? { notificationSound: update.notificationSound } : {}),
    ...(update.motivationalTips !== undefined ? { motivationalTips: update.motivationalTips } : {}),
    ...(update.tipFrequency !== undefined ? { tipFrequency: update.tipFrequency } : {}),
  };

  const data = {
    email_reminder: update.email_reminder ?? existing?.email_reminder ?? true,
    daily_study_hours: update.daily_study_hours ?? existing?.daily_study_hours ?? 2,
    interface_theme: update.interface_theme ?? existing?.interface_theme ?? 'light',
    weekend_days: update.weekend_days ?? existing?.weekend_days ?? [],
    preferred_time_blocks: nextPrefs,
  };

  const saved = await prisma.settings.upsert({
    where: { user_id: userId },
    create: { user_id: userId, ...data },
    update: data,
  });
  return getUserSettings(userId);
}

module.exports = { getUserSettings, updateUserSettings };
