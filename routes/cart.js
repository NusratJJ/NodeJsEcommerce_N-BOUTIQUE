const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

const cartFilePath = path.join(__dirname, '../data/cart.json');
const productsFilePath = path.join(__dirname, '../data/products.json');

// Utility function to safely read JSON files
async function readJSONFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data || '[]'); // Return empty array if file is empty
  } catch (err) {
    console.error(`Error reading file at ${filePath}:`, err);
    throw new Error('Could not read data');
  }
}

// Utility function to safely write JSON files
async function writeJSONFile(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing file at ${filePath}:`, err);
    throw new Error('Could not write data');
  }
}

// GET: View Cart
router.get('/', async (req, res) => {
  try {
    const cartItems = await readJSONFile(cartFilePath);
    const products = await readJSONFile(productsFilePath);

    const cartItemsWithDetails = cartItems.map(cartItem => {
      const product = products.find(product => product.id === cartItem.productId);
      if (!product) {
        console.warn(`Product with ID ${cartItem.productId} not found in products.json`);
        return null;
      }
      return {
        id: product.id,
        product_title: product.product_title,
        product_price: product.product_price,
        product_description: product.product_description,
        image_path: product.image_path,
        quantity: cartItem.quantity,
      };
    }).filter(item => item !== null); // Filter out null items

    res.render('cart', { cartItems: cartItemsWithDetails });
  } catch (err) {
    console.error('Error fetching cart data:', err);
    res.status(500).send('Internal Server Error');
  }
});

// POST: Add Product to Cart
router.post('/add', async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).send('Product ID is required');
  }

  try {
    const cart = await readJSONFile(cartFilePath);

    const existingProduct = cart.find(item => item.productId === productId);
    if (existingProduct) {
      existingProduct.quantity++;
    } else {
      cart.push({ productId, quantity: 1 });
    }

    await writeJSONFile(cartFilePath, cart);
    console.log('Product added to cart:', productId);
    res.redirect('/');
  } catch (err) {
    console.error('Error adding product to cart:', err);
    res.status(500).send('Internal Server Error');
  }
});

// POST: Increment Product Quantity
// POST: Increment Product Quantity
router.post('/increment', async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).send('Product ID is required');
  }

  try {
    const cart = await readJSONFile(cartFilePath);

    const itemIndex = cart.findIndex(item => item.productId === productId);
    if (itemIndex !== -1) {
      cart[itemIndex].quantity++;
      await writeJSONFile(cartFilePath, cart);
      console.log('Product quantity incremented:', productId);
      res.sendStatus(200);
    } else {
      res.status(404).send('Product not found in cart');
    }
  } catch (err) {
    console.error('Error incrementing product quantity:', err);
    res.status(500).send('Internal Server Error');
  }
});

// POST: Decrement Product Quantity
router.post('/decrement', async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).send('Product ID is required');
  }

  try {
    const cart = await readJSONFile(cartFilePath);

    const itemIndex = cart.findIndex(item => item.productId === productId);
    if (itemIndex !== -1) {
      if (cart[itemIndex].quantity > 1) {
        cart[itemIndex].quantity--;
        await writeJSONFile(cartFilePath, cart);
        console.log('Product quantity decremented:', productId);
        res.sendStatus(200);
      } else {
        cart.splice(itemIndex, 1);
        await writeJSONFile(cartFilePath, cart);
        console.log('Product deleted from cart:', productId);
        res.sendStatus(200);
      }
    } else {
      res.status(404).send('Product not found in cart');
    }
  } catch (err) {
    console.error('Error decrementing product quantity:', err);
    res.status(500).send('Internal Server Error');
  }
});

// POST: Delete Product from Cart
router.post('/delete', async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).send('Product ID is required');
  }

  try {
    const cart = await readJSONFile(cartFilePath);

    const updatedCart = cart.filter(cartItem => cartItem.productId !== productId);

    if (updatedCart.length === cart.length) {
      return res.status(404).send('Product not found in cart');
    }

    await writeJSONFile(cartFilePath, updatedCart);
    console.log('Product deleted from cart:', productId);
    res.sendStatus(200);
  } catch (err) {
    console.error('Error deleting product from cart:', err);
    res.status(500).send('Internal Server Error');
  }
});






module.exports = router;
