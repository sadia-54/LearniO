const { OAuth2Client } = require('google-auth-library');
const { upsertUser } = require('./userController'); // adjust path if needed

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function googleAuth(req, res) {
  const { idToken } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    // Upsert user via userController method (which calls userService)
    const user = await upsertUser({ 
      name: payload.name, 
      email: payload.email, 
      profile_picture: payload.picture 
    });

    // Return only user info — no JWT
    res.json({ user_id: user.user_id, email: user.email, name: user.name });

  } catch (err) {
    console.error('❌ Google token verification failed:', err);
    res.status(401).json({ error: 'Invalid Google token' });
  }
}

module.exports = { googleAuth };
