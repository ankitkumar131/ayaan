const Product = require('../../models/product.model');
const { validationResult } = require('express-validator');

const createProduct = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      description,
      price,
      category,
      stock,
      sizes,
      colors
    } = req.body;

    // Parse arrays and objects from form data
    const parsedSizes = sizes ? (Array.isArray(sizes) ? sizes : [sizes]) : [];
    const parsedColors = [];

    // Handle colors array from form data
    if (req.body['colors[0][name]']) {
      let index = 0;
      while (req.body[`colors[${index}][name]`]) {
        parsedColors.push({
          name: req.body[`colors[${index}][name]`],
          code: req.body[`colors[${index}][code]`]
        });
        index++;
      }
    }

    const product = new Product({
      name,
      description,
      price: parseFloat(price),
      category,
      stock: parseInt(stock),
      sizes: parsedSizes,
      colors: parsedColors,
      images: req.files ? req.files.map(file => ({
        url: `/uploads/products/${file.filename}`,
        alt: name
      })) : []
    });

    await product.save();
    await product.populate('category');

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = createProduct; 