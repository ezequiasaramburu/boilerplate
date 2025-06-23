import passport, { DoneCallback } from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Profile as GitHubProfile, Strategy as GitHubStrategy } from 'passport-github2';
import { socialAuthService } from '../services/social-auth.service.js';


// Only configure OAuth strategies if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    scope: ['profile', 'email'],
  }, async (_accessToken, _refreshToken, profile, done) => {
    try {
      const oauthProfile = socialAuthService.formatGoogleProfile(profile);
      const result = await socialAuthService.handleOAuthCallback(oauthProfile);
      return done(null, result);
    } catch (error) {
      return done(error, false);
    }
  }));
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL!,
    scope: ['user:email'],
  }, async (
    _accessToken: string,
    _refreshToken: string,
    profile: GitHubProfile,
    done: DoneCallback,
  ) => {
    try {
      const oauthProfile = socialAuthService.formatGitHubProfile(profile);
      const result = await socialAuthService.handleOAuthCallback(oauthProfile);
      return done(null, result);
    } catch (error) {
      return done(error, null);
    }
  }));
}

// Serialize user for the session
passport.serializeUser((user: any, done) => {
  done(null, user);
});

// Deserialize user from the session
passport.deserializeUser((user: any, done) => {
  done(null, user);
});

export default passport;
