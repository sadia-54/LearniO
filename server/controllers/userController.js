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
