const jwt = require('jsonwebtoken');

function googleCallback(req, res) {
  // User is attached to req.user by passport
  const user = req.user;
  const token = jwt.sign({ user_id: user.user_id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.redirect(process.env.CLIENT_URL + '/home');
}

module.exports = { googleCallback };
