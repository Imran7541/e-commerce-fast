const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { createOrder, validateCoupon } = require('../services/orderService');

// Create new order
router.post('/orders', (req, res) => {
  try {
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const orderData = {
      ...req.body,
      ipAddress,
      userAgent
    };

    const order = createOrder(orderData);
    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Track order
router.get('/orders/track', (req, res) => {
  try {
    const { orderNumber, phone } = req.query;
    if (!orderNumber && !phone) {
      return res.status(400).json({ error: 'Order number or phone number is required' });
    }

    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (orderNumber) {
      sql += ' AND order_number = ?';
      params.push(orderNumber.trim());
    }
    if (phone) {
      sql += ' AND phone = ?';
      params.push(phone.trim());
    }

    sql += ' ORDER BY id DESC LIMIT 5';
    const orders = db.all(sql, params);

    const formatted = orders.map(o => {
      const items = db.all('SELECT * FROM order_items WHERE order_id = ?', [o.id]);
      return {
        id: o.id,
        orderNumber: o.order_number,
        customerName: o.customer_name,
        phone: o.phone,
        address: o.address,
        district: o.district,
        thana: o.thana,
        subtotal: o.subtotal,
        shippingCost: o.shipping_cost,
        discount: o.discount,
        total: o.total,
        status: o.status,
        paymentMethod: o.payment_method,
        paymentStatus: o.payment_status,
        courierName: o.courier_name,
        courierTrackingId: o.courier_tracking_id,
        courierStatus: o.courier_status,
        createdAt: o.created_at,
        items: items.map(i => ({
          productId: i.product_id,
          productName: i.product_name,
          productSku: i.product_sku,
          price: i.price,
          quantity: i.quantity,
          total: i.total
        }))
      };
    });

    res.json({ orders: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Validate coupon
router.post('/coupons/validate', (req, res) => {
  try {
    const { code, subtotal = 0 } = req.body;
    const result = validateCoupon(code, parseFloat(subtotal));
    if (!result.valid) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Checkout lead telemetry / abandoned cart tracking
router.post('/checkout/track', (req, res) => {
  try {
    const { phone, customerName, address, cart, subtotal } = req.body;
    if (phone) {
      db.run(`
        INSERT INTO incomplete_orders (phone, name, address, cart_data, subtotal, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [phone, customerName || '', address || '', JSON.stringify(cart || []), parseFloat(subtotal) || 0]);
    }
    res.json({ success: true });
  } catch {
    res.json({ success: false });
  }
});

// Switch to COD
router.post('/payments/switch-to-cod', (req, res) => {
  try {
    const { orderNumber, phone } = req.body;
    if (!orderNumber) {
      return res.status(400).json({ error: 'Order number is required' });
    }

    const order = db.get('SELECT * FROM orders WHERE order_number = ?', [orderNumber]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    db.run(`
      UPDATE orders 
      SET payment_method = 'cod', cod_amount = total, payment_status = 'unpaid', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [order.id]);

    res.json({ success: true, message: 'Payment method switched to Cash on Delivery' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Courier Webhook Handlers
const handleCourierWebhook = (courierName) => (req, res) => {
  try {
    const payload = req.body || {};
    const trackingId = payload.consignment_id || payload.tracking_code || payload.tracking_id || payload.trackingId;
    const orderNumber = payload.merchant_order_id || payload.order_number || payload.orderNumber;
    const courierStatus = payload.status || payload.order_status || payload.delivery_status || 'In Transit';

    if (trackingId || orderNumber) {
      const order = db.get(`
        SELECT id, total FROM orders 
        WHERE courier_tracking_id = ? OR order_number = ?
      `, [trackingId || '', orderNumber || '']);

      if (order) {
        let orderStatusUpdate = '';
        const params = [courierName, courierStatus];

        if (String(courierStatus).toLowerCase().includes('deliver')) {
          orderStatusUpdate = ", status = 'delivered', payment_status = 'paid'";
        } else if (String(courierStatus).toLowerCase().includes('return') || String(courierStatus).toLowerCase().includes('cancel')) {
          orderStatusUpdate = ", status = 'returned'";
        }

        db.run(`
          UPDATE orders
          SET courier_name = ?, courier_status = ? ${orderStatusUpdate}, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [...params, order.id]);
      }
    }

    res.json({ success: true, message: `${courierName} webhook processed.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.post('/webhooks/steadfast', handleCourierWebhook('Steadfast'));
router.post('/webhooks/pathao', handleCourierWebhook('Pathao'));
router.post('/webhooks/redx', handleCourierWebhook('RedX'));
router.post('/webhooks/carrybee', handleCourierWebhook('Carrybee'));

module.exports = router;
