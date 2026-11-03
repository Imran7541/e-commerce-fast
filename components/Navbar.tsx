'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Search, 
  Heart, 
  User, 
  Phone, 
  Menu, 
  X, 
  Truck, 
  ShieldCheck, 
  ChevronDown 
} from 'lucide-react';

import { useCart } from '../context/CartContext';

interface NavbarProps {
  wishlistCount?: number;
}

export default function Navbar({ wishlistCount = 0 }: NavbarProps) {
  const { totalItems, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { name: "Men's Fashion", slug: "men-s-fashion" },
    { name: "Woman's Fashion", slug: "woman-s-fashion" },
    { name: "Kid's Fashion", slug: "kid-s-fashion" },
    { name: "Smart Watch", slug: "smart-watch" },
    { name: "Electronics", slug: "electronic" },
    { name: "Groceries", slug: "groceries" },
    { name: "Beauty & Care", slug: "beauty-care" }
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-gray-100">
      {/* Top Notification Bar */}
      <div className="bg-[#0f6b4a] text-white text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> Helpline: <a href="tel:01910476751" className="font-semibold underline">01910476751</a>
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" /> Fast Home Delivery (Cash on Delivery Available)
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/track" className="hover:underline">Track Order</Link>
            <span className="opacity-60">|</span>
            <Link href="/page/contact" className="hover:underline">Contact Us</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <button 
            className="lg:hidden p-1.5 text-gray-700 hover:text-black focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 to-emerald-500 flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
              DB
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-gray-900 block leading-tight">
                Digital<span className="text-[#0f6b4a]">Bazar</span>
              </span>
              <span className="text-[10px] text-gray-500 tracking-wider font-medium uppercase block">
                Fast E-Commerce
              </span>
            </div>
          </Link>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex flex-1 max-w-xl mx-4">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
              }
            }}
            className="w-full relative"
          >
            <input 
              type="text" 
              placeholder="Search products, brands, or categories..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2.5 pl-10 pr-24 rounded-full border border-gray-200 focus:border-[#0f6b4a] focus:ring-2 focus:ring-emerald-100 text-sm outline-none transition-all"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <button 
              type="submit" 
              className="absolute right-1 top-1 bottom-1 px-5 rounded-full bg-[#0f6b4a] hover:bg-emerald-800 text-white text-xs font-semibold transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Actions (Wishlist, Account, Cart) */}
        <div className="flex items-center gap-3">
          <Link 
            href="/account" 
            className="hidden sm:flex items-center gap-1.5 p-2 text-gray-700 hover:text-[#0f6b4a] transition-colors rounded-lg hover:bg-gray-50"
          >
            <User className="w-5 h-5 text-gray-600" />
            <span className="text-xs font-medium">Account</span>
          </Link>

          <Link 
            href="/wishlist" 
            className="relative p-2 text-gray-700 hover:text-rose-600 transition-colors rounded-lg hover:bg-gray-50"
            title="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>

          <button 
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 bg-[#0f6b4a] hover:bg-emerald-800 text-white py-2 px-3.5 rounded-full shadow-sm hover:shadow transition-all"
            aria-label="Open Cart"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-amber-400 text-gray-900 rounded-full w-4 h-4 text-[10px] font-extrabold flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="text-xs font-bold hidden sm:inline">Cart</span>
          </button>
        </div>
      </div>

      {/* Category Navigation Bar */}
      <nav className="hidden lg:block bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs font-medium text-gray-700">
          <div className="flex items-center space-x-6 overflow-x-auto py-2.5">
            <Link href="/shop" className="text-[#0f6b4a] font-bold hover:underline flex items-center gap-1">
              All Products
            </Link>
            {categories.map((c) => (
              <Link 
                key={c.slug} 
                href={`/shop?category=${c.slug}`} 
                className="hover:text-[#0f6b4a] transition-colors whitespace-nowrap"
              >
                {c.name}
              </Link>
            ))}
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/offers" className="text-rose-600 font-bold hover:underline">
              🔥 Offers
            </Link>
            <Link href="/blog" className="hover:text-[#0f6b4a]">
              Blog
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 px-4 py-4 space-y-3 shadow-lg">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
              }
            }}
            className="w-full relative mb-3"
          >
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 pl-9 pr-4 rounded-lg border border-gray-200 text-sm outline-none"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </form>

          <div className="border-t pt-2 space-y-2">
            <Link href="/shop" className="block text-sm font-bold text-[#0f6b4a] py-1">
              🛍️ All Products
            </Link>
            <Link href="/offers" className="block text-sm font-bold text-rose-600 py-1">
              🔥 Special Offers
            </Link>
            {categories.map((c) => (
              <Link 
                key={c.slug} 
                href={`/shop?category=${c.slug}`} 
                className="block text-sm text-gray-600 hover:text-[#0f6b4a] py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                {c.name}
              </Link>
            ))}
            <Link href="/blog" className="block text-sm text-gray-600 py-1">
              Blog Articles
            </Link>
            <Link href="/track" className="block text-sm text-gray-600 py-1">
              Track My Order
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
