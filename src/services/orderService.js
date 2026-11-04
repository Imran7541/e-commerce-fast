const db = require('../db/database');

function getStoreSettings() {
  const rows = db.all(`SELECT key, value FROM settings`);
  const settings = {};
  for (const r of rows) {
    try {
      settings[r.key] = JSON.parse(r.value);
    } catch {
      settings[r.key] = r.value;
    }
  }
  return settings;
}

function calculateShipping(districtOrZone, subtotal, itemsCount = 1) {
  const settings = getStoreSettings();
  const freeShip = settings.free_shipping_config || {};
  const shipping = settings.shipping || {};

  // Check free shipping threshold
  if (freeShip.enabled) {
    if (freeShip.minSubtotal && subtotal >= freeShip.minSubtotal) {
      return 0.0;
    }
    if (freeShip.minQuantity && itemsCount >= freeShip.minQuantity) {
      return 0.0;
    }
  }

  // Inside Dhaka vs Outside Dhaka
  const str = (districtOrZone || '').toLowerCase();
  const isOutside = str.includes('outside');
  if (!isOutside) {
    return shipping.insideDhaka !== undefined ? parseFloat(shipping.insideDhaka) : 70.0;
  } else {
    return shipping.outsideDhaka !== undefined ? parseFloat(shipping.outsideDhaka) : 120.0;
  }
}

function validateCoupon(code, subtotal) {
  if (!code) return { valid: false, discount: 0, reason: 'No code provided' };
  const coupon = db.get(`SELECT * FROM coupons WHERE code = ? AND status = 'active'`, [code.trim().toUpperCase()]);
  if (!coupon) {
    return { valid: false, discount: 0, reason: 'Invalid or inactive coupon code' };
  }

  if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
    return {
      valid: false,
      discount: 0,
      reason: `Minimum order amount of ৳${coupon.min_order_amount} required`
    };
  }

  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = (subtotal * coupon.value) / 100.0;
    if (coupon.max_discount && discount > coupon.max_discount) {
      discount = coupon.max_discount;
    }
  } else {
    discount = coupon.value;
  }

  if (discount > subtotal) {
    discount = subtotal;
  }

  return {
    valid: true,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount: Math.round(discount)
  };
}

function generateOrderNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `DB-${dateStr}-${randomSuffix}`;
}

function createOrder(orderData) {
  const customerName = (orderData.customerName || orderData.name || '').trim();
  const phone = (orderData.customerPhone || orderData.phone || orderData.mobileNumber || '').trim();
  const address = (orderData.customerAddress || orderData.address || orderData.fullAddress || '').trim();
  const district = (orderData.district || (orderData.shippingZone && orderData.shippingZone.toLowerCase().includes('outside') ? 'Outside Dhaka' : 'Dhaka')).trim();
  const thana = (orderData.thana || '').trim();
  const {
    alternativePhone,
    notes,
    items = [],
    couponCode,
    paymentMethod = 'cod',
    source = 'web',
    landingPageId = null,
    ipAddress = null,
    userAgent = null,
    transactionId = null,
    senderNumber = null
  } = orderData;

  if (!customerName || !phone || !address || !items.length) {
    throw new Error('Customer name, phone, address, and items are required');
  }

  // Calculate items total
  let subtotal = 0;
  const processedItems = [];

  for (const item of items) {
    const product = db.get(`SELECT * FROM products WHERE id = ?`, [item.productId]);
    if (!product) {
      throw new Error(`Product ID ${item.productId} not found`);
    }

    const price = product.sale_price || product.price;
    const quantity = parseInt(item.quantity, 10) || 1;
    const itemTotal = price * quantity;
    subtotal += itemTotal;

    processedItems.push({
      productId: product.id,
      variationId: item.variationId || null,
      productName: product.name,
      productSku: product.sku,
      price,
      quantity,
      total: itemTotal
    });
  }

  // Calculate discount
  let discount = 0;
  if (couponCode) {
    const couponRes = validateCoupon(couponCode, subtotal);
    if (couponRes.valid) {
      discount = couponRes.discount;
    }
  }

  // Calculate shipping
  const shippingCost = calculateShipping(district, subtotal, items.length);
  const total = subtotal + shippingCost - discount;
  const codAmount = paymentMethod === 'cod' ? total : 0.0;
  const orderNumber = generateOrderNumber();

  // Insert order
  const insertOrder = db.db.prepare(`
    INSERT INTO orders (
      order_number, customer_name, phone, alternative_phone, address, district, thana,
      notes, subtotal, shipping_cost, discount, coupon_code, total, advance_payment,
      cod_amount, status, payment_method, payment_status, source, landing_page_id,
      ip_address, user_agent, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, 'pending', ?, ?, ?, ?,
      ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
  `);

  const result = insertOrder.run(
    orderNumber,
    customerName,
    phone,
    alternativePhone || null,
    address,
    district || null,
    thana || null,
    notes || null,
    subtotal,
    shippingCost,
    discount,
    couponCode || null,
    total,
    0.0,
    codAmount,
    paymentMethod,
    paymentMethod === 'cod' ? 'unpaid' : 'pending',
    source,
    landingPageId,
    ipAddress,
    userAgent
  );

  const orderId = result.lastInsertRowid;

  // Insert order items & update product stock
  const insertItem = db.db.prepare(`
    INSERT INTO order_items (
      order_id, product_id, variation_id, product_name, product_sku, price, quantity, total
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const decrementStock = db.db.prepare(`
    UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?
  `);

  for (const it of processedItems) {
    insertItem.run(
      orderId,
      it.productId,
      it.variationId,
      it.productName,
      it.productSku,
      it.price,
      it.quantity,
      it.total
    );
    decrementStock.run(it.quantity, it.productId);
  }

  if (transactionId) {
    try {
      db.run(`
        INSERT INTO payment_transactions (
          order_id, transaction_id, gateway, amount, currency, status, sender_number, raw_response, created_at
        ) VALUES (?, ?, ?, ?, 'BDT', 'completed', ?, ?, CURRENT_TIMESTAMP)
      `, [orderId, transactionId, paymentMethod, total, senderNumber || null, JSON.stringify({ manual: true })]);
    } catch (e) {
      console.warn('Could not record payment transaction:', e.message);
    }
  }

  return {
    id: orderId,
    orderNumber,
    customerName,
    phone,
    address,
    subtotal,
    shippingCost,
    discount,
    total,
    status: 'pending',
    items: processedItems
  };
}

module.exports = {
  getStoreSettings,
  calculateShipping,
  validateCoupon,
  generateOrderNumber,
  createOrder
};
