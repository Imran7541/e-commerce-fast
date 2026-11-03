'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, subtotal, totalItems } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#0f6b4a]" />
              <h2 className="text-base font-black text-gray-900">
                আপনার কার্ট ({totalItems})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-[#0f6b4a] flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-gray-800">আপনার কার্ট খালি</h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  পছন্দের পণ্যটি নির্বাচন করে কার্টে যোগ করুন।
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#0f6b4a] text-white text-xs font-bold hover:bg-emerald-800 transition-colors"
                >
                  কেনাকাটা শুরু করুন
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const currentPrice = item.salePrice && item.salePrice < item.price ? item.salePrice : item.price;
                return (
                  <div
                    key={item.id}
                    className="flex gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm relative group"
                  >
                    <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                      <img
                        src={item.image || '/uploads/1790671329971_92b7da_imgi_9_4.jpg'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <Link
                            href={`/product/${item.slug}`}
                            onClick={() => setIsCartOpen(false)}
                            className="text-xs font-bold text-gray-800 hover:text-[#0f6b4a] line-clamp-2 leading-snug"
                          >
                            {item.name}
                          </Link>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-400 hover:text-rose-500 transition-colors p-1"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-xs font-extrabold text-[#0f6b4a] mt-1">
                          ৳{currentPrice.toLocaleString('en-BD')}
                        </div>
                      </div>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-gray-200 text-gray-600 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 py-0.5 text-xs font-bold text-gray-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-gray-200 text-gray-600 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="text-xs font-semibold text-gray-500 ml-auto">
                          মোট: ৳{(currentPrice * item.quantity).toLocaleString('en-BD')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-gray-100 bg-gray-50/70 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>সাবটোটাল</span>
                  <span className="font-bold text-gray-900">৳{subtotal.toLocaleString('en-BD')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>ডেলিভারি চার্জ</span>
                  <span className="text-emerald-700 font-medium">চেকআউটে নির্ধারিত হবে</span>
                </div>
                <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-200">
                  <span>মোট প্রদেয়</span>
                  <span className="text-[#0f6b4a] text-base">৳{subtotal.toLocaleString('en-BD')}</span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-3.5 rounded-2xl bg-[#0f6b4a] hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <span>অর্ডার সম্পূর্ণ করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                >
                  আরও কেনাকাটা করুন
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
