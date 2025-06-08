const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const initializeDefaultAdmin = require('./models/initAdmin');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Database connection with proper error handling
async function startServer() {
    try {
        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping-website', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Successfully connected to MongoDB');
        
        console.log('Initializing admin account...');
        // Initialize admin account after successful database connection
        await initializeDefaultAdmin();
        console.log('✅ Admin initialization process completed');

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`✅ Server is running on port ${PORT}`);
        });
    } catch (err) {
        console.error('❌ Startup error:', err);
        console.error(err.stack);
        process.exit(1);
    }
}

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const categoryRoutes = require('./routes/category.routes');
const promotionRoutes = require('./routes/promotion.routes');
const reviewRoutes = require('./routes/review.routes');
const requestRoutes = require('./routes/request.routes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api', reviewRoutes);
app.use('/api', requestRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Handle 404 routes
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start the server
startServer(); 