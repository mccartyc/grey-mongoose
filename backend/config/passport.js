const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/Users');
const Tenant = require('../models/Tenant');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback",
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

        // For new users, create a new tenant with their name/email as company name
        const tenantName = profile.displayName || profile.emails[0].value.split('@')[0];
        const newTenant = new Tenant({
            name: tenantName,
            isActive: true
        });
        await newTenant.save();

        // Create new user with the new tenant
        const newUser = await new User({
            email: profile.emails[0].value,
            firstname: profile.name.givenName,
            lastname: profile.name.familyName,
            googleId: profile.id,
            isActive: true,
            role: 'Admin', // Make them admin of their own tenant
            tenantId: newTenant._id,
            // Set a secure random password for Google users
            password: require('crypto').randomBytes(32).toString('hex')
        }).save();

        done(null, newUser);
    } catch (error) {
        console.error('Google authentication error:', error);
        done(error, null);
    }
}));

module.exports = passport;
