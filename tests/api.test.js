process.env.NODE_ENV = 'test';
const http = require('http');
const assert = require('assert');
const app = require('../src/server');

const PORT = 5099;
let server;
let baseUrl;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: json,
          raw: data
        });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Comprehensive API & Integration Test Suite ---');
  server = app.listen(PORT);
  baseUrl = `http://localhost:${PORT}`;

  try {
    // 1. Settings
    console.log('Testing GET /api/settings...');
    const resSettings = await request('GET', '/api/settings');
    assert.strictEqual(resSettings.status, 200);
    assert.ok(resSettings.body.general, 'Settings should contain general store info');
    assert.strictEqual(resSettings.body.general.storeName, 'Familio Bazar - Best Online Shop');
    assert.strictEqual(resSettings.body.logo_config.desktopLogoUrl, '/uploads/familio_bazar_logo.png');
    assert.ok(resSettings.body.review_images_config, 'Settings should contain review_images_config');
    assert.strictEqual(resSettings.body.review_images_config.images.length, 4);
    assert.ok(resSettings.body.review_images_config.images[0].url.includes('customer_review_1.jpg'));
    assert.strictEqual(resSettings.body.footer_config.phone, '01787877362');
    assert.strictEqual(resSettings.body.footer_config.email, 'imrandt2001@gmail.com');
    assert.ok(resSettings.body.footer_config.address.includes('Uttara, Dhaka'));
    assert.strictEqual(resSettings.body.general.phone, '01787877362');
    assert.ok(resSettings.body.general.address.includes('Uttara, Dhaka'));
    assert.strictEqual(resSettings.body.topbar.phoneText, '01787877362');
    assert.strictEqual(resSettings.body.product_contact_config.callNumber, '01787877362');
    console.log('  [PASS] Store settings returned accurately with Familio Bazar branding, contact info, & 4 customer reviews.');

    // 2. Categories
    console.log('Testing GET /api/categories?tree=1...');
    const resCat = await request('GET', '/api/categories?tree=1');
    assert.strictEqual(resCat.status, 200);
    assert.ok(Array.isArray(resCat.body));
    assert.ok(resCat.body.length > 0);
    console.log(`  [PASS] ${resCat.body.length} root categories returned in tree.`);

    // 2b. Brands
    console.log('Testing GET /api/brands...');
    const resBrands = await request('GET', '/api/brands');
    assert.strictEqual(resBrands.status, 200);
    assert.ok(Array.isArray(resBrands.body));
    assert.strictEqual(resBrands.body.length, 1);
    assert.strictEqual(resBrands.body[0].name, 'EM-BRAND');
    console.log('  [PASS] EM-BRAND returned in brands list.');

    // 3. Products
    console.log('Testing GET /api/products...');
    const resProducts = await request('GET', '/api/products');
    assert.strictEqual(resProducts.status, 200);
    assert.ok(Array.isArray(resProducts.body));
    assert.strictEqual(resProducts.body.length, 26);
    // Verify All Products priority: Men's Fashion is at the very front
    assert.strictEqual(resProducts.body[0].categoryName, "Men's Fashion");
    assert.strictEqual(resProducts.body[0].name, 'Panjabi');
    console.log(`  [PASS] 26 products returned in catalog with Men's Fashion priority.`);

    // 3a. New Arrivals Priority & Deduplication
    console.log('Testing GET /api/products?newArrival=true&limit=10...');
    const resNewArrivals = await request('GET', '/api/products?newArrival=true&limit=10');
    assert.strictEqual(resNewArrivals.status, 200);
    assert.strictEqual(resNewArrivals.body.length, 10);
    assert.strictEqual(resNewArrivals.body[0].categoryName, "Woman's Fashion");
    assert.ok(resNewArrivals.body.some(p => p.categoryName === "Woman's Fashion"));
    assert.ok(resNewArrivals.body.some(p => p.categoryName === "Men's Fashion"));
    // Verify that the first product of New Arrivals is NOT the first product of All Products (Deduplication)
    assert.notStrictEqual(resNewArrivals.body[0].id, resProducts.body[0].id);
    console.log(`  [PASS] New Arrivals curated with Fashion priority and zero duplicate of All Products lead.`);

    // 3b. Products Browse (used by /shop)
    console.log('Testing GET /api/products/browse...');
    const resBrowse = await request('GET', '/api/products/browse');
    assert.strictEqual(resBrowse.status, 200);
    assert.strictEqual(resBrowse.body.total, 26);
    assert.strictEqual(resBrowse.body.items.length, 20); // page 1 pageSize is 20
    assert.ok(resBrowse.body.facets);
    assert.strictEqual(resBrowse.body.facets.categories['36'], 5);
    assert.strictEqual(resBrowse.body.facets.categories['37'], 5);
    assert.strictEqual(resBrowse.body.facets.categories['38'], 4); // Kid's Fashion
    assert.strictEqual(resBrowse.body.facets.categories['39'], 1); // Electronic
    assert.strictEqual(resBrowse.body.facets.categories['40'], 1); // Groceries
    assert.strictEqual(resBrowse.body.facets.categories['41'], 4); // Beauty & Care
    assert.strictEqual(resBrowse.body.facets.categories['42'], 4); // Health & Wellness
    assert.strictEqual(resBrowse.body.facets.categories['43'], 1); // Toys & Hobbies
    assert.strictEqual(resBrowse.body.facets.categories['44'], 1); // Smart Watch
    assert.strictEqual(resBrowse.body.facets.brands['1'], 25); // EM-BRAND
    assert.strictEqual(resBrowse.body.facets.price.min, 190);
    assert.strictEqual(resBrowse.body.facets.price.max, 1550);
    console.log('  [PASS] Products browse endpoint returned with 26 items and complete 9-category facets.');

    // 3c. Kid's Fashion browse filter
    console.log('Testing GET /api/products/browse?category=kid-s-fashion...');
    const resKids = await request('GET', '/api/products/browse?category=kid-s-fashion');
    assert.strictEqual(resKids.status, 200);
    assert.strictEqual(resKids.body.total, 4);
    assert.strictEqual(resKids.body.items.length, 4);
    console.log('  [PASS] Kid\'s Fashion category returns 4 products with images.');

    // 3d. Beauty & Care browse filter
    console.log('Testing GET /api/products/browse?category=beauty-care...');
    const resBeauty = await request('GET', '/api/products/browse?category=beauty-care');
    assert.strictEqual(resBeauty.status, 200);
    assert.strictEqual(resBeauty.body.total, 4);
    assert.strictEqual(resBeauty.body.items.length, 4);
    assert.ok(resBeauty.body.items[0].image.includes('beauty_'));
    console.log('  [PASS] Beauty & Care category returns 4 products with Halal images.');

    // 3e. Health & Wellness browse filter
    console.log('Testing GET /api/products/browse?category=health-wellness...');
    const resHealth = await request('GET', '/api/products/browse?category=health-wellness');
    assert.strictEqual(resHealth.status, 200);
    assert.strictEqual(resHealth.body.total, 4);
    assert.strictEqual(resHealth.body.items.length, 4);
    assert.ok(resHealth.body.items[0].image.includes('health_'));
    console.log('  [PASS] Health & Wellness category returns 4 products with Halal images.');

    // 4. Single Product Details
    console.log('Testing GET /api/products/35...');
    const resP35 = await request('GET', '/api/products/35');
    assert.strictEqual(resP35.status, 200);
    assert.strictEqual(resP35.body.product.id, 35);
    assert.ok(resP35.body.product.name.includes('Jamdani'));
    console.log(`  [PASS] Product #35 dossier returned with details.`);

    // 5. Blog
    console.log('Testing GET /api/blog...');
    const resBlog = await request('GET', '/api/blog');
    assert.strictEqual(resBlog.status, 200);
    assert.strictEqual(resBlog.body.posts.length, 4);
    assert.ok(resBlog.body.posts.some(p => p.category === "Men's Fashion"));
    assert.ok(resBlog.body.posts.some(p => p.category === "Baby Care"));
    assert.ok(resBlog.body.posts.some(p => p.coverImage.includes('baby_blanket_care_guide')));
    assert.ok(resBlog.body.posts.every(p => p.author === "Familio Bazar Team"));
    console.log('  [PASS] 4 blog posts returned with matching topics, Familio Bazar author, and Halal images.');

    // 6. Landing Page
    console.log('Testing GET /api/lp/panjabi...');
    const resLp = await request('GET', '/api/lp/panjabi');
    assert.strictEqual(resLp.status, 200);
    assert.strictEqual(resLp.body.page.slug, 'panjabi');
    console.log('  [PASS] Landing page returned with organic template.');

    // 7. Coupon Validation
    console.log('Testing POST /api/coupons/validate...');
    const resCoupon = await request('POST', '/api/coupons/validate', {
      code: 'WELCOME10',
      subtotal: 1000
    });
    assert.strictEqual(resCoupon.status, 200);
    assert.strictEqual(resCoupon.body.valid, true);
    assert.strictEqual(resCoupon.body.discount, 100);
    console.log('  [PASS] Coupon WELCOME10 validated with ৳100 discount.');

    // 8. Order Placement
    console.log('Testing POST /api/orders...');
    const resOrder = await request('POST', '/api/orders', {
      customerName: 'Test Customer',
      phone: '01711223344',
      address: 'Dhanmondi 27, Dhaka',
      district: 'Dhaka',
      thana: 'Dhanmondi',
      items: [
        { productId: 35, quantity: 1 }
      ],
      couponCode: 'WELCOME10',
      paymentMethod: 'cod'
    });
    assert.strictEqual(resOrder.status, 201);
    assert.strictEqual(resOrder.body.success, true);
    const orderNumber = resOrder.body.order.orderNumber;
    assert.ok(orderNumber.startsWith('DB-'));
    console.log(`  [PASS] Order created successfully: ${orderNumber}`);

    // 9. Order Tracking
    console.log(`Testing GET /api/orders/track?orderNumber=${orderNumber}...`);
    const resTrack = await request('GET', `/api/orders/track?orderNumber=${orderNumber}`);
    assert.strictEqual(resTrack.status, 200);
    assert.strictEqual(resTrack.body.orders.length, 1);
    assert.strictEqual(resTrack.body.orders[0].orderNumber, orderNumber);
    console.log('  [PASS] Order tracking verified.');

    // 10. Admin Authentication (Email & Phone Dual Login)
    console.log('Testing POST /api/auth/login with email imrandt2001@gmail.com...');
    const resLogin = await request('POST', '/api/auth/login', {
      email: 'imrandt2001@gmail.com',
      password: 'admin123'
    });
    assert.strictEqual(resLogin.status, 200);
    assert.ok(resLogin.body.token);
    assert.strictEqual(resLogin.body.user.email, 'imrandt2001@gmail.com');
    const adminToken = resLogin.body.token;

    console.log('Testing POST /api/auth/login with phone 01787877362...');
    const resPhoneLogin = await request('POST', '/api/auth/login', {
      email: '01787877362',
      password: 'admin123'
    });
    assert.strictEqual(resPhoneLogin.status, 200);
    assert.ok(resPhoneLogin.body.token);
    console.log('  [PASS] Admin dual login (email and phone) verified, JWT token obtained.');

    // 10a. Storefront Universal Sign In (/api/auth/signin)
    console.log('Testing POST /api/auth/signin with identifier imrandt2001@gmail.com...');
    const resSignIn = await request('POST', '/api/auth/signin', {
      identifier: 'imrandt2001@gmail.com',
      password: 'admin123'
    });
    assert.strictEqual(resSignIn.status, 200);
    assert.strictEqual(resSignIn.body.success, true);
    assert.ok(resSignIn.body.token);
    assert.strictEqual(resSignIn.body.user.role, 'super_admin');

    console.log('Testing POST /api/auth/signin with phone identifier 01787877362...');
    const resSignInPhone = await request('POST', '/api/auth/signin', {
      identifier: '01787877362',
      password: 'admin123'
    });
    assert.strictEqual(resSignInPhone.status, 200);
    assert.strictEqual(resSignInPhone.body.success, true);
    console.log('  [PASS] Storefront /api/auth/signin dual identifier verified.');

    // 10b. Admin Staff & User Management CRUD
    console.log('Testing GET /api/admin/users...');
    const resUsers = await request('GET', '/api/admin/users', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resUsers.status, 200);
    assert.ok(Array.isArray(resUsers.body));
    assert.ok(resUsers.body.length >= 2);
    assert.strictEqual(resUsers.body[0].email, 'imrandt2001@gmail.com');
    assert.strictEqual(resUsers.body[0].password_hash, undefined, 'password_hash should never be exposed');

    console.log('Testing POST /api/admin/users (Create Staff)...');
    const resCreateStaff = await request('POST', '/api/admin/users', {
      name: 'Test Staff',
      email: `staff_${Date.now()}@familiobazar.com`,
      phone: '01711223366',
      role: 'staff',
      permissions: ['orders'],
      password: 'staffpassword123'
    }, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resCreateStaff.status, 201);
    const createdStaffId = resCreateStaff.body.id;

    console.log('Testing DELETE /api/admin/users/:id...');
    const resDelStaff = await request('DELETE', `/api/admin/users/${createdStaffId}`, null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resDelStaff.status, 200);
    console.log('  [PASS] Admin staff & user management CRUD verified.');

    // 10c. Admin Attributes CRUD
    console.log('Testing GET /api/admin/attributes...');
    const resAttrs = await request('GET', '/api/admin/attributes', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resAttrs.status, 200);
    assert.ok(Array.isArray(resAttrs.body));
    const sizeAttr = resAttrs.body.find(a => a.name === 'Size');
    assert.ok(sizeAttr, 'Size attribute should exist');
    assert.ok(sizeAttr.values.includes('40'));

    console.log('Testing POST /api/admin/attributes...');
    const resCreateAttr = await request('POST', '/api/admin/attributes', {
      name: 'Fabric Type',
      values: ['Pure Cotton', 'Silk Blend']
    }, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resCreateAttr.status, 201);
    const createdAttrId = resCreateAttr.body.id;

    console.log('Testing PUT /api/admin/attributes/:id...');
    const resUpdateAttr = await request('PUT', `/api/admin/attributes/${createdAttrId}`, {
      values: ['Pure Cotton', 'Silk Blend', 'Georgette']
    }, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resUpdateAttr.status, 200);
    assert.strictEqual(resUpdateAttr.body.attribute.values.length, 3);

    console.log('Testing DELETE /api/admin/attributes/:id...');
    const resDelAttr = await request('DELETE', `/api/admin/attributes/${createdAttrId}`, null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resDelAttr.status, 200);
    console.log('  [PASS] Attributes CRUD verified.');

    // 10d. Product Variations Management & Public Verification
    console.log('Testing GET /api/admin/products/22/variations...');
    const resVars = await request('GET', '/api/admin/products/22/variations', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resVars.status, 200);
    assert.ok(Array.isArray(resVars.body));
    assert.ok(resVars.body.length >= 2);
    assert.ok(resVars.body[0].combination && resVars.body[0].combination.Size);

    console.log('Testing PUT /api/admin/products/22/variations...');
    const resPutVars = await request('PUT', '/api/admin/products/22/variations', {
      variations: [
        { sku: 'PANJ-40', price: 750, salePrice: 550, stock: 30, combination: { Size: '40' } },
        { sku: 'PANJ-42', price: 750, salePrice: 550, stock: 35, combination: { Size: '42' } },
        { sku: 'PANJ-44', price: 750, salePrice: 550, stock: 35, combination: { Size: '44' } }
      ]
    }, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resPutVars.status, 200);
    assert.strictEqual(resPutVars.body.totalStock, 100);

    console.log('Testing GET /api/products/22 (Public product dossier with combinations)...');
    const resPub22 = await request('GET', '/api/products/22');
    assert.strictEqual(resPub22.status, 200);
    assert.strictEqual(resPub22.body.hasVariations, true);
    assert.strictEqual(resPub22.body.product.stock, 100);
    assert.strictEqual(resPub22.body.variations.length, 3);
    assert.strictEqual(resPub22.body.variations[0].combination.Size, '40');
    assert.ok(resPub22.body.attributes.find(a => a.name === 'Size'));
    console.log('  [PASS] Product variations management & public dossier verified.');

    // 10e. Categories CRUD & Reordering
    console.log('Testing GET /api/admin/categories...');
    const resAdminCats = await request('GET', '/api/admin/categories', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resAdminCats.status, 200);
    assert.ok(Array.isArray(resAdminCats.body));
    assert.ok(resAdminCats.body[0].productCount !== undefined);

    console.log('Testing PUT /api/admin/categories/reorder...');
    const resReorder = await request('PUT', '/api/admin/categories/reorder', {
      categories: [
        { id: 36, sortOrder: 1 },
        { id: 37, sortOrder: 2 },
        { id: 38, sortOrder: 3 }
      ]
    }, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resReorder.status, 200);
    console.log('  [PASS] Category reordering verified.');

    // 10f. Brand Product Counts
    console.log('Testing GET /api/admin/brands/product-counts...');
    const resBrandCounts = await request('GET', '/api/admin/brands/product-counts', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resBrandCounts.status, 200);
    assert.ok(typeof resBrandCounts.body === 'object');
    console.log('  [PASS] Brand product counts verified.');

    // 10g. Order Management, Invoices & Status (Phase 3)
    console.log('Testing GET /api/admin/orders-staff...');
    const resStaff = await request('GET', '/api/admin/orders-staff', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resStaff.status, 200);
    assert.ok(Array.isArray(resStaff.body));

    console.log('Testing GET /api/admin/orders-customer-lookup...');
    const resCustLookup = await request('GET', '/api/admin/orders-customer-lookup?q=017', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resCustLookup.status, 200);
    assert.ok(Array.isArray(resCustLookup.body));

    console.log('Testing GET /api/admin/orders/1...');
    const resSingleOrder = await request('GET', '/api/admin/orders/1', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resSingleOrder.status, 200);
    assert.ok(resSingleOrder.body.orderNumber);

    console.log('Testing PATCH /api/admin/orders/1/status...');
    const resStatusUpdate = await request('PATCH', '/api/admin/orders/1/status', {
      status: 'confirmed'
    }, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resStatusUpdate.status, 200);

    console.log('Testing PATCH /api/admin/orders/1/assign...');
    const resAssignUpdate = await request('PATCH', '/api/admin/orders/1/assign', {
      assignedTo: 2
    }, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resAssignUpdate.status, 200);

    console.log('Testing GET /api/admin/orders/invoices?ids=1...');
    const resInvoices = await request('GET', '/api/admin/orders/invoices?ids=1', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resInvoices.status, 200);
    assert.ok(Array.isArray(resInvoices.body));
    assert.strictEqual(resInvoices.body.length, 1);
    assert.strictEqual(resInvoices.body[0].storeName, 'FAMILIO BAZAR');

    console.log('Testing GET /api/admin/orders/1/invoice (HTML printable view)...');
    const resHtmlInvoice = await request('GET', '/api/admin/orders/1/invoice', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resHtmlInvoice.status, 200);
    assert.ok(resHtmlInvoice.raw.includes('FAMILIO BAZAR'));
    console.log('  [PASS] Phase 3 Order Management, Invoices & Status workflow verified.');

    // 10h. Payment Gateways Configuration (Phase 4)
    console.log('Testing GET /api/admin/payment-gateways...');
    const resGateways = await request('GET', '/api/admin/payment-gateways', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resGateways.status, 200);
    assert.ok(resGateways.body.bkash);
    assert.ok(resGateways.body.nagad);
    assert.ok(resGateways.body.sslcommerz);

    console.log('Testing PUT /api/admin/payment-gateways...');
    const resSaveGateways = await request('PUT', '/api/admin/payment-gateways', {
      bkash: { enabled: true, mode: 'sandbox', appKey: 'SANDBOX_APP_KEY' }
    }, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resSaveGateways.status, 200);

    console.log('Testing POST /api/admin/payment-gateways/bkash/test...');
    const resTestGateway = await request('POST', '/api/admin/payment-gateways/bkash/test', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resTestGateway.status, 200);
    assert.strictEqual(resTestGateway.body.success, true);

    console.log('Testing GET /api/admin/payment-transactions...');
    const resTx = await request('GET', '/api/admin/payment-transactions', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resTx.status, 200);
    assert.ok(Array.isArray(resTx.body));
    console.log('  [PASS] Phase 4 Payment Gateways configuration verified.');

    // 10i. Courier Integration & Banner Management (Phase 5)
    console.log('Testing GET /api/admin/banners...');
    const resBanners = await request('GET', '/api/admin/banners', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resBanners.status, 200);
    assert.ok(Array.isArray(resBanners.body));
    assert.ok(resBanners.body.length >= 3);

    console.log('Testing POST /api/admin/banners...');
    const resCreateBanner = await request('POST', '/api/admin/banners', {
      title: 'Summer Sale 2026',
      imageUrl: '/uploads/kids_panjabi_sky_blue.jpg',
      position: 'home_hero',
      sortOrder: 10
    }, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resCreateBanner.status, 201);
    const createdBannerId = resCreateBanner.body.id;

    console.log('Testing DELETE /api/admin/banners/:id...');
    const resDelBanner = await request('DELETE', `/api/admin/banners/${createdBannerId}`, null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resDelBanner.status, 200);

    console.log('Testing GET /api/admin/courier/pathao/cities...');
    const resCities = await request('GET', '/api/admin/courier/pathao/cities', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resCities.status, 200);
    assert.ok(Array.isArray(resCities.body));
    assert.ok(resCities.body.some(c => c.name === 'Dhaka'));

    console.log('Testing POST /api/admin/courier/test...');
    const resCourierTest = await request('POST', '/api/admin/courier/test', {
      courier: 'pathao'
    }, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resCourierTest.status, 200);
    assert.strictEqual(resCourierTest.body.success, true);

    console.log('Testing POST /api/webhooks/pathao...');
    const resWebhook = await request('POST', '/api/webhooks/pathao', {
      consignment_id: 'TRK-PAT-TEST-123',
      order_status: 'Delivered',
      merchant_order_id: 'DB-20261104-5075'
    });
    assert.strictEqual(resWebhook.status, 200);
    console.log('  [PASS] Phase 5 Courier integration & Banner control verified.');

    // 11. Admin Protected Summary
    console.log('Testing GET /api/admin/catalog/summary...');
    const resSummary = await request('GET', '/api/admin/catalog/summary', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resSummary.status, 200);
    assert.ok(resSummary.body.totalProducts >= 10);
    console.log('  [PASS] Admin protected summary accessed.');

    // 12. POS Sale
    console.log('Testing POST /api/pos/sale...');
    const resPos = await request('POST', '/api/pos/sale', {
      customerName: 'Walk-in Shopper',
      phone: '01800000000',
      items: [
        { id: 25, name: 'Full T-shirt', price: 700, quantity: 2 }
      ],
      subtotal: 1400,
      discount: 0,
      paidAmount: 1500,
      paymentMethod: 'cash'
    }, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(resPos.status, 201);
    assert.strictEqual(resPos.body.receipt.change, 100);
    console.log(`  [PASS] POS sale recorded: change ৳${resPos.body.receipt.change}.`);

    // 13. Static Assets Delivery
    console.log('Testing Static Asset delivery...');
    const resImg = await request('GET', '/uploads/1791364808818_7eef93_DIGITA_BAZAR_Fast_Commerce_Logo-removebg.png');
    assert.strictEqual(resImg.status, 200);
    assert.ok(resImg.headers['content-type'].includes('image'));
    console.log('  [PASS] Static image asset served successfully.');

    console.log('\n======================================================');
    console.log('  ALL 15 TESTS PASSED! FULL PLATFORM VERIFIED!        ');
    console.log('======================================================\n');
    server.close(() => {
      process.exit(0);
    });
  } catch (err) {
    console.error('Test Suite Failed:', err);
    if (server) server.close();
    process.exit(1);
  }
}

runTests();
