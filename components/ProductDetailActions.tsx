'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';
import { Zap, ShoppingBag, Plus, Minus, Truck, ShieldCheck, Check } from 'lucide-react';

interface ProductDetailActionsProps {
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    salePrice?: number | null;
    image?: string;
    stock?: number;
  };
}

export default function ProductDetailActions({ product }: ProductDetailActionsProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        salePrice: product.salePrice,
        image: product.image || '/uploads/1790671329971_92b7da_imgi_9_4.jpg',
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleOrderNow = () => {
    addToCart(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        salePrice: product.salePrice,
        image: product.image || '/uploads/1790671329971_92b7da_imgi_9_4.jpg',
      },
      quantity
    );
    router.push('/checkout');
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Quantity Stepper */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-gray-700">পরিমাণ:</span>
        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="p-2 hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="px-4 py-1 text-sm font-black text-gray-900 min-w-[2rem] text-center">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="p-2 hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Buttons */}
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={handleOrderNow}
          className="w-full py-4 rounded-2xl bg-[#0f6b4a] hover:bg-emerald-800 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
        >
          <Zap className="w-5 h-5 fill-current" />
          <span>অর্ডার করুন (ক্যাশ অন ডেলিভারি)</span>
        </button>

        <button
          type="button"
          onClick={handleAddToCart}
          className="w-full py-3.5 rounded-2xl border-2 border-[#0f6b4a] text-[#0f6b4a] hover:bg-emerald-50 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
        >
          {added ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">কার্টে যোগ করা হয়েছে!</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              <span>কার্টে যোগ করুন (Add to Cart)</span>
            </>
          )}
        </button>
      </div>

      {/* Guarantees */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#0f6b4a]" />
          <span>সারা বাংলাদেশে দ্রুত হোম ডেলিভারি</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#0f6b4a]" />
          <span>পণ্য দেখে মূল্য পরিশোধ করুন</span>
        </div>
      </div>
    </div>
  );
}
