const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/Users');
const Tenant = require('../models/Tenant');

passport.serializeUser((user, done) => {
    // For users with pending registration, serialize the temporary user data
    if (user.pendingRegistration) {
        done(null, { pendingRegistration: true, ...user });
    } else {
        done(null, user.id);
    }
});

passport.deserializeUser(async (serializedUser, done) => {
    try {
        // Handle pending registration users
        if (typeof serializedUser === 'object' && serializedUser.pendingRegistration) {
            done(null, serializedUser);
            return;
        }

        // For regular users, fetch from database
        const user = await User.findById(serializedUser);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Helper function to get base API URL
const getApiBaseUrl = () => {
    return process.env.API_URL || 'http://localhost:5001';
};

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${getApiBaseUrl()}/api/auth/google/callback`,
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user already exists with either email or Google ID
        const existingUser = await User.findOne({
            $or: [
                { email: profile.emails[0].value },
                { googleId: profile.id }
            ]
        });
        
        if (existingUser) {
            // Update user's Google-related information if needed
            const updates = {};
            if (!existingUser.googleId) updates.googleId = profile.id;
            if (!existingUser.firstname) updates.firstname = profile.name.givenName;
            if (!existingUser.lastname) updates.lastname = profile.name.familyName;
            
            if (Object.keys(updates).length > 0) {
                Object.assign(existingUser, updates);
                await existingUser.save();
            }

            return done(null, existingUser);
        }

        // For new users, pass their information to the frontend for tenant selection
        const userData = {
            email: profile.emails[0].value,
            firstname: profile.name.givenName,
            lastname: profile.name.familyName,
            googleId: profile.id,
            isGoogleAuth: true
        };

        // Pass the user data to the done callback without creating a user yet
        done(null, { pendingRegistration: true, ...userData });
    } catch (error) {
        console.error('Google authentication error:', error);
        done(error, null);
    }
}));

module.exports = passport;
