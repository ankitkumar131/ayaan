/**
 * Admin Setup Utility
 * 
 * Creates default admin user and initial data for the e-commerce platform.
 * Runs automatically when the server starts to ensure admin access is available.
 */

const User = require('../models/User');
const Category = require('../models/Category');

/**
 * Create default admin user if none exists
 */
const createDefaultAdmin = async () => {
  try {
    console.log('🔍 Checking for existing admin users...');
    
    // Check if any admin user exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return;
    }
    
    console.log('👤 Creating default admin user...');
    
    // Create default admin user
    const defaultAdmin = new User({
      username: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
      email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@ecommerce.com',
      password: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123456',
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      isActive: true,
      emailVerified: true
    });
    
    await defaultAdmin.save();
    
    console.log('✅ Default admin user created successfully');
    console.log('📧 Email:', defaultAdmin.email);
    console.log('🔑 Password:', process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123456');
    console.log('⚠️  IMPORTANT: Please change the default password after first login!');
    
  } catch (error) {
    console.error('❌ Error creating default admin user:', error.message);
  }
};

/**
 * Create default categories for clothing e-commerce
 */
const createDefaultCategories = async () => {
  try {
    console.log('🔍 Checking for existing categories...');
    
    // Check if categories already exist
    const existingCategories = await Category.countDocuments();
    
    if (existingCategories > 0) {
      console.log('✅ Categories already exist, skipping creation');
      return;
    }
    
    console.log('📂 Creating default categories...');
    
    // Create main categories
    const menCategory = new Category({
      name: 'Men',
      slug: 'men',
      description: 'Men\'s clothing and accessories',
      gender: 'men',
      categoryType: 'main',
      order: 1,
      isActive: true,
      isFeatured: true,
      metaTitle: 'Men\'s Clothing',
      metaDescription: 'Shop the latest men\'s fashion, clothing, and accessories'
    });
    
    const womenCategory = new Category({
      name: 'Women',
      slug: 'women',
      description: 'Women\'s clothing and accessories',
      gender: 'women',
      categoryType: 'main',
      order: 2,
      isActive: true,
      isFeatured: true,
      metaTitle: 'Women\'s Clothing',
      metaDescription: 'Shop the latest women\'s fashion, clothing, and accessories'
    });
    
    await menCategory.save();
    await womenCategory.save();
    
    // Create subcategories for Men
    const menSubcategories = [
      {
        name: 'Shirts',
        description: 'Men\'s shirts - casual, formal, and dress shirts',
        parent: menCategory._id,
        order: 1
      },
      {
        name: 'T-Shirts',
        description: 'Men\'s t-shirts and casual tops',
        parent: menCategory._id,
        order: 2
      },
      {
        name: 'Pants',
        description: 'Men\'s pants, trousers, and jeans',
        parent: menCategory._id,
        order: 3
      },
      {
        name: 'Jackets',
        description: 'Men\'s jackets, coats, and outerwear',
        parent: menCategory._id,
        order: 4
      },
      {
        name: 'Shoes',
        description: 'Men\'s footwear - casual, formal, and sports shoes',
        parent: menCategory._id,
        order: 5
      }
    ];
    
    // Create subcategories for Women
    const womenSubcategories = [
      {
        name: 'Dresses',
        description: 'Women\'s dresses - casual, formal, and party dresses',
        parent: womenCategory._id,
        order: 1
      },
      {
        name: 'Tops',
        description: 'Women\'s tops, blouses, and shirts',
        parent: womenCategory._id,
        order: 2
      },
      {
        name: 'Bottoms',
        description: 'Women\'s pants, jeans, skirts, and shorts',
        parent: womenCategory._id,
        order: 3
      },
      {
        name: 'Outerwear',
        description: 'Women\'s jackets, coats, and cardigans',
        parent: womenCategory._id,
        order: 4
      },
      {
        name: 'Shoes',
        description: 'Women\'s footwear - heels, flats, boots, and sneakers',
        parent: womenCategory._id,
        order: 5
      }
    ];
    
    // Save all subcategories
    for (const subcategory of menSubcategories) {
      const category = new Category({
        ...subcategory,
        gender: 'men',
        categoryType: 'subcategory',
        isActive: true
      });
      await category.save();
    }
    
    for (const subcategory of womenSubcategories) {
      const category = new Category({
        ...subcategory,
        gender: 'women',
        categoryType: 'subcategory',
        isActive: true
      });
      await category.save();
    }
    
    console.log('✅ Default categories created successfully');
    console.log('📂 Main categories: Men, Women');
    console.log('📁 Subcategories created for each main category');
    
  } catch (error) {
    console.error('❌ Error creating default categories:', error.message);
  }
};

/**
 * Initialize database with default data
 */
const initializeDatabase = async () => {
  try {
    console.log('🚀 Initializing database with default data...');
    
    await createDefaultAdmin();
    await createDefaultCategories();
    
    console.log('✅ Database initialization completed successfully');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
  }
};

/**
 * Create sample products (for development/testing)
 */
const createSampleProducts = async () => {
  try {
    const Product = require('../models/Product');
    
    console.log('🔍 Checking for existing products...');
    
    const existingProducts = await Product.countDocuments();
    
    if (existingProducts > 0) {
      console.log('✅ Products already exist, skipping sample creation');
      return;
    }
    
    console.log('🛍️ Creating sample products...');
    
    // Get categories
    const menCategory = await Category.findOne({ slug: 'men' });
    const womenCategory = await Category.findOne({ slug: 'women' });
    
    if (!menCategory || !womenCategory) {
      console.log('⚠️ Categories not found, skipping sample products');
      return;
    }
    
    // Sample products for men
    const menProducts = [
      {
        name: 'Classic White Shirt',
        description: 'A timeless white dress shirt perfect for formal occasions and business meetings.',
        price: 49.99,
        category: menCategory._id,
        stock: 50,
        sku: 'MEN-SHIRT-001',
        sizes: [
          { name: 'S', stock: 10 },
          { name: 'M', stock: 15 },
          { name: 'L', stock: 15 },
          { name: 'XL', stock: 10 }
        ],
        colors: [
          { name: 'White', code: '#FFFFFF', stock: 50 }
        ],
        specifications: {
          material: '100% Cotton',
          fit: 'regular',
          season: 'all-season',
          occasion: ['formal', 'work']
        },
        isActive: true,
        isFeatured: true
      },
      {
        name: 'Casual Blue Jeans',
        description: 'Comfortable and stylish blue jeans for everyday wear.',
        price: 79.99,
        category: menCategory._id,
        stock: 40,
        sku: 'MEN-JEANS-001',
        sizes: [
          { name: '30', stock: 8 },
          { name: '32', stock: 12 },
          { name: '34', stock: 12 },
          { name: '36', stock: 8 }
        ],
        colors: [
          { name: 'Blue', code: '#4169E1', stock: 40 }
        ],
        specifications: {
          material: '98% Cotton, 2% Elastane',
          fit: 'regular',
          season: 'all-season',
          occasion: ['casual']
        },
        isActive: true
      }
    ];
    
    // Sample products for women
    const womenProducts = [
      {
        name: 'Elegant Black Dress',
        description: 'A sophisticated black dress perfect for evening events and special occasions.',
        price: 89.99,
        category: womenCategory._id,
        stock: 30,
        sku: 'WOMEN-DRESS-001',
        sizes: [
          { name: 'XS', stock: 5 },
          { name: 'S', stock: 8 },
          { name: 'M', stock: 10 },
          { name: 'L', stock: 7 }
        ],
        colors: [
          { name: 'Black', code: '#000000', stock: 30 }
        ],
        specifications: {
          material: '95% Polyester, 5% Elastane',
          fit: 'slim',
          season: 'all-season',
          occasion: ['formal', 'party']
        },
        isActive: true,
        isFeatured: true
      },
      {
        name: 'Casual Cotton Top',
        description: 'Comfortable cotton top perfect for casual outings and daily wear.',
        price: 29.99,
        category: womenCategory._id,
        stock: 60,
        sku: 'WOMEN-TOP-001',
        sizes: [
          { name: 'XS', stock: 10 },
          { name: 'S', stock: 15 },
          { name: 'M', stock: 20 },
          { name: 'L', stock: 15 }
        ],
        colors: [
          { name: 'White', code: '#FFFFFF', stock: 30 },
          { name: 'Pink', code: '#FFC0CB', stock: 30 }
        ],
        specifications: {
          material: '100% Cotton',
          fit: 'regular',
          season: 'spring',
          occasion: ['casual']
        },
        isActive: true
      }
    ];
    
    // Save sample products
    for (const productData of [...menProducts, ...womenProducts]) {
      const product = new Product(productData);
      await product.save();
    }
    
    console.log('✅ Sample products created successfully');
    console.log('🛍️ Created products for both men and women categories');
    
  } catch (error) {
    console.error('❌ Error creating sample products:', error.message);
  }
};

/**
 * Reset database (for development only)
 */
const resetDatabase = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️ Database reset is not allowed in production');
    return;
  }
  
  try {
    console.log('🗑️ Resetting database...');
    
    // Clear all collections
    await User.deleteMany({});
    await Category.deleteMany({});
    
    const Product = require('../models/Product');
    await Product.deleteMany({});
    
    console.log('✅ Database reset completed');
    
    // Reinitialize with default data
    await initializeDatabase();
    
  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
  }
};

module.exports = {
  createDefaultAdmin,
  createDefaultCategories,
  initializeDatabase,
  createSampleProducts,
  resetDatabase
};