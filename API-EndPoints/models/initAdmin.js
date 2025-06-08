const User = require('./schemas/user.schema');
const bcrypt = require('bcryptjs');

const DEFAULT_ADMIN = {
    username: 'ankit',
    email: 'ak3057955@gmail.com',
    password: 'ASdf@1234',
    role: 'admin',
    firstName: 'Ankit',
    lastName: 'Admin'
};

async function initializeDefaultAdmin() {
    try {
        console.log('Checking for existing admin account...');
        
        // Check if admin exists
        const adminExists = await User.findOne({ role: 'admin' });

        if (!adminExists) {
            console.log('No admin account found. Creating default admin...');
            
            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, salt);

            // Create admin user
            const adminUser = new User({
                username: DEFAULT_ADMIN.username,
                email: DEFAULT_ADMIN.email,
                password: hashedPassword,
                role: DEFAULT_ADMIN.role,
                firstName: DEFAULT_ADMIN.firstName,
                lastName: DEFAULT_ADMIN.lastName,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            await adminUser.save();
            console.log('✅ Default admin account created successfully!');
            console.log('Admin Details:');
            console.log('Email:', DEFAULT_ADMIN.email);
            console.log('Username:', DEFAULT_ADMIN.username);
            console.log('Password:', DEFAULT_ADMIN.password);
        } else {
            console.log('✅ Admin account already exists. Skipping initialization.');
        }
    } catch (error) {
        console.error('❌ Error initializing admin account:', error);
        throw error; // We want to know if this fails
    }
}

module.exports = initializeDefaultAdmin; 