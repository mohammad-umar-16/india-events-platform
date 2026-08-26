import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

const ADMIN_EMAIL = 'umararshad0.ua@gmail.com'; // only this account gets Dashboard access

export function configurePassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });
          const email = profile.emails?.[0]?.value;

          if (user) {
            user.name = profile.displayName;
            user.picture = profile.photos?.[0]?.value;
            await user.save();
            return done(null, user);
          }

          user = await User.create({
            googleId: profile.id,
            email,
            name: profile.displayName,
            picture: profile.photos?.[0]?.value,
            role: email === ADMIN_EMAIL ? 'admin' : 'user' // was hardcoded 'admin' for everyone before
          });

          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => { done(null, user.id); });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}