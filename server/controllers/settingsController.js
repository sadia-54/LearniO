const { getUserSettings, updateUserSettings } = require('../services/settingsService');

async function getSettings(req, res, next) {
  try {
    const { userId } = req.params;
    const settings = await getUserSettings(userId);
    res.json({ settings });
  } catch (err) { next(err); }
}

async function updateSettings(req, res, next) {
  try {
    const { userId } = req.params;
    const settings = await updateUserSettings(userId, req.body || {});
    res.json({ settings });
  } catch (err) { next(err); }
}

module.exports = { getSettings, updateSettings };
