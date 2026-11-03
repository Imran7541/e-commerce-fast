import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Truck, ShieldCheck, Clock, RefreshCw } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-8 border-t border-gray-800">
      {/* Service Highlights / Guarantees */}
      <div className="max-w-7xl mx-auto px-4 pb-10 border-b border-gray-800">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-900/50 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Fast Nationwide Delivery</h4>
              <p className="text-xs text-gray-400">All 64 districts in Bangladesh</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-900/50 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">100% Authentic Quality</h4>
              <p className="text-xs text-gray-400">Inspected before dispatch</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-900/50 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Cash On Delivery</h4>
              <p className="text-xs text-gray-400">Pay after receiving package</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-900/50 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Hassle-Free Returns</h4>
              <p className="text-xs text-gray-400">Easy 7-day exchange policy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
        {/* Brand Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">
              DB
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Digital<span className="text-emerald-400">Bazar</span>
            </span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Leading online shopping destination in Bangladesh. Bringing you premium quality fashion, lifestyle goods, electronics and home essentials right to your doorstep.
          </p>
          <div className="space-y-2 text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>Helpline: <a href="tel:01910476751" className="text-white hover:underline">01910476751</a></span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Ali Hossen Super Market, 2nd Floor, Boro Bazar, Chuadanga</span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-semibold text-sm mb-4">Quick Links</h4>
          <ul className="space-y-2.5 text-xs text-gray-400">
            <li><Link href="/" className="hover:text-emerald-400 transition-colors">Home Page</Link></li>
            <li><Link href="/shop" className="hover:text-emerald-400 transition-colors">Shop All Products</Link></li>
            <li><Link href="/offers" className="hover:text-emerald-400 transition-colors">Special Offers & Deals</Link></li>
            <li><Link href="/track" className="hover:text-emerald-400 transition-colors">Track Your Order</Link></li>
            <li><Link href="/blog" className="hover:text-emerald-400 transition-colors">Blog & Updates</Link></li>
          </ul>
        </div>

        {/* Popular Categories */}
        <div>
          <h4 className="text-white font-semibold text-sm mb-4">Categories</h4>
          <ul className="space-y-2.5 text-xs text-gray-400">
            <li><Link href="/shop?category=men-s-fashion" className="hover:text-emerald-400 transition-colors">Men's Fashion & Panjabi</Link></li>
            <li><Link href="/shop?category=woman-s-fashion" className="hover:text-emerald-400 transition-colors">Women's Saree & Salwar</Link></li>
            <li><Link href="/shop?category=kid-s-fashion" className="hover:text-emerald-400 transition-colors">Kid's Clothing & Toys</Link></li>
            <li><Link href="/shop?category=smart-watch" className="hover:text-emerald-400 transition-colors">Smart Watches & Gadgets</Link></li>
            <li><Link href="/shop?category=electronic" className="hover:text-emerald-400 transition-colors">Electronics & Appliances</Link></li>
          </ul>
        </div>

        {/* Customer Care & Policies */}
        <div>
          <h4 className="text-white font-semibold text-sm mb-4">Customer Care</h4>
          <ul className="space-y-2.5 text-xs text-gray-400">
            <li><Link href="/page/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
            <li><Link href="/page/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
            <li><Link href="/page/shipping" className="hover:text-emerald-400 transition-colors">Shipping & Delivery</Link></li>
            <li><Link href="/page/returns" className="hover:text-emerald-400 transition-colors">Return & Refund Policy</Link></li>
            <li><Link href="/admin" className="hover:text-emerald-400 transition-colors">Staff / Admin Login</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar: Copyright & Payment Methods */}
      <div className="max-w-7xl mx-auto px-4 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <p>© {new Date().getFullYear()} Digital Bazar - Best Online Shop. All rights reserved.</p>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 font-medium">Payment Methods:</span>
          <span className="px-2 py-1 bg-gray-800 text-gray-300 rounded font-bold text-[10px]">CASH ON DELIVERY</span>
          <span className="px-2 py-1 bg-pink-900/60 text-pink-300 rounded font-bold text-[10px]">BKASH</span>
          <span className="px-2 py-1 bg-orange-900/60 text-orange-300 rounded font-bold text-[10px]">NAGAD</span>
        </div>
      </div>
    </footer>
  );
}
