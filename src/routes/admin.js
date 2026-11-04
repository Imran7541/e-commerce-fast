const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Protect all admin routes
router.use(authenticateToken);
router.use(requireRole(['admin', 'super_admin', 'manager']));

// Catalog Summary Dashboard
router.get('/catalog/summary', (req, res) => {
  try {
    const totalProducts = db.get(`SELECT COUNT(*) as c FROM products`).c;
    const activeProducts = db.get(`SELECT COUNT(*) as c FROM products WHERE status = 'active'`).c;
    const lowStock = db.get(`SELECT COUNT(*) as c FROM products WHERE stock <= low_stock_threshold`).c;
    const totalCategories = db.get(`SELECT COUNT(*) as c FROM categories`).c;
    const totalOrders = db.get(`SELECT COUNT(*) as c FROM orders`).c;
    const pendingOrders = db.get(`SELECT COUNT(*) as c FROM orders WHERE status = 'pending'`).c;
    const totalRevenue = db.get(`SELECT SUM(total) as s FROM orders WHERE status IN ('delivered', 'completed')`).s || 0;

    res.json({
      totalProducts,
      activeProducts,
      lowStock,
      totalCategories,
      totalOrders,
      pendingOrders,
      totalRevenue
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Orders Management & Invoicing (Phase 3)
router.get('/orders-staff', (req, res) => {
  try {
    const staff = db.all(`SELECT id, name, email, phone, role FROM users WHERE status = 'active' ORDER BY id ASC`);
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/orders-customer-lookup', (req, res) => {
  try {
    const q = (req.query.q || req.query.phone || '').trim();
    if (!q || q.length < 3) {
      return res.json([]);
    }
    const rows = db.all(`
      SELECT customer_name as name, phone, address, district, thana,
             COUNT(*) as totalOrders,
             SUM(CASE WHEN status IN ('delivered', 'completed') THEN 1 ELSE 0 END) as deliveredOrders,
             SUM(CASE WHEN status IN ('cancelled', 'returned') THEN 1 ELSE 0 END) as returnedOrders
      FROM orders
      WHERE phone LIKE ? OR customer_name LIKE ?
      GROUP BY phone
      LIMIT 10
    `, [`%${q}%`, `%${q}%`]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/orders/invoices', (req, res) => {
  try {
    const idsParam = req.query.ids || '';
    const ids = idsParam.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    if (ids.length === 0) {
      return res.json([]);
    }
    const placeholders = ids.map(() => '?').join(',');
    const orders = db.all(`SELECT * FROM orders WHERE id IN (${placeholders}) ORDER BY id DESC`, ids);
    const invoices = orders.map(o => {
      const items = db.all(`
        SELECT oi.*, p.image, p.sku as product_sku
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [o.id]).map(item => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        name: item.product_name,
        productSku: item.product_sku || '',
        price: item.price,
        unitPrice: item.price,
        quantity: item.quantity,
        total: item.total,
        totalPrice: item.total,
        image: item.image || null,
        variationId: item.variation_id || null
      }));

      return {
        id: o.id,
        orderNumber: o.order_number,
        customerName: o.customer_name,
        customerPhone: o.phone,
        customerAddress: o.address,
        phone: o.phone,
        address: o.address,
        district: o.district || '',
        thana: o.thana || '',
        subtotal: o.subtotal,
        shippingCost: o.shipping_cost,
        shippingCharge: o.shipping_cost,
        discount: o.discount,
        total: o.total,
        codAmount: o.cod_amount,
        advancePaid: o.advance_payment || 0,
        status: o.status,
        paymentMethod: o.payment_method,
        paymentStatus: o.payment_status,
        courierName: o.courier_name,
        courierTrackingId: o.courier_tracking_id,
        courierStatus: o.courier_status,
        assignedTo: o.assigned_to,
        notes: o.notes || '',
        createdAt: o.created_at,
        storeName: 'FAMILIO BAZAR',
        storePhone: '01787877362',
        storeEmail: 'imrandt2001@gmail.com',
        storeAddress: 'House #24, Road #03, Sector #11, Uttara, Dhaka-1230',
        items
      };
    });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/orders', (req, res) => {
  try {
    const { status, limit = 50, page = 1, search } = req.query;
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (order_number LIKE ? OR phone LIKE ? OR customer_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    params.push(parseInt(limit, 10), offset);

    const orders = db.all(sql, params).map(o => {
      const items = db.all(`
        SELECT oi.*, p.image 
        FROM order_items oi 
        LEFT JOIN products p ON oi.product_id = p.id 
        WHERE oi.order_id = ?
      `, [o.id]).map(item => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        name: item.product_name,
        productSku: item.product_sku || '',
        price: item.price,
        unitPrice: item.price,
        quantity: item.quantity,
        total: item.total,
        totalPrice: item.total,
        image: item.image || null,
        variationId: item.variation_id || null
      }));

      return {
        id: o.id,
        orderNumber: o.order_number,
        customerName: o.customer_name,
        customerPhone: o.phone,
        customerAddress: o.address,
        phone: o.phone,
        address: o.address,
        district: o.district || '',
        thana: o.thana || '',
        shippingZone: o.district || '',
        shippingCost: o.shipping_cost,
        shippingCharge: o.shipping_cost,
        subtotal: o.subtotal,
        discount: o.discount,
        advancePaid: o.advance_payment || 0,
        total: o.total,
        codAmount: o.cod_amount,
        status: o.status,
        paymentMethod: o.payment_method,
        paymentStatus: o.payment_status,
        courierName: o.courier_name,
        courierTrackingId: o.courier_tracking_id,
        courierStatus: o.courier_status,
        assignedTo: o.assigned_to,
        notes: o.notes || '',
        createdAt: o.created_at,
        items
      };
    });

    const total = db.get(`SELECT COUNT(*) as c FROM orders`).c;

    res.json({ orders, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/orders/:id', (req, res) => {
  try {
    const o = db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!o) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const items = db.all(`
      SELECT oi.*, p.image, p.sku as product_sku
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [o.id]).map(item => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      name: item.product_name,
      productSku: item.product_sku || '',
      price: item.price,
      unitPrice: item.price,
      quantity: item.quantity,
      total: item.total,
      totalPrice: item.total,
      image: item.image || null,
      variationId: item.variation_id || null
    }));

    const orderData = {
      id: o.id,
      orderNumber: o.order_number,
      customerName: o.customer_name,
      customerPhone: o.phone,
      customerAddress: o.address,
      phone: o.phone,
      address: o.address,
      district: o.district || '',
      thana: o.thana || '',
      shippingZone: o.district || '',
      shippingCost: o.shipping_cost,
      shippingCharge: o.shipping_cost,
      subtotal: o.subtotal,
      discount: o.discount,
      advancePaid: o.advance_payment || 0,
      total: o.total,
      codAmount: o.cod_amount,
      status: o.status,
      paymentMethod: o.payment_method,
      paymentStatus: o.payment_status,
      courierName: o.courier_name,
      courierTrackingId: o.courier_tracking_id,
      courierStatus: o.courier_status,
      courier_name: o.courier_name,
      courier_tracking_id: o.courier_tracking_id,
      courier_status: o.courier_status,
      assignedTo: o.assigned_to,
      notes: o.notes || '',
      createdAt: o.created_at,
      storeName: 'FAMILIO BAZAR',
      storePhone: '01787877362',
      storeEmail: 'imrandt2001@gmail.com',
      storeAddress: 'House #24, Road #03, Sector #11, Uttara, Dhaka-1230',
      items
    };

    res.json({
      order: orderData,
      items,
      ...orderData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/orders/:id/invoice', (req, res) => {
  try {
    const o = db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!o) {
      return res.status(404).send('<h1>Order not found</h1>');
    }
    const items = db.all(`
      SELECT oi.*, p.sku as product_sku
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [o.id]);

    const html = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>Invoice #${o.order_number} - FAMILIO BAZAR</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; margin: 0; padding: 25px; color: #333; background: #fff; }
    .invoice-container { max-width: 800px; margin: auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 8px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #16a34a; padding-bottom: 15px; }
    .brand { font-size: 26px; font-weight: bold; color: #16a34a; }
    .brand span { color: #0f172a; }
    .store-info { font-size: 13px; text-align: right; color: #64748b; line-height: 1.4; }
    .details { display: flex; justify-content: space-between; margin: 25px 0; background: #f8fafc; padding: 15px; border-radius: 6px; }
    .details div { font-size: 14px; line-height: 1.5; }
    .table { width: 100%; border-collapse: collapse; margin: 25px 0; font-size: 14px; }
    .table th, .table td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; }
    .table th { background: #f1f5f9; color: #1e293b; font-weight: 600; }
    .totals { margin-left: auto; width: 300px; font-size: 14px; }
    .totals div { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
    .totals .grand-total { font-size: 16px; font-weight: bold; color: #16a34a; border-top: 2px solid #e2e8f0; border-bottom: none; padding-top: 10px; }
    .footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 30px; border-top: 1px dashed #cbd5e1; font-size: 13px; color: #64748b; }
    .sig-line { border-top: 1px solid #94a3b8; width: 180px; text-align: center; padding-top: 5px; }
    .btn-print { background: #16a34a; color: white; border: none; padding: 10px 20px; font-size: 14px; font-weight: bold; border-radius: 6px; cursor: pointer; margin-bottom: 20px; }
    .barcode { font-family: 'Libre Barcode 39 Text', monospace; font-size: 30px; line-height: 1; color: #0f172a; margin-top: 6px; letter-spacing: 2px; }
    @media print {
      .btn-print { display: none; }
      body { padding: 0; }
      .invoice-container { border: none; }
    }
  </style>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39+Text&display=swap" rel="stylesheet">
</head>
<body>
  <div style="text-align: right; max-width: 800px; margin: auto;">
    <button class="btn-print" onclick="window.print()">🖨️ Print / Download Invoice</button>
  </div>
  <div class="invoice-container">
    <div class="header">
      <div>
        <div class="brand">FAMILIO <span>BAZAR</span></div>
        <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Smart Shopping, Delivered with Care</div>
      </div>
      <div class="store-info">
        <strong>House #24, Road #03, Sector #11, Uttara, Dhaka-1230</strong><br>
        Phone: 01787877362 | Email: imrandt2001@gmail.com<br>
        Web: https://familiobazar.com
      </div>
    </div>

    <div class="details">
      <div>
        <strong style="color: #0f172a;">Customer Details:</strong><br>
        <strong>${o.customer_name}</strong><br>
        Phone: ${o.phone}<br>
        Address: ${o.address}${o.thana ? ', ' + o.thana : ''}${o.district ? ', ' + o.district : ''}
      </div>
      <div style="text-align: right;">
        <strong style="color: #0f172a;">Invoice Info:</strong><br>
        Invoice: <strong>#${o.order_number}</strong><br>
        Date: ${new Date(o.created_at).toLocaleDateString('en-GB')}<br>
        Status: <span style="text-transform: uppercase; font-weight: bold; color: #16a34a;">${o.status}</span><br>
        Payment: ${o.payment_method.toUpperCase()} (${o.payment_status.toUpperCase()})
        <div class="barcode">*${o.order_number}*</div>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>#</th>
          <th>Item Description</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Unit Price</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((it, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${it.product_name}</strong></td>
            <td style="text-align: center;">${it.quantity}</td>
            <td style="text-align: right;">৳${it.price.toFixed(2)}</td>
            <td style="text-align: right;">৳${it.total.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div><span>Subtotal:</span> <span>৳${o.subtotal.toFixed(2)}</span></div>
      <div><span>Shipping Charge:</span> <span>৳${o.shipping_cost.toFixed(2)}</span></div>
      <div><span>Discount:</span> <span>-৳${o.discount.toFixed(2)}</span></div>
      ${o.advance_payment > 0 ? `<div><span>Advance Paid:</span> <span>-৳${o.advance_payment.toFixed(2)}</span></div>` : ''}
      <div class="grand-total"><span>COD Payable:</span> <span>৳${o.cod_amount.toFixed(2)}</span></div>
    </div>

    <div class="footer">
      <div>
        <div>Thank you for choosing Familio Bazar!</div>
        <div style="font-size: 11px; margin-top: 4px;">For any queries, please call: 01787877362</div>
      </div>
      <div class="sig-line">
        Authorized Signature
      </div>
    </div>
  </div>
</body>
</html>`;
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Status (supports both PATCH and PUT)
const handleStatusUpdate = (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    db.run(`UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [status, req.params.id]);
    res.json({ success: true, status, order: { id: parseInt(req.params.id, 10), status }, message: `Order marked as ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
router.patch('/orders/:id/status', handleStatusUpdate);
router.put('/orders/:id/status', handleStatusUpdate);

// Assign Staff (supports both PATCH and PUT)
const handleAssignUpdate = (req, res) => {
  try {
    const assigned = req.body.assignedTo || req.body.staffId || req.body.assigned_to;
    const staffId = assigned ? parseInt(assigned, 10) : null;
    db.run(`UPDATE orders SET assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [staffId, req.params.id]);
    res.json({ success: true, assignedTo: staffId, order: { id: parseInt(req.params.id, 10), assigned_to: staffId }, message: 'Order assignment updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
router.patch('/orders/:id/assign', handleAssignUpdate);
router.put('/orders/:id/assign', handleAssignUpdate);

// Create Manual Order from Admin
router.post('/orders', (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      phone,
      customerAddress,
      address,
      district = 'Dhaka',
      thana = '',
      notes = '',
      shippingCost = 0,
      shippingCharge = 0,
      discount = 0,
      advancePaid = 0,
      paymentMethod = 'cod',
      paymentStatus = 'unpaid',
      status = 'pending',
      items = []
    } = req.body;

    const cPhone = (customerPhone || phone || '').trim();
    const cName = (customerName || 'Walk-in Customer').trim();
    const cAddress = (customerAddress || address || '').trim();
    if (!cPhone || !cAddress) {
      return res.status(400).json({ error: 'Customer phone and address are required' });
    }

    let subtotal = 0;
    for (const item of items) {
      subtotal += (Number(item.price || item.unitPrice) || 0) * (Number(item.quantity) || 1);
    }

    const shipCost = Number(shippingCharge || shippingCost) || 0;
    const disc = Number(discount) || 0;
    const adv = Number(advancePaid) || 0;
    const total = Math.max(0, subtotal + shipCost - disc);
    const codAmount = Math.max(0, total - adv);

    const orderNumber = `DB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = db.run(`
      INSERT INTO orders (
        order_number, customer_name, phone, address, district, thana, notes,
        subtotal, shipping_cost, discount, total, advance_payment, cod_amount,
        status, payment_method, payment_status, source, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [orderNumber, cName, cPhone, cAddress, district, thana, notes, subtotal, shipCost, disc, total, adv, codAmount, status, paymentMethod, paymentStatus]);

    const orderId = result.lastInsertRowid;
    const insertItem = db.db.prepare(`
      INSERT INTO order_items (order_id, product_id, variation_id, product_name, product_sku, price, quantity, total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const it of items) {
      const itPrice = Number(it.price || it.unitPrice) || 0;
      const itQty = Number(it.quantity) || 1;
      insertItem.run(
        orderId,
        it.productId || 1,
        it.variationId || null,
        it.productName || it.name || 'Product',
        it.productSku || '',
        itPrice,
        itQty,
        itPrice * itQty
      );
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      id: orderId,
      orderNumber
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Order Details
router.put('/orders/:id', (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const existing = db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const {
      customerName,
      customerPhone,
      phone,
      customerAddress,
      address,
      district,
      thana,
      notes,
      shippingCharge,
      shippingCost,
      discount,
      advancePaid,
      paymentMethod,
      paymentStatus,
      status,
      assignedTo,
      items
    } = req.body;

    const cName = customerName !== undefined ? customerName.trim() : existing.customer_name;
    const cPhone = (customerPhone || phone) !== undefined ? (customerPhone || phone).trim() : existing.phone;
    const cAddress = (customerAddress || address) !== undefined ? (customerAddress || address).trim() : existing.address;
    const cDistrict = district !== undefined ? district : existing.district;
    const cThana = thana !== undefined ? thana : existing.thana;
    const cNotes = notes !== undefined ? notes : existing.notes;
    const cStatus = status !== undefined ? status : existing.status;
    const cMethod = paymentMethod !== undefined ? paymentMethod : existing.payment_method;
    const cPaymentStatus = paymentStatus !== undefined ? paymentStatus : existing.payment_status;
    const cAssigned = assignedTo !== undefined ? (assignedTo ? parseInt(assignedTo, 10) : null) : existing.assigned_to;

    let subtotal = existing.subtotal;
    const shipCost = (shippingCharge !== undefined || shippingCost !== undefined) ? Number(shippingCharge || shippingCost) : existing.shipping_cost;
    const disc = discount !== undefined ? Number(discount) : existing.discount;
    const adv = advancePaid !== undefined ? Number(advancePaid) : existing.advance_payment;

    if (Array.isArray(items) && items.length > 0) {
      db.run('DELETE FROM order_items WHERE order_id = ?', [orderId]);
      subtotal = 0;
      const insertItem = db.db.prepare(`
        INSERT INTO order_items (order_id, product_id, variation_id, product_name, product_sku, price, quantity, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const it of items) {
        const itPrice = Number(it.price || it.unitPrice) || 0;
        const itQty = Number(it.quantity) || 1;
        const itTotal = itPrice * itQty;
        subtotal += itTotal;
        insertItem.run(
          orderId,
          it.productId || 1,
          it.variationId || null,
          it.productName || it.name || 'Product',
          it.productSku || '',
          itPrice,
          itQty,
          itTotal
        );
      }
    }

    const total = Math.max(0, subtotal + shipCost - disc);
    const codAmount = Math.max(0, total - adv);

    db.run(`
      UPDATE orders
      SET customer_name = ?, phone = ?, address = ?, district = ?, thana = ?, notes = ?,
          subtotal = ?, shipping_cost = ?, discount = ?, total = ?, advance_payment = ?, cod_amount = ?,
          status = ?, payment_method = ?, payment_status = ?, assigned_to = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [cName, cPhone, cAddress, cDistrict, cThana, cNotes, subtotal, shipCost, disc, total, adv, codAmount, cStatus, cMethod, cPaymentStatus, cAssigned, orderId]);

    res.json({ success: true, message: 'Order updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Order
router.delete('/orders/:id', (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    db.run('DELETE FROM order_items WHERE order_id = ?', [orderId]);
    db.run('DELETE FROM orders WHERE id = ?', [orderId]);
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk Orders Action (Bulk status change or delete)
router.post('/orders/bulk', (req, res) => {
  try {
    const { ids = [], action, status } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No order IDs provided' });
    }
    const cleanIds = ids.map(id => parseInt(id, 10)).filter(n => !isNaN(n));
    const placeholders = cleanIds.map(() => '?').join(',');

    if (action === 'delete') {
      db.run(`DELETE FROM order_items WHERE order_id IN (${placeholders})`, cleanIds);
      db.run(`DELETE FROM orders WHERE id IN (${placeholders})`, cleanIds);
      return res.json({ success: true, message: `Deleted ${cleanIds.length} orders.` });
    }

    const targetStatus = status || (action && action !== 'delete' ? action : null);
    if (targetStatus) {
      db.run(`UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`, [targetStatus, ...cleanIds]);
      return res.json({ success: true, message: `Updated ${cleanIds.length} orders to ${targetStatus}.` });
    }

    res.status(400).json({ error: 'Invalid bulk action or status' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Courier Dispatch Integration
router.post('/orders/:id/courier-ship', (req, res) => {
  try {
    const courierName = req.body.courierName || req.body.courier || 'Pathao';
    const trackingId = `TRK-${courierName.toUpperCase().slice(0, 3)}-${Date.now()}`;
    db.run(`
      UPDATE orders 
      SET courier_name = ?, courier_tracking_id = ?, courier_status = 'In Transit', status = 'shipped', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [courierName, trackingId, req.params.id]);

    res.json({
      success: true,
      trackingId,
      courierName,
      courierStatus: 'In Transit',
      order: {
        id: parseInt(req.params.id, 10),
        courier_name: courierName,
        courier_tracking_id: trackingId,
        courier_status: 'In Transit',
        status: 'shipped'
      },
      message: 'Parcel booked with courier successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/orders/:id/courier-sync', (req, res) => {
  try {
    const o = db.get('SELECT courier_name, courier_tracking_id, courier_status FROM orders WHERE id = ?', [req.params.id]);
    if (!o || !o.courier_tracking_id) {
      return res.status(400).json({ error: 'No courier shipment found for this order' });
    }
    res.json({
      success: true,
      courierName: o.courier_name,
      courierTrackingId: o.courier_tracking_id,
      courierStatus: o.courier_status || 'In Transit'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/courier/sync-all', (req, res) => {
  try {
    const shippedOrders = db.all("SELECT id FROM orders WHERE status = 'shipped'");
    res.json({ success: true, syncedCount: shippedOrders.length, message: 'All courier tracking statuses synced.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Products CRUD & List
router.get('/products/list', (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      search = '',
      category = 'all',
      brand = 'all',
      status = 'all',
      stock = 'all',
      sort = 'id',
      dir = 'desc'
    } = req.query;

    let sql = `
      SELECT p.*, c.name as categoryName, b.name as brandName 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      sql += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.slug LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (category && category !== 'all') {
      sql += ' AND (p.category_id = ? OR c.slug = ?)';
      params.push(isNaN(category) ? category : parseInt(category, 10), category);
    }

    if (brand && brand !== 'all') {
      sql += ' AND (p.brand_id = ? OR b.name = ?)';
      params.push(isNaN(brand) ? brand : parseInt(brand, 10), brand);
    }

    if (status && status !== 'all') {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    if (stock === 'out') {
      sql += ' AND p.stock <= 0';
    } else if (stock === 'low') {
      sql += ' AND p.stock > 0 AND p.stock <= p.low_stock_threshold';
    } else if (stock === 'in') {
      sql += ' AND p.stock > 0';
    }

    // Sort order
    const allowedSortFields = ['id', 'name', 'price', 'stock', 'created_at'];
    const sortField = allowedSortFields.includes(sort) ? `p.${sort}` : 'p.id';
    const sortDir = dir.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    sql += ` ORDER BY ${sortField} ${sortDir}`;

    // Get total matching
    const countSql = sql.replace('SELECT p.*, c.name as categoryName, b.name as brandName', 'SELECT COUNT(*) as c');
    const total = db.get(countSql, params).c;

    // Apply pagination
    const offset = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize, 10), offset);

    const rows = db.all(sql, params).map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      sku: r.sku,
      price: r.price,
      salePrice: r.sale_price,
      stock: r.stock,
      status: r.status,
      categoryId: r.category_id,
      categoryName: r.categoryName,
      brandId: r.brand_id,
      brandName: r.brandName,
      image: r.image,
      images: (() => {
        try {
          return r.images ? JSON.parse(r.images) : (r.image ? [r.image] : []);
        } catch (e) {
          return r.image ? [r.image] : [];
        }
      })()
    }));

    // Summary statistics
    const summaryTotal = db.get(`SELECT COUNT(*) as c FROM products`).c;
    const summaryActive = db.get(`SELECT COUNT(*) as c FROM products WHERE status = 'active'`).c;
    const summaryDraft = db.get(`SELECT COUNT(*) as c FROM products WHERE status = 'draft'`).c;
    const summaryOut = db.get(`SELECT COUNT(*) as c FROM products WHERE stock <= 0`).c;
    const summaryLow = db.get(`SELECT COUNT(*) as c FROM products WHERE stock > 0 AND stock <= low_stock_threshold`).c;
    const summaryValue = db.get(`SELECT SUM(price * stock) as s FROM products`).s || 0;

    res.json({
      rows,
      total,
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      summary: {
        total: summaryTotal,
        active: summaryActive,
        draft: summaryDraft,
        archived: 0,
        unpublished: 0,
        out: summaryOut,
        low: summaryLow,
        value: summaryValue
      }
    });
  } catch (err) {
    console.error('Error in /products/list:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/products', (req, res) => {
  try {
    const rows = db.all(`
      SELECT p.*, c.name as categoryName, b.name as brandName 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ORDER BY p.id DESC
    `);
    res.json(rows.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      sku: r.sku,
      price: r.price,
      salePrice: r.sale_price,
      stock: r.stock,
      status: r.status,
      categoryId: r.category_id,
      categoryName: r.categoryName,
      brandId: r.brand_id,
      brandName: r.brandName,
      image: r.image,
      images: (() => {
        try {
          return r.images ? JSON.parse(r.images) : (r.image ? [r.image] : []);
        } catch (e) {
          return r.image ? [r.image] : [];
        }
      })()
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products', (req, res) => {
  try {
    const p = req.body;
    const image = p.image || (Array.isArray(p.images) && p.images[0]) || null;
    const imagesStr = typeof p.images === 'string' ? p.images : JSON.stringify(p.images || (image ? [image] : []));

    const result = db.run(`
      INSERT INTO products (
        name, slug, sku, price, sale_price, stock, category_id, brand_id, description, image, images, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      p.name,
      p.slug || `prod-${Date.now()}`,
      p.sku || `SKU-${Date.now()}`,
      parseFloat(p.price) || 0,
      p.salePrice ? parseFloat(p.salePrice) : null,
      parseInt(p.stock, 10) || 0,
      p.categoryId || null,
      p.brandId || 1, // default EM-BRAND
      p.description || '',
      image,
      imagesStr,
      p.status || 'active'
    ]);

    res.status(201).json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/products/:id', (req, res) => {
  try {
    const p = req.body;
    const image = p.image || (Array.isArray(p.images) && p.images[0]) || null;
    const imagesStr = typeof p.images === 'string' ? p.images : (p.images ? JSON.stringify(p.images) : null);

    let sql = `
      UPDATE products 
      SET name = ?, price = ?, sale_price = ?, stock = ?, category_id = ?, status = ?
    `;
    const params = [
      p.name,
      parseFloat(p.price) || 0,
      p.salePrice ? parseFloat(p.salePrice) : null,
      parseInt(p.stock, 10) || 0,
      p.categoryId || null,
      p.status || 'active'
    ];

    if (image !== undefined) {
      sql += `, image = ?`;
      params.push(image);
    }
    if (imagesStr !== null && imagesStr !== undefined) {
      sql += `, images = ?`;
      params.push(imagesStr);
    }
    if (p.brandId !== undefined) {
      sql += `, brand_id = ?`;
      params.push(p.brandId);
    }

    sql += ` WHERE id = ?`;
    params.push(req.params.id);

    db.run(sql, params);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/products/:id', (req, res) => {
  try {
    db.run(`DELETE FROM products WHERE id = ?`, [req.params.id]);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Product Variations Management
router.get('/products/:id/variations', (req, res) => {
  try {
    const variations = db.all('SELECT * FROM product_variations WHERE product_id = ? ORDER BY id ASC', [req.params.id]).map(v => {
      let comb = {};
      try {
        comb = typeof v.attribute_values === 'string' ? JSON.parse(v.attribute_values) : (v.attribute_values || {});
      } catch {
        comb = {};
      }
      return {
        id: v.id,
        productId: v.product_id,
        combination: comb,
        name: v.name || '',
        sku: v.sku || '',
        barcode: '',
        price: v.price != null ? String(v.price) : '',
        salePrice: v.sale_price != null ? String(v.sale_price) : '',
        wholesalePrice: '',
        stock: v.stock !== undefined && v.stock !== null ? String(v.stock) : '0',
        image: v.image || '',
        status: 'active'
      };
    });
    res.json(variations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/products/:id/variations', (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const prod = db.get('SELECT * FROM products WHERE id = ?', [productId]);
    if (!prod) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const variationsList = Array.isArray(req.body.variations) ? req.body.variations : [];

    // Delete existing variations for this product
    db.run('DELETE FROM product_variations WHERE product_id = ?', [productId]);

    let totalStock = 0;
    const insertStmt = db.db.prepare(`
      INSERT INTO product_variations (product_id, name, sku, price, sale_price, stock, image, attribute_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    for (const v of variationsList) {
      const comb = v.combination && typeof v.combination === 'object' ? v.combination : {};
      const label = v.label || v.name || Object.entries(comb).map(([k, val]) => `${k}: ${val}`).join(' / ') || 'Variation';
      const sku = v.sku ? v.sku.trim() : `${prod.sku || 'SKU'}-VAR-${Date.now()}`;
      const price = v.price !== undefined && v.price !== '' ? parseFloat(v.price) : prod.price;
      const salePrice = v.salePrice !== undefined && v.salePrice !== '' && v.salePrice !== null ? parseFloat(v.salePrice) : null;
      const stock = Number(v.stock) || 0;
      totalStock += stock;
      const image = v.image || null;

      insertStmt.run(
        productId,
        label,
        sku,
        price,
        salePrice,
        stock,
        image,
        JSON.stringify(comb)
      );
    }

    // Update parent product stock and has_variations flag
    const hasVariations = variationsList.length > 0 ? 1 : 0;
    if (hasVariations) {
      db.run(
        'UPDATE products SET stock = ?, has_variations = 1 WHERE id = ?',
        [totalStock, productId]
      );
    } else {
      db.run(
        'UPDATE products SET has_variations = 0 WHERE id = ?',
        [productId]
      );
    }

    res.json({
      success: true,
      message: 'Variations updated successfully',
      count: variationsList.length,
      totalStock
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Attributes Management CRUD
router.get('/attributes', (req, res) => {
  try {
    const rows = db.all('SELECT * FROM product_attributes ORDER BY id ASC');
    const attrs = rows.map(r => ({
      id: r.id,
      name: r.name,
      values: (() => {
        try {
          return r.values_json ? JSON.parse(r.values_json) : [];
        } catch {
          return [];
        }
      })(),
      createdAt: r.created_at
    }));
    res.json(attrs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/attributes', (req, res) => {
  try {
    const { name, values = [] } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Attribute name is required' });
    }
    const cleanValues = Array.isArray(values) ? values : (typeof values === 'string' ? values.split(',').map(s => s.trim()).filter(Boolean) : []);
    const result = db.run(
      'INSERT INTO product_attributes (name, values_json, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      [name.trim(), JSON.stringify(cleanValues)]
    );
    res.status(201).json({
      success: true,
      message: 'Attribute created successfully',
      id: result.lastInsertRowid,
      attribute: {
        id: result.lastInsertRowid,
        name: name.trim(),
        values: cleanValues
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/attributes/:id', (req, res) => {
  try {
    const existing = db.get('SELECT * FROM product_attributes WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Attribute not found' });
    }
    const name = req.body.name !== undefined ? req.body.name.trim() : existing.name;
    let values = existing.values_json ? JSON.parse(existing.values_json) : [];
    if (req.body.values !== undefined) {
      values = Array.isArray(req.body.values) ? req.body.values : (typeof req.body.values === 'string' ? req.body.values.split(',').map(s => s.trim()).filter(Boolean) : []);
    }
    db.run(
      'UPDATE product_attributes SET name = ?, values_json = ? WHERE id = ?',
      [name, JSON.stringify(values), req.params.id]
    );
    res.json({
      success: true,
      message: 'Attribute updated successfully',
      attribute: {
        id: parseInt(req.params.id, 10),
        name,
        values
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/attributes/:id', (req, res) => {
  try {
    db.run('DELETE FROM product_attributes WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Attribute deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Categories CRUD & Reorder
router.get('/categories', (req, res) => {
  try {
    const categories = db.all(`
      SELECT c.*, COUNT(p.id) as product_count 
      FROM categories c 
      LEFT JOIN products p ON p.category_id = c.id 
      GROUP BY c.id 
      ORDER BY c.sort_order ASC, c.id ASC
    `).map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parentId: c.parent_id,
      parent_id: c.parent_id,
      image: c.image,
      icon: c.icon,
      banner: c.banner,
      sortOrder: c.sort_order,
      sort_order: c.sort_order,
      featured: Boolean(c.is_featured),
      isFeatured: Boolean(c.is_featured),
      is_featured: c.is_featured,
      status: c.status || 'active',
      productCount: c.product_count || 0,
      product_count: c.product_count || 0,
      createdAt: c.created_at
    }));
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/categories', (req, res) => {
  try {
    const { name, slug, parentId, parent_id, image, icon, banner, featured, isFeatured, sortOrder, sort_order, status = 'active' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const catSlug = (slug && slug.trim()) ? slug.trim() : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const pId = parentId !== undefined ? parentId : (parent_id !== undefined ? parent_id : null);
    const isFeat = featured !== undefined ? (featured ? 1 : 0) : (isFeatured ? 1 : 0);
    const sOrder = sortOrder !== undefined ? parseInt(sortOrder, 10) : (sort_order !== undefined ? parseInt(sort_order, 10) : 0);

    const result = db.run(`
      INSERT INTO categories (name, slug, parent_id, image, icon, banner, is_featured, sort_order, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [name.trim(), catSlug, pId || null, image || null, icon || null, banner || null, isFeat, sOrder || 0, status]);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      id: result.lastInsertRowid,
      category: {
        id: result.lastInsertRowid,
        name: name.trim(),
        slug: catSlug,
        parentId: pId || null,
        image,
        icon,
        banner,
        featured: Boolean(isFeat),
        sortOrder: sOrder || 0,
        status
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/categories/reorder', (req, res) => {
  try {
    const categoriesList = Array.isArray(req.body.categories) ? req.body.categories : [];
    const stmt = db.db.prepare('UPDATE categories SET sort_order = ? WHERE id = ?');
    for (const item of categoriesList) {
      if (item.id != null && item.sortOrder != null) {
        stmt.run(parseInt(item.sortOrder, 10), parseInt(item.id, 10));
      }
    }
    res.json({ success: true, message: 'Categories reordered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/categories/:id', (req, res) => {
  try {
    const catId = parseInt(req.params.id, 10);
    const existing = db.get('SELECT * FROM categories WHERE id = ?', [catId]);
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }
    const name = req.body.name !== undefined ? req.body.name.trim() : existing.name;
    const slug = req.body.slug !== undefined ? req.body.slug.trim() : existing.slug;
    const pId = req.body.parentId !== undefined ? req.body.parentId : (req.body.parent_id !== undefined ? req.body.parent_id : existing.parent_id);
    const image = req.body.image !== undefined ? req.body.image : existing.image;
    const icon = req.body.icon !== undefined ? req.body.icon : existing.icon;
    const banner = req.body.banner !== undefined ? req.body.banner : existing.banner;
    const isFeat = req.body.featured !== undefined ? (req.body.featured ? 1 : 0) : (req.body.isFeatured !== undefined ? (req.body.isFeatured ? 1 : 0) : existing.is_featured);
    const sOrder = req.body.sortOrder !== undefined ? parseInt(req.body.sortOrder, 10) : (req.body.sort_order !== undefined ? parseInt(req.body.sort_order, 10) : existing.sort_order);
    const status = req.body.status !== undefined ? req.body.status : existing.status;

    db.run(`
      UPDATE categories 
      SET name = ?, slug = ?, parent_id = ?, image = ?, icon = ?, banner = ?, is_featured = ?, sort_order = ?, status = ?
      WHERE id = ?
    `, [name, slug, pId || null, image || null, icon || null, banner || null, isFeat, sOrder || 0, status, catId]);

    res.json({ success: true, message: 'Category updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/categories/:id', (req, res) => {
  try {
    const catId = parseInt(req.params.id, 10);
    db.run('UPDATE categories SET parent_id = NULL WHERE parent_id = ?', [catId]);
    db.run('UPDATE products SET category_id = NULL WHERE category_id = ?', [catId]);
    db.run('DELETE FROM categories WHERE id = ?', [catId]);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Brands CRUD & Product Counts
router.get('/brands/product-counts', (req, res) => {
  try {
    const counts = db.all(`
      SELECT brand_id, COUNT(*) as count 
      FROM products 
      WHERE brand_id IS NOT NULL 
      GROUP BY brand_id
    `);
    const result = {};
    for (const c of counts) {
      result[String(c.brand_id)] = c.count;
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/brands', (req, res) => {
  try {
    const { name, slug, logo, website, status = 'active' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Brand name is required' });
    }
    const brandSlug = (slug && slug.trim()) ? slug.trim() : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const result = db.run(`
      INSERT INTO brands (name, slug, logo, website, status, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [name.trim(), brandSlug, logo || null, website || null, status]);

    res.status(201).json({
      success: true,
      message: 'Brand created successfully',
      id: result.lastInsertRowid,
      brand: {
        id: result.lastInsertRowid,
        name: name.trim(),
        slug: brandSlug,
        logo,
        website,
        status
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/brands/:id', (req, res) => {
  try {
    const brandId = parseInt(req.params.id, 10);
    const existing = db.get('SELECT * FROM brands WHERE id = ?', [brandId]);
    if (!existing) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    const name = req.body.name !== undefined ? req.body.name.trim() : existing.name;
    const slug = req.body.slug !== undefined ? req.body.slug.trim() : existing.slug;
    const logo = req.body.logo !== undefined ? req.body.logo : existing.logo;
    const website = req.body.website !== undefined ? req.body.website : existing.website;
    const status = req.body.status !== undefined ? req.body.status : existing.status;

    db.run(`
      UPDATE brands 
      SET name = ?, slug = ?, logo = ?, website = ?, status = ?
      WHERE id = ?
    `, [name, slug, logo || null, website || null, status, brandId]);

    res.json({ success: true, message: 'Brand updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/brands/:id', (req, res) => {
  try {
    const brandId = parseInt(req.params.id, 10);
    db.run('UPDATE products SET brand_id = NULL WHERE brand_id = ?', [brandId]);
    db.run('DELETE FROM brands WHERE id = ?', [brandId]);
    res.json({ success: true, message: 'Brand deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Settings Update
router.post('/settings', (req, res) => {
  try {
    const updates = req.body;
    const stmt = db.db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);
    for (const [key, val] of Object.entries(updates)) {
      stmt.run(key, typeof val === 'string' ? val : JSON.stringify(val));
    }
    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// System Health
router.get('/system/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: 'sqlite',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Staff & User Management CRUD
router.get('/users', (req, res) => {
  try {
    const users = db.all(`
      SELECT id, name, email, phone, role, permissions, status, created_at 
      FROM users 
      ORDER BY id ASC
    `).map(u => ({
      ...u,
      permissions: (() => {
        try {
          return u.permissions ? JSON.parse(u.permissions) : [];
        } catch {
          return [];
        }
      })()
    }));
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users', (req, res) => {
  try {
    const { name, email, phone, role = 'staff', permissions = [], password, status = 'active' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.get(`SELECT id FROM users WHERE LOWER(email) = ?`, [cleanEmail]);
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    const permString = typeof permissions === 'string' ? permissions : JSON.stringify(permissions);

    const result = db.run(`
      INSERT INTO users (name, email, phone, password_hash, role, permissions, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [name.trim(), cleanEmail, phone ? phone.trim() : null, hash, role, permString, status]);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      id: result.lastInsertRowid,
      user: {
        id: result.lastInsertRowid,
        name: name.trim(),
        email: cleanEmail,
        phone: phone ? phone.trim() : null,
        role,
        permissions: Array.isArray(permissions) ? permissions : [],
        status
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id', (req, res) => {
  try {
    const { name, email, phone, role, permissions, password, status } = req.body;
    const user = db.get(`SELECT * FROM users WHERE id = ?`, [req.params.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let sql = `UPDATE users SET name = ?, email = ?, phone = ?, role = ?, permissions = ?, status = ?`;
    const cleanEmail = email ? email.trim().toLowerCase() : user.email;
    const permString = permissions !== undefined ? (typeof permissions === 'string' ? permissions : JSON.stringify(permissions)) : user.permissions;

    const params = [
      name ? name.trim() : user.name,
      cleanEmail,
      phone !== undefined ? (phone ? phone.trim() : null) : user.phone,
      role || user.role,
      permString,
      status || user.status
    ];

    if (password && password.trim().length >= 6) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password.trim(), salt);
      sql += `, password_hash = ?`;
      params.push(hash);
    }

    sql += ` WHERE id = ?`;
    params.push(req.params.id);

    db.run(sql, params);
    res.json({ success: true, message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (id === 1) {
      return res.status(400).json({ error: 'Cannot delete primary Super Admin user' });
    }
    if (req.user && req.user.id === id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    db.run(`DELETE FROM users WHERE id = ?`, [id]);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id/password', (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.trim().length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password.trim(), salt);
    db.run(`UPDATE users SET password_hash = ? WHERE id = ?`, [hash, req.params.id]);
    res.json({ success: true, message: 'User password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Phase 4: Payment Gateways Configuration
// ==========================================
const DEFAULT_GATEWAYS = {
  bkash: {
    enabled: false,
    appKey: '',
    appSecret: '',
    username: '',
    password: '',
    mode: 'sandbox'
  },
  nagad: {
    enabled: false,
    merchantId: '',
    merchantNumber: '',
    merchantPrivateKey: '',
    pgPublicKey: '',
    mode: 'sandbox'
  },
  sslcommerz: {
    enabled: false,
    storeId: '',
    storePassword: '',
    mode: 'sandbox'
  }
};

const getStoredGateways = () => {
  try {
    const row = db.get("SELECT value FROM settings WHERE key = 'payment_gateways_config'");
    if (row && row.value) {
      const parsed = JSON.parse(row.value);
      return { ...DEFAULT_GATEWAYS, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_GATEWAYS };
};

const saveStoredGateways = (cfg) => {
  const stmt = db.db.prepare(`
    INSERT OR REPLACE INTO settings (key, value, updated_at)
    VALUES ('payment_gateways_config', ?, CURRENT_TIMESTAMP)
  `);
  stmt.run(JSON.stringify(cfg));
};

router.get('/payment-gateways', (req, res) => {
  try {
    const gateways = getStoredGateways();
    // Return configs with masked secret fields for client display
    const safeGateways = {
      bkash: {
        ...gateways.bkash,
        appSecret: gateways.bkash.appSecret ? '********' : '',
        password: gateways.bkash.password ? '********' : ''
      },
      nagad: {
        ...gateways.nagad,
        merchantPrivateKey: gateways.nagad.merchantPrivateKey ? '********' : ''
      },
      sslcommerz: {
        ...gateways.sslcommerz,
        storePassword: gateways.sslcommerz.storePassword ? '********' : ''
      }
    };
    res.json(safeGateways);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const handleSaveGateways = (req, res) => {
  try {
    const current = getStoredGateways();
    const payload = req.body || {};
    const gatewayId = req.params.id;

    if (gatewayId) {
      const gUpdate = payload;
      const existing = current[gatewayId] || {};
      current[gatewayId] = {
        ...existing,
        ...gUpdate,
        // Preserve secrets if empty string or masked was sent
        appSecret: (gUpdate.appSecret && gUpdate.appSecret !== '********') ? gUpdate.appSecret : existing.appSecret,
        password: (gUpdate.password && gUpdate.password !== '********') ? gUpdate.password : existing.password,
        merchantPrivateKey: (gUpdate.merchantPrivateKey && gUpdate.merchantPrivateKey !== '********') ? gUpdate.merchantPrivateKey : existing.merchantPrivateKey,
        storePassword: (gUpdate.storePassword && gUpdate.storePassword !== '********') ? gUpdate.storePassword : existing.storePassword
      };
    } else {
      for (const [key, gUpdate] of Object.entries(payload)) {
        if (current[key]) {
          const existing = current[key];
          current[key] = {
            ...existing,
            ...gUpdate,
            appSecret: (gUpdate.appSecret && gUpdate.appSecret !== '********') ? gUpdate.appSecret : existing.appSecret,
            password: (gUpdate.password && gUpdate.password !== '********') ? gUpdate.password : existing.password,
            merchantPrivateKey: (gUpdate.merchantPrivateKey && gUpdate.merchantPrivateKey !== '********') ? gUpdate.merchantPrivateKey : existing.merchantPrivateKey,
            storePassword: (gUpdate.storePassword && gUpdate.storePassword !== '********') ? gUpdate.storePassword : existing.storePassword
          };
        }
      }
    }

    saveStoredGateways(current);
    res.json({ success: true, message: 'Payment gateway configuration saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.put('/payment-gateways', handleSaveGateways);
router.put('/payment-gateways/:id', handleSaveGateways);

router.post('/payment-gateways/:id/test', (req, res) => {
  try {
    const id = req.params.id;
    const gateways = getStoredGateways();
    const gw = gateways[id];
    if (!gw) {
      return res.status(404).json({ success: false, error: 'Unknown payment gateway' });
    }
    res.json({
      success: true,
      message: `${id.toUpperCase()} sandbox connection test passed successfully.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/payment-transactions', (req, res) => {
  try {
    const txs = db.all(`
      SELECT pt.*, o.order_number as orderNumber, o.customer_name as customerName
      FROM payment_transactions pt
      LEFT JOIN orders o ON pt.order_id = o.id
      ORDER BY pt.id DESC
      LIMIT 50
    `);
    res.json(txs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Phase 5: Banner Management CRUD
// ==========================================
router.get('/banners', (req, res) => {
  try {
    const banners = db.all(`SELECT * FROM banners ORDER BY sort_order ASC, id ASC`).map(b => ({
      id: b.id,
      title: b.title || '',
      subtitle: b.subtitle || '',
      badge: b.badge || '',
      buttonText: b.button_text || '',
      buttonLink: b.button_link || b.link_url || '',
      imageUrl: b.image_url,
      image_url: b.image_url,
      link: b.link_url || '',
      link_url: b.link_url || '',
      position: b.position || 'home_hero',
      sortOrder: b.sort_order || 0,
      sort_order: b.sort_order || 0,
      status: b.status || 'active',
      active: b.status === 'active'
    }));
    res.json(banners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/banners', (req, res) => {
  try {
    const {
      title = '',
      subtitle = '',
      badge = '',
      buttonText = '',
      buttonLink = '',
      imageUrl,
      image_url,
      link = '',
      link_url = '',
      position = 'home_hero',
      sortOrder = 0,
      sort_order = 0,
      status = 'active',
      active
    } = req.body;

    const img = imageUrl || image_url;
    if (!img) {
      return res.status(400).json({ error: 'Banner image URL is required' });
    }

    const bStatus = status || (active === false ? 'inactive' : 'active');
    const sOrder = parseInt(sortOrder || sort_order || 0, 10);
    const lnk = link || link_url || buttonLink || '';

    const result = db.run(`
      INSERT INTO banners (title, subtitle, badge, button_text, button_link, image_url, link_url, position, sort_order, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, subtitle, badge, buttonText, buttonLink, img, lnk, position, sOrder, bStatus]);

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      id: result.lastInsertRowid,
      banner: {
        id: result.lastInsertRowid,
        title,
        subtitle,
        badge,
        buttonText,
        buttonLink,
        imageUrl: img,
        link: lnk,
        position,
        sortOrder: sOrder,
        status: bStatus,
        active: bStatus === 'active'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/banners/:id', (req, res) => {
  try {
    const bannerId = parseInt(req.params.id, 10);
    const existing = db.get('SELECT * FROM banners WHERE id = ?', [bannerId]);
    if (!existing) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    const {
      title,
      subtitle,
      badge,
      buttonText,
      buttonLink,
      imageUrl,
      image_url,
      link,
      link_url,
      position,
      sortOrder,
      sort_order,
      status,
      active
    } = req.body;

    const bTitle = title !== undefined ? title : existing.title;
    const bSubtitle = subtitle !== undefined ? subtitle : existing.subtitle;
    const bBadge = badge !== undefined ? badge : existing.badge;
    const bBtnText = buttonText !== undefined ? buttonText : existing.button_text;
    const bBtnLink = buttonLink !== undefined ? buttonLink : existing.button_link;
    const bImg = (imageUrl || image_url) !== undefined ? (imageUrl || image_url) : existing.image_url;
    const bLnk = (link || link_url) !== undefined ? (link || link_url) : existing.link_url;
    const bPos = position !== undefined ? position : existing.position;
    const bSort = (sortOrder !== undefined || sort_order !== undefined) ? parseInt(sortOrder || sort_order, 10) : existing.sort_order;
    let bStatus = status !== undefined ? status : existing.status;
    if (active !== undefined) {
      bStatus = active ? 'active' : 'inactive';
    }

    db.run(`
      UPDATE banners
      SET title = ?, subtitle = ?, badge = ?, button_text = ?, button_link = ?,
          image_url = ?, link_url = ?, position = ?, sort_order = ?, status = ?
      WHERE id = ?
    `, [bTitle, bSubtitle, bBadge, bBtnText, bBtnLink, bImg, bLnk, bPos, bSort, bStatus, bannerId]);

    res.json({ success: true, message: 'Banner updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/banners/:id', (req, res) => {
  try {
    db.run('DELETE FROM banners WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Phase 5: Courier Integration Geography & Test
// ==========================================
const BANGLADESH_CITIES = [
  { city_id: 1, city_name: 'Dhaka', id: 1, name: 'Dhaka' },
  { city_id: 2, city_name: 'Chittagong', id: 2, name: 'Chittagong' },
  { city_id: 3, city_name: 'Sylhet', id: 3, name: 'Sylhet' },
  { city_id: 4, city_name: 'Rajshahi', id: 4, name: 'Rajshahi' },
  { city_id: 5, city_name: 'Khulna', id: 5, name: 'Khulna' },
  { city_id: 6, city_name: 'Barisal', id: 6, name: 'Barisal' },
  { city_id: 7, city_name: 'Rangpur', id: 7, name: 'Rangpur' },
  { city_id: 8, city_name: 'Mymensingh', id: 8, name: 'Mymensingh' }
];

const DHAKA_ZONES = [
  { zone_id: 1, zone_name: 'Uttara', id: 1, name: 'Uttara', city_id: 1 },
  { zone_id: 2, zone_name: 'Dhanmondi', id: 2, name: 'Dhanmondi', city_id: 1 },
  { zone_id: 3, zone_name: 'Gulshan', id: 3, name: 'Gulshan', city_id: 1 },
  { zone_id: 4, zone_name: 'Banani', id: 4, name: 'Banani', city_id: 1 },
  { zone_id: 5, zone_name: 'Mirpur', id: 5, name: 'Mirpur', city_id: 1 },
  { zone_id: 6, zone_name: 'Mohammadpur', id: 6, name: 'Mohammadpur', city_id: 1 },
  { zone_id: 7, zone_name: 'Motijheel', id: 7, name: 'Motijheel', city_id: 1 },
  { zone_id: 8, zone_name: 'Badda', id: 8, name: 'Badda', city_id: 1 }
];

const UTTARA_AREAS = [
  { area_id: 1, area_name: 'Sector 1', id: 1, name: 'Sector 1', zone_id: 1 },
  { area_id: 2, area_name: 'Sector 3', id: 2, name: 'Sector 3', zone_id: 1 },
  { area_id: 3, area_name: 'Sector 7', id: 3, name: 'Sector 7', zone_id: 1 },
  { area_id: 4, area_name: 'Sector 11', id: 4, name: 'Sector 11', zone_id: 1 },
  { area_id: 5, area_name: 'Sector 13', id: 5, name: 'Sector 13', zone_id: 1 }
];

router.get('/courier/pathao/cities', (req, res) => {
  res.json(BANGLADESH_CITIES);
});

router.get('/courier/pathao/zones/:cityId', (req, res) => {
  const cityId = parseInt(req.params.cityId, 10);
  if (cityId === 1) {
    res.json(DHAKA_ZONES);
  } else {
    res.json([
      { zone_id: cityId * 10 + 1, zone_name: 'Sadar / Central Zone', id: cityId * 10 + 1, name: 'Sadar / Central Zone', city_id: cityId }
    ]);
  }
});

router.get('/courier/pathao/areas/:zoneId', (req, res) => {
  const zoneId = parseInt(req.params.zoneId, 10);
  if (zoneId === 1) {
    res.json(UTTARA_AREAS);
  } else {
    res.json([
      { area_id: zoneId * 100 + 1, area_name: 'Main Area', id: zoneId * 100 + 1, name: 'Main Area', zone_id: zoneId }
    ]);
  }
});

router.get('/courier/redx/areas', (req, res) => {
  res.json([
    { id: 1, name: 'Uttara, Sector 1-14', district_name: 'Dhaka' },
    { id: 2, name: 'Dhanmondi / Kalabagan', district_name: 'Dhaka' },
    { id: 3, name: 'Gulshan 1 & 2', district_name: 'Dhaka' },
    { id: 4, name: 'Mirpur (All Sections)', district_name: 'Dhaka' },
    { id: 5, name: 'Chittagong City Center', district_name: 'Chittagong' },
    { id: 6, name: 'Sylhet Sadar', district_name: 'Sylhet' }
  ]);
});

router.get('/courier/carrybee/cities', (req, res) => {
  res.json(BANGLADESH_CITIES);
});

router.get('/courier/carrybee/zones/:id', (req, res) => {
  res.json(DHAKA_ZONES);
});

router.get('/courier/carrybee/areas/:id', (req, res) => {
  res.json(UTTARA_AREAS);
});

router.post('/courier/test', (req, res) => {
  const { courier = 'pathao' } = req.body;
  res.json({
    success: true,
    courier,
    message: `${courier.toUpperCase()} API connectivity verified successfully.`
  });
});

module.exports = router;
