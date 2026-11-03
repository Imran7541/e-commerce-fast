import React from 'react';
import Link from 'next/link';
import HeroSlider from '../components/HeroSlider';
import PromotionalBanners from '../components/PromotionalBanners';
import ProductCard, { Product } from '../components/ProductCard';
import db from '../src/db/database';
import { ArrowRight, Flame, Sparkles, ShieldCheck, HeartHandshake, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

function getHomeProducts(): Product[] {
  try {
    const rows = db.all(`
      SELECT p.*, c.name as categoryName
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active'
      ORDER BY p.id DESC
      LIMIT 12
    `);

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
    console.error('Error fetching home products:', err);
    return [];
  }
}

export default async function HomePage() {
  const products = getHomeProducts();

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Hero Carousel (Custom User Images) */}
      <HeroSlider />

      {/* 2. Promotional Highlights */}
      <PromotionalBanners />

      {/* 3. Featured / Best Selling Products */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-[#0f6b4a]">
                <Flame className="w-5 h-5 fill-current" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Trending & Best Selling Products
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Top requested styles with guaranteed fast delivery in Bangladesh
            </p>
          </div>

          <Link
            href="/shop"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-[#0f6b4a] hover:text-emerald-800 transition-colors"
          >
            View All Products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0f6b4a] text-white text-xs font-bold shadow-md"
          >
            Browse All Products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 4. Brand Trust & Customer Guarantee Banner */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-900 via-[#0f6b4a] to-teal-800 text-white p-8 md:p-12 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-bold uppercase tracking-wider inline-block">
              Why Shop With Digital Bazar?
            </span>
            <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Genuine Quality. Safe Delivery. 100% Satisfaction.
            </h3>
            <p className="text-sm text-emerald-100 leading-relaxed">
              We check every item before dispatch and ensure doorstep delivery across all 64 districts in Bangladesh. Pay easily with Cash On Delivery or bKash.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Open Parcel on Delivery</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Instant Customer Support</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Fast Exchange Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
