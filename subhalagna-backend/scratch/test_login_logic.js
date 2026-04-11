const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../../subhalagna-backend/.env') });

const User = require('../../subhalagna-backend/models/User');
const Profile = require('../../subhalagna-backend/models/Profile');

async function testLogin() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/subhalagna');
        console.log('Connected.');

        const email = 'santoshkumarsahu@gmail.com';
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            console.log('User not found.');
            return;
        }

        console.log('User found. Testing matchPassword...');
        
        // We don't know the password, but we can check if the hash looks like a valid bcrypt hash
        console.log('Password hash:', user.password);
        const isValidBcrypt = user.password && user.password.startsWith('$2a$'); // bcryptjs default prefix
        // Actually bcrypt usually starts with $2a$, $2b$, or $2y$
        const isBcrypt = user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'));
        
        console.log('Is valid bcrypt format?', isBcrypt);

        // Let's check for any potential issues in buildAuthResponse logic
        const profile = await Profile.findOne({ user: user._id });
        console.log('Profile found:', !!profile);

        const responseData = {
            _id:             user._id,
            name:            user.name,
            email:           user.email,
            role:            user.role,
            isPremium:       user.isPremium,
            premiumPlan:     user.premiumPlan,
            isEmailVerified: user.isEmailVerified,
            hasProfile:      !!profile,
            profile:         profile || null,
        };

        console.log('Auth response built successfully:', responseData._id);

    } catch (err) {
        console.error('Test Login Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

testLogin();
