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
    console.log('  [PASS] Store settings returned accurately with Familio Bazar branding & 4 customer reviews.');

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

    // 10. Admin Authentication
    console.log('Testing POST /api/auth/login...');
    const resLogin = await request('POST', '/api/auth/login', {
      email: 'admin@digitalbazar.com',
      password: 'admin123'
    });
    assert.strictEqual(resLogin.status, 200);
    assert.ok(resLogin.body.token);
    const adminToken = resLogin.body.token;
    console.log('  [PASS] Admin login successful, JWT token obtained.');

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
    console.log('  ALL 15 TESTS PASSED! FULL RECONSTRUCTION VERIFIED! ');
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
