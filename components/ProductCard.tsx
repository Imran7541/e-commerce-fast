'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Star, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';

export interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  image?: string;
  rating?: number;
  reviewCount?: number;
  categoryName?: string;
  stock?: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (p: Product) => void;
  onBuyNow?: (p: Product) => void;
}

export default function ProductCard({ product, onAddToCart, onBuyNow }: ProductCardProps) {
  const { addToCart } = useCart();
  const price = product.price;
  const salePrice = product.salePrice;
  const currentPrice = salePrice || price;
  const discountPercent = salePrice && price > salePrice 
    ? Math.round(((price - salePrice) / price) * 100) 
    : 0;

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
      {/* Product Image Thumbnail */}
      <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
        {discountPercent > 0 && (
          <span className="absolute top-2.5 left-2.5 z-10 px-2 py-1 bg-rose-600 text-white text-[10px] font-black rounded-lg shadow-sm">
            {discountPercent}% OFF
          </span>
        )}

        <Link href={`/product/${product.slug}`} className="block w-full h-full">
          <img
            src={product.image || '/uploads/1790671329971_92b7da_imgi_9_4.jpg'}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </Link>
      </div>

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {product.categoryName && (
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              {product.categoryName}
            </span>
          )}
          
          <Link href={`/product/${product.slug}`}>
            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#0f6b4a] transition-colors line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-1 text-amber-500">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span className="text-xs font-bold text-gray-800">{product.rating || '5.0'}</span>
            <span className="text-[10px] text-gray-400">({product.reviewCount || 12})</span>
          </div>
        </div>

        {/* Pricing & Actions */}
        <div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-base sm:text-lg font-black text-[#0f6b4a]">
              ৳{currentPrice.toLocaleString('en-BD')}
            </span>
            {salePrice && salePrice < price && (
              <span className="text-xs text-gray-400 line-through">
                ৳{price.toLocaleString('en-BD')}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                if (onAddToCart) {
                  onAddToCart(product);
                } else {
                  addToCart({
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: product.price,
                    salePrice: product.salePrice,
                    image: product.image || '/uploads/1790671329971_92b7da_imgi_9_4.jpg',
                  });
                }
              }}
              className="w-full py-2 px-2 border border-[#0f6b4a] text-[#0f6b4a] hover:bg-emerald-50 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Cart</span>
            </button>

            <Link
              href={`/checkout?productId=${product.id}`}
              className="w-full py-2 px-2 bg-[#0f6b4a] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition-colors text-center"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Order</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
