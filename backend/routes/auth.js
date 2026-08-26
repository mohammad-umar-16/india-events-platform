import express from 'express';
import passport from 'passport';

const router = express.Router();

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed` }),
  (req, res) => {
    // Admins go to the dashboard; everyone else goes back to the events page
    const redirectTo = req.user?.role === 'admin' ? '/dashboard' : '/';
    res.redirect(`${process.env.FRONTEND_URL}${redirectTo}`);
  }
);

router.get('/current-user', (req, res) => {
  if (req.user) {
    res.json({
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture,
      role: req.user.role
    });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ message: 'Logged out successfully' });
  });
});

export default router;