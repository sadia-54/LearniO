const userService = require('../services/userService');

async function upsertUser(req, res) {
  try {
    console.log('📝 Upsert user request received:', req.body);
    
    const { name, email, profile_picture } = req.body;
    
    if (!email) {
      console.log('❌ Email is missing from request');
      return res.status(400).json({ error: 'Email is required' });
    }
    
    console.log('🔄 Attempting to upsert user with email:', email);
    
    const user = await userService.upsertUser({ name, email, profile_picture });
    
    console.log('✅ User upserted successfully:', user);
    res.status(200).json({ user });
  } catch (err) {
    console.error('❌ Error in upsertUser controller:', err);
    res.status(500).json({ 
      error: 'Database error', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}

module.exports = { upsertUser };

