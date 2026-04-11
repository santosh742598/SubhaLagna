/**
 * Diagnostic script to check user account status and profile integrity.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../subhalagna-backend/.env') });

const User = require('../../subhalagna-backend/models/User');
const Profile = require('../../subhalagna-backend/models/Profile');

async function inspect() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/subhalagna');
        console.log('Connected.');

        const email = 'santoshkumarsahu@gmail.com';
        console.log(`Searching for user: ${email}`);

        const user = await User.findOne({ email }).select('+password +refreshToken');
        if (!user) {
            console.log('User NOT FOUND.');
            return;
        }

        console.log('User found:', {
            _id: user._id,
            name: user.name,
            role: user.role,
            isSuspended: user.isSuspended,
            isEmailVerified: user.isEmailVerified,
            isPremium: user.isPremium,
            premiumPlan: user.premiumPlan,
            hasPassword: !!user.password
        });

        console.log('Checking profile...');
        const profile = await Profile.findOne({ user: user._id });
        if (!profile) {
            console.log('Profile NOT FOUND for this user.');
        } else {
            console.log('Profile found:', {
                _id: profile._id,
                name: profile.name,
                completenessScore: profile.completenessScore,
                age: profile.age,
                dob: profile.horoscope?.dateOfBirth
            });

            // Try to trigger the pre-save hook to see if it fails
            console.log('Attempting to trigger pre-save hook (validation check)...');
            try {
                // We don't actually save, just validate
                await profile.validate();
                console.log('Validation successful.');
                
                // If we want to be sure about the hook, we can do a mock save
                // but let's just check if it fails during a real save attempt
                // user.save() is called during login to store refresh token
                console.log('Attempting to update user refresh token (simulating login save)...');
                user.refreshToken = 'diagnostic_test_token';
                await user.save({ validateBeforeSave: false });
                console.log('User save successful.');
            } catch (err) {
                console.error('Validation/Hook Error:', err.message);
                if (err.errors) console.error('Field Errors:', Object.keys(err.errors));
            }
        }

    } catch (err) {
        console.error('Diagnostic Script Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

inspect();
