import React from 'react';
import ProductCard, { Product } from '../../components/ProductCard';
import db from '../../src/db/database';
import { Filter, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface ShopProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

async function getFilteredProducts(category?: string, search?: string, sort?: string): Promise<Product[]> {
  try {
    let sql = `
      SELECT p.*, c.name as categoryName, c.slug as categorySlug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active'
    `;
    const params: any[] = [];

    if (category) {
      sql += ' AND c.slug = ?';
      params.push(category);
    }
    if (search) {
      sql += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (sort === 'price-asc') {
      sql += ' ORDER BY COALESCE(p.sale_price, p.price) ASC';
    } else if (sort === 'price-desc') {
      sql += ' ORDER BY COALESCE(p.sale_price, p.price) DESC';
    } else {
      sql += ' ORDER BY p.id DESC';
    }

    const rows = db.all(sql, params);

    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      price: r.price,
      salePrice: r.sale_price,
      image: r.image,
      rating: r.rating || 5.0,
      reviewCount: r.review_count || 10,
      categoryName: r.categoryName,
      stock: r.stock
    }));
  } catch (err) {
    console.error('Error in getFilteredProducts:', err);
    return [];
  }
}

export default async function ShopPage({ searchParams }: ShopProps) {
  const params = await searchParams;
  const category = params.category;
  const search = params.search;
  const sort = params.sort;

  const products = await getFilteredProducts(category, search, sort);

  const categories = [
    { name: 'All Products', slug: '' },
    { name: "Men's Fashion", slug: "men-s-fashion" },
    { name: "Woman's Fashion", slug: "woman-s-fashion" },
    { name: "Kid's Fashion", slug: "kid-s-fashion" },
    { name: "Smart Watch", slug: "smart-watch" },
    { name: "Electronics", slug: "electronic" },
    { name: "Beauty & Care", slug: "beauty-care" }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-100 pb-5">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          {category ? category.replace(/-/g, ' ').toUpperCase() : search ? `Search: "${search}"` : 'All Products Catalog'}
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Showing {products.length} products available for instant order with Cash on Delivery
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((c) => {
          const isActive = (c.slug === '' && !category) || category === c.slug;
          return (
            <Link
              key={c.slug}
              href={c.slug ? `/shop?category=${c.slug}` : '/shop'}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#0f6b4a] text-white shadow-sm'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {c.name}
            </Link>
          );
        })}
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100 space-y-3">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-700">No products found</h3>
          <p className="text-xs text-gray-400">Try changing your filters or search keywords.</p>
          <Link
            href="/shop"
            className="inline-block mt-2 px-5 py-2 bg-[#0f6b4a] text-white text-xs font-bold rounded-full"
          >
            Clear All Filters
          </Link>
        </div>
      )}
    </div>
  );
}
