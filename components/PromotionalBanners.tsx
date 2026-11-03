import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Tag, Flame } from 'lucide-react';

export default function PromotionalBanners() {
  const categoryHighlights = [
    { title: "Men's Collection", tag: "NEW ARRIVALS", slug: "men-s-fashion", bg: "from-amber-600 to-amber-800", count: "12+ Items" },
    { title: "Women's Jamdani & Sarees", tag: "HOT SELLING", slug: "woman-s-fashion", bg: "from-rose-600 to-pink-800", count: "18+ Items" },
    { title: "Gadgets & Smart Watches", tag: "20% DISCOUNT", slug: "smart-watch", bg: "from-blue-600 to-indigo-800", count: "8+ Items" },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      {/* 3 Grid Promo Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {categoryHighlights.map((c, i) => (
          <Link
            key={i}
            href={`/shop?category=${c.slug}`}
            className={`group relative rounded-2xl p-6 bg-gradient-to-br ${c.bg} text-white shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden flex flex-col justify-between h-44`}
          >
            {/* Background pattern */}
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />

            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
                <Flame className="w-3 h-3 text-amber-300" />
                {c.tag}
              </span>
              <h3 className="text-xl font-extrabold leading-tight drop-shadow">
                {c.title}
              </h3>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/15">
              <span className="text-xs text-white/80 font-medium">{c.count}</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-white text-gray-900 px-3 py-1.5 rounded-full group-hover:bg-amber-300 transition-colors">
                Explore <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
