import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcryptjs";
import User from "../models/User";

export function initPassport(): void {
  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !user.passwordHash) return done(null, false, { message: "Invalid credentials" });
        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) return done(null, false, { message: "Invalid credentials" });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.use(
    new GoogleStrategy(
      {
        clientID:     process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL:  process.env.GOOGLE_CALLBACK_URL!,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) return done(new Error("No email from Google profile"));

          let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });

          if (user) {
            if (!user.googleId) {
              user.googleId = profile.id;
              user.avatar = user.avatar ?? profile.photos?.[0]?.value;
              await user.save();
            }
          } else {
            user = await User.create({
              name:     profile.displayName,
              email,
              googleId: profile.id,
              avatar:   profile.photos?.[0]?.value,
            });
          }
          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );
}

export default passport;
