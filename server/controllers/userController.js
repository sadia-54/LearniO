const userService = require('../services/userService');

async function upsertUser({ name, email, profile_picture }) {
  try {
    if (!email) {
      throw new Error('Email is required');
    }
    const user = await userService.upsertUser({ name, email, profile_picture });
    return user;
  } catch (err) {
    console.error('❌ Error in upsertUser:', err);
    throw err;
  }
}

module.exports = { upsertUser };

async function deleteAccount(req, res, next) {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const result = await userService.deleteUserPermanently(userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports.deleteAccount = deleteAccount;
