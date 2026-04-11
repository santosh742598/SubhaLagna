const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../subhalagna-backend/.env') });

const User = require('../../subhalagna-backend/models/User');
const Profile = require('../../subhalagna-backend/models/Profile');

async function fixUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/subhalagna');
        console.log('Connected.');

        const email = 'santoshkumarsahu@gmail.com';
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('User not found.');
            return;
        }

        console.log('User found. Current verification:', user.isEmailVerified);
        
        if (!user.isEmailVerified) {
            user.isEmailVerified = true;
            await user.save({ validateBeforeSave: false });
            console.log('User manually verified.');
        }

        // Also check profile's partner preferences to ensure they are not causing crashes in MatchResults
        const profile = await Profile.findOne({ user: user._id });
        if (profile) {
            console.log('Profile partnerPreferences:', profile.partnerPreferences);
            if (!profile.partnerPreferences) {
                profile.partnerPreferences = {
                    minAge: 18,
                    maxAge: 40,
                    location: 'Any',
                    caste: 'Any',
                    religion: 'Any'
                };
                await profile.save();
                console.log('Profile partnerPreferences initialized.');
            }
        }

    } catch (err) {
        console.error('Fix User Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

fixUser();
