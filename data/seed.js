const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const db = require('../src/db/database');

const dataDir = path.join(__dirname, 'extracted_backend_data');

function readJson(filename) {
  const filepath = path.join(dataDir, filename);
  if (!fs.existsSync(filepath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch (err) {
    console.error(`Error parsing ${filename}:`, err);
    return null;
  }
}

// Convert undefined to null for SQLite bindings
function sanitizeParams(params) {
  return params.map(p => (p === undefined ? null : p));
}

function runSafe(stmt, ...params) {
  return stmt.run(...sanitizeParams(params));
}

async function seed() {
  console.log('--- Starting Database Seeder ---');
  db.exec('PRAGMA foreign_keys = OFF;');

  // 1. Seed Settings
  const settings = readJson('settings.json');
  if (settings && typeof settings === 'object') {
    console.log('Seeding store settings...');
    const insertSetting = db.db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);
    for (const [key, val] of Object.entries(settings)) {
      runSafe(insertSetting, key, JSON.stringify(val));
    }
    console.log(`  [+] Seeded ${Object.keys(settings).length} settings keys.`);
  }

  // 2. Seed Categories
  const categories = readJson('categories.json');
  if (Array.isArray(categories)) {
    console.log('Seeding categories...');
    const insertCat = db.db.prepare(`
      INSERT OR REPLACE INTO categories (id, name, slug, parent_id, image, icon, banner, sort_order, is_featured, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    function insertCategoryRecursive(cat, parentId = null) {
      runSafe(
        insertCat,
        cat.id,
        cat.name || '',
        cat.slug || `cat-${cat.id}`,
        parentId,
        cat.image || null,
        cat.icon || null,
        cat.banner || null,
        cat.sortOrder || cat.sort_order || 0,
        cat.isFeatured ? 1 : 0,
        cat.status || 'active'
      );
      if (Array.isArray(cat.children)) {
        for (const child of cat.children) {
          insertCategoryRecursive(child, cat.id);
        }
      }
    }

    for (const cat of categories) {
      insertCategoryRecursive(cat);
    }
    console.log(`  [+] Seeded categories hierarchy.`);
  }

  // 3. Seed Banners
  const banners = readJson('banners.json');
  if (Array.isArray(banners)) {
    console.log('Seeding promotional banners...');
    const insertBanner = db.db.prepare(`
      INSERT OR REPLACE INTO banners (id, title, subtitle, image_url, link_url, position, sort_order, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const b of banners) {
      runSafe(
        insertBanner,
        b.id,
        b.title || '',
        b.subtitle || '',
        b.imageUrl || b.image_url || '',
        b.linkUrl || b.link_url || '',
        b.position || 'home_hero',
        b.sortOrder || b.sort_order || 0,
        b.status || 'active'
      );
    }
    console.log(`  [+] Seeded ${banners.length} banners.`);
  }

  // 4. Seed Generics & Brands
  const generics = readJson('generics.json');
  if (Array.isArray(generics)) {
    const insertGen = db.db.prepare(`
      INSERT OR REPLACE INTO generics (id, name, slug, description, status)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const g of generics) {
      runSafe(
        insertGen,
        g.id,
        g.name,
        g.slug || `generic-${g.id}`,
        g.description || '',
        g.status || 'active'
      );
    }
  }

  const brands = readJson('brands.json');
  if (Array.isArray(brands)) {
    const insertBrand = db.db.prepare(`
      INSERT OR REPLACE INTO brands (id, name, slug, logo, website, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const br of brands) {
      runSafe(
        insertBrand,
        br.id,
        br.name,
        br.slug || `brand-${br.id}`,
        br.logo || null,
        br.website || '',
        br.status || 'active'
      );
    }
  }

  // 5. Seed Products & Variations
  const products = readJson('products_summary.json');
  const productDetails = readJson('products_details.json') || {};

  if (Array.isArray(products)) {
    console.log(`Seeding ${products.length} products...`);
    const insertProduct = db.db.prepare(`
      INSERT OR REPLACE INTO products (
        id, name, generic_name, slug, sku, barcode, category_id, brand_id,
        description, short_description, price, sale_price, stock, low_stock_threshold,
        unit, dosage, requires_prescription, batch_number, expiry_date,
        featured, is_flash_sale, is_best_seller, is_new_arrival, rating, review_count,
        image, images, has_variations, video_url, size_guide_id, free_shipping,
        shipping_charges, option_display, highlights, how_to_use, seo_title,
        seo_description, seo_image, tags, status, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `);

    const insertVariation = db.db.prepare(`
      INSERT OR REPLACE INTO product_variations (
        id, product_id, name, sku, price, sale_price, stock, image, attribute_values
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of products) {
      const pid = p.id;
      const detail = productDetails[String(pid)]?.product || p;

      runSafe(
        insertProduct,
        p.id,
        p.name || 'Product',
        p.genericName || null,
        p.slug || `prod-${p.id}`,
        p.sku || `SKU-${p.id}`,
        p.barcode || null,
        p.categoryId || null,
        p.brandId || null,
        detail.description || p.description || '',
        detail.shortDescription || p.shortDescription || '',
        parseFloat(p.price) || 0,
        p.salePrice ? parseFloat(p.salePrice) : null,
        p.stock !== undefined ? p.stock : 100,
        p.lowStockThreshold || 5,
        p.unit || 'pcs',
        p.dosage || null,
        p.requiresPrescription ? 1 : 0,
        p.batchNumber || null,
        p.expiryDate || null,
        p.featured ? 1 : 0,
        p.isFlashSale ? 1 : 0,
        p.isBestSeller ? 1 : 0,
        p.isNewArrival ? 1 : 0,
        parseFloat(p.rating) || 5.0,
        p.reviewCount || 0,
        p.image || (Array.isArray(p.images) ? p.images[0] : null),
        JSON.stringify(p.images || []),
        p.hasVariations ? 1 : 0,
        p.videoUrl || null,
        p.sizeGuideId || null,
        p.freeShipping ? 1 : 0,
        parseFloat(p.shippingCharges) || 0,
        p.optionDisplay || 'dropdown',
        JSON.stringify(detail.highlights || p.highlights || []),
        detail.howToUse || p.howToUse || '',
        p.seoTitle || p.name,
        p.seoDescription || p.shortDescription || '',
        p.seoImage || p.image || null,
        JSON.stringify(p.tags || []),
        p.status || 'active',
        p.createdAt || new Date().toISOString()
      );

      // Check variations in productDetails
      const variations = productDetails[String(pid)]?.variations;
      if (Array.isArray(variations) && variations.length > 0) {
        let varStock = 0;
        for (const v of variations) {
          const vStock = v.stock !== undefined ? v.stock : 50;
          runSafe(
            insertVariation,
            v.id,
            p.id,
            v.name || v.label || '',
            v.sku || `${p.sku}-VAR-${v.id}`,
            parseFloat(v.price) || p.price,
            v.salePrice ? parseFloat(v.salePrice) : null,
            vStock,
            v.image || null,
            JSON.stringify(v.combination || v.attributeValues || v.attributes || {})
          );
          varStock += vStock;
        }
        db.db.prepare('UPDATE products SET has_variations = 1, stock = ? WHERE id = ?').run(varStock, p.id);
      }
    }
    console.log(`  [+] Seeded ${products.length} products with variation data.`);
  }

  // 6. Seed Blog Posts
  const blogPosts = readJson('blog_posts.json');
  if (Array.isArray(blogPosts)) {
    console.log(`Seeding ${blogPosts.length} blog posts...`);
    const insertBlog = db.db.prepare(`
      INSERT OR REPLACE INTO blog_posts (
        id, title, slug, excerpt, content, cover_image, author, category, tags, views, is_published, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const post of blogPosts) {
      const p = post.post || post;
      runSafe(
        insertBlog,
        p.id,
        p.title,
        p.slug,
        p.excerpt || '',
        p.content || '',
        p.coverImage || p.cover_image || null,
        p.author || 'Digital Bazar Team',
        p.category || null,
        JSON.stringify(p.tags || []),
        p.views || 0,
        p.isPublished !== undefined ? (p.isPublished ? 1 : 0) : 1,
        p.createdAt || new Date().toISOString()
      );
    }
    console.log(`  [+] Seeded blog posts.`);
  }

  // 7. Seed Landing Pages
  const landingPages = readJson('landing_pages.json');
  if (landingPages && typeof landingPages === 'object') {
    console.log('Seeding landing pages...');
    const insertLp = db.db.prepare(`
      INSERT OR REPLACE INTO landing_pages (id, title, slug, template, status, content, views, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const [slug, item] of Object.entries(landingPages)) {
      const page = item.page || item;
      runSafe(
        insertLp,
        page.id,
        page.title || slug,
        page.slug || slug,
        page.template || 'fashion',
        page.status || 'active',
        JSON.stringify(page.content || {}),
        page.views || 0,
        page.createdAt || new Date().toISOString()
      );
    }
    console.log(`  [+] Seeded landing pages.`);
  }

  // 8. Seed Default Admin User & Sample Staff
  console.log('Seeding administrative users...');
  const salt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync('admin123', salt);
  const staffPasswordHash = bcrypt.hashSync('staff123', salt);

  const insertUser = db.db.prepare(`
    INSERT OR REPLACE INTO users (id, name, email, phone, password_hash, role, permissions, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  runSafe(
    insertUser,
    1,
    'Imran (Super Admin)',
    'imrandt2001@gmail.com',
    '01787877362',
    adminPasswordHash,
    'super_admin',
    JSON.stringify(['all']),
    'active'
  );

  runSafe(
    insertUser,
    2,
    'POS Cashier',
    'pos@digitalbazar.com',
    '01700000000',
    staffPasswordHash,
    'pos_operator',
    JSON.stringify(['pos_access', 'read_catalog']),
    'active'
  );
  console.log('  [+] Seeded default admin (imrandt2001@gmail.com / admin123).');

  // 9. Seed Sample Coupons
  console.log('Seeding promotional coupons...');
  const insertCoupon = db.db.prepare(`
    INSERT OR REPLACE INTO coupons (id, code, type, value, min_order_amount, max_discount, usage_limit, used_count, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  runSafe(insertCoupon, 1, 'WELCOME10', 'percentage', 10, 500, 200, 1000, 5, 'active');
  runSafe(insertCoupon, 2, 'EID50', 'fixed', 50, 1000, null, 500, 12, 'active');
  runSafe(insertCoupon, 3, 'FLAT100', 'fixed', 100, 1500, null, 200, 2, 'active');
  console.log('  [+] Seeded coupons: WELCOME10, EID50, FLAT100.');

  // 10. Seed Standard Product Attributes
  console.log('Seeding standard product attributes (Size, Color, Kids Size)...');
  const insertAttr = db.db.prepare(`
    INSERT OR REPLACE INTO product_attributes (id, name, values_json, created_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `);
  runSafe(insertAttr, 1, 'Size', JSON.stringify(['40', '42', '44', '46', 'M', 'L', 'XL', 'XXL']));
  runSafe(insertAttr, 2, 'Color', JSON.stringify(['White', 'Black', 'Navy Blue', 'Maroon', 'Sky Blue', 'Mint Green', 'Purple', 'Red']));
  runSafe(insertAttr, 3, 'Kids Size', JSON.stringify(['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-12Y']));
  console.log('  [+] Seeded product attributes.');

  db.exec('PRAGMA foreign_keys = ON;');
  console.log('--- Database Seeding Complete! ---');
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
