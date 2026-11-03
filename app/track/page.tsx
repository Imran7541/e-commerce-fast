'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Package, Clock, Truck, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrderNumber = searchParams.get('orderNumber') || '';

  const [query, setQuery] = useState(initialOrderNumber);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const fetchOrders = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const isPhone = /^[0-9+]+$/.test(searchTerm.trim()) && searchTerm.trim().length >= 10;
      const url = isPhone
        ? `/api/orders/track?phone=${encodeURIComponent(searchTerm.trim())}`
        : `/api/orders/track?orderNumber=${encodeURIComponent(searchTerm.trim())}`;

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok && data.success) {
        setOrders(data.orders || []);
      } else {
        setError(data.error || 'কোনো অর্ডার খুঁজে পাওয়া যায়নি');
        setOrders([]);
      }
    } catch {
      setError('অর্ডার ট্র্যাক করতে সমস্যা হয়েছে, সংযোগ পরীক্ষা করুন');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderNumber) {
      fetchOrders(initialOrderNumber);
    }
  }, [initialOrderNumber]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(query);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-xs uppercase font-extrabold text-[#0f6b4a] tracking-wider">
          Real-Time Tracking
        </span>
        <h1 className="text-3xl font-black text-gray-900">
          আপনার অর্ডার ট্র্যাক করুন
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
          আপনার অর্ডার নম্বর (যেমন: ORD-...) অথবা মোবাইল নম্বর লিখে বর্তমান স্থিতি জানুন
        </p>
      </div>

      {/* Search Input Form */}
      <form onSubmit={handleSearch} className="max-w-xl mx-auto flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="অর্ডার নম্বর বা ১১ ডিজিটের মোবাইল নম্বর"
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 focus:border-[#0f6b4a] focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3.5 rounded-2xl bg-[#0f6b4a] hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
        >
          {loading ? 'খোঁজা হচ্ছে...' : 'ট্র্যাক করুন'}
        </button>
      </form>

      {error && (
        <div className="max-w-xl mx-auto p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Orders Result List */}
      {searched && !loading && orders.length === 0 && !error && (
        <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 p-8 space-y-3 max-w-xl mx-auto">
          <Package className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">কোনো অর্ডার পাওয়া যায়নি</h3>
          <p className="text-xs text-gray-500">
            অনুগ্রহ করে আপনার সঠিক অর্ডার নম্বর অথবা অর্ডার করার সময় ব্যবহৃত মোবাইল নম্বরটি পরীক্ষা করুন।
          </p>
        </div>
      )}

      {orders.length > 0 && (
        <div className="space-y-6">
          {orders.map((o) => {
            const isDelivered = o.status === 'delivered';
            const isShipped = o.status === 'shipped';
            const isProcessing = o.status === 'processing';

            return (
              <div
                key={o.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6"
              >
                {/* Header Info */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div>
                    <span className="text-xs text-gray-400 font-bold">অর্ডার নম্বর</span>
                    <h3 className="text-lg font-black text-gray-900">{o.orderNumber}</h3>
                    <span className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString('bn-BD')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-black capitalize ${
                        isDelivered
                          ? 'bg-emerald-100 text-emerald-800'
                          : isShipped
                          ? 'bg-blue-100 text-blue-800'
                          : isProcessing
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {o.status === 'pending'
                        ? 'অপেক্ষমান (Pending)'
                        : o.status === 'processing'
                        ? 'প্রক্রিয়াধীন (Processing)'
                        : o.status === 'shipped'
                        ? 'কুরিয়ারে হস্তান্তর (Shipped)'
                        : o.status === 'delivered'
                        ? 'ডেলিভারি সম্পন্ন (Delivered)'
                        : o.status}
                    </span>
                  </div>
                </div>

                {/* Progress Visual Tracker */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs py-2">
                  <div className="space-y-1">
                    <div className="w-8 h-8 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
                      ✓
                    </div>
                    <span className="font-bold text-gray-800">অর্ডার গ্রহণ</span>
                  </div>

                  <div className="space-y-1">
                    <div
                      className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold ${
                        isProcessing || isShipped || isDelivered
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isProcessing || isShipped || isDelivered ? '✓' : '২'}
                    </div>
                    <span className="font-semibold text-gray-600">প্রক্রিয়াধীন</span>
                  </div>

                  <div className="space-y-1">
                    <div
                      className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold ${
                        isShipped || isDelivered
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isShipped || isDelivered ? '✓' : '৩'}
                    </div>
                    <span className="font-semibold text-gray-600">কুরিয়ারে</span>
                  </div>

                  <div className="space-y-1">
                    <div
                      className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold ${
                        isDelivered ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isDelivered ? '✓' : '৪'}
                    </div>
                    <span className="font-semibold text-gray-600">ডেলিভারড</span>
                  </div>
                </div>

                {/* Customer & Shipping Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/70 p-4 rounded-2xl text-xs">
                  <div>
                    <span className="font-bold text-gray-500 block">গ্রাহকের বিবরণ:</span>
                    <p className="font-bold text-gray-900 mt-1">{o.customerName}</p>
                    <p className="text-gray-600">{o.phone}</p>
                    <p className="text-gray-600">{o.address}, {o.district}</p>
                  </div>

                  <div>
                    <span className="font-bold text-gray-500 block">কুরিয়ার ও পেমেন্ট:</span>
                    <p className="text-gray-800 mt-1">পেমেন্ট মেথড: <span className="font-bold">ক্যাশ অন ডেলিভারি (COD)</span></p>
                    {o.courier && (
                      <p className="text-gray-800">
                        কুরিয়ার: <span className="font-bold text-[#0f6b4a]">{o.courier}</span>
                      </p>
                    )}
                    {o.courierTrackingCode && (
                      <p className="text-gray-800">
                        ট্র্যাকিং কোড: <span className="font-mono font-bold">{o.courierTrackingCode}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-700">অর্ডারের পণ্যসমূহ ({o.items?.length || 0}):</h4>
                  <div className="divide-y divide-gray-100">
                    {o.items?.map((item: any) => (
                      <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image || '/uploads/1790671329971_92b7da_imgi_9_4.jpg'}
                            alt={item.productName}
                            className="w-10 h-10 object-cover rounded-lg border border-gray-100"
                          />
                          <div>
                            <span className="font-bold text-gray-800 block">{item.productName}</span>
                            <span className="text-gray-400">পরিমাণ: {item.quantity}</span>
                          </div>
                        </div>
                        <span className="font-black text-gray-900">৳{item.totalPrice?.toLocaleString('en-US')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bill */}
                <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline text-sm font-black">
                  <span className="text-gray-800">মোট প্রদেয় বিল:</span>
                  <span className="text-xl text-[#0f6b4a]">৳{o.total?.toLocaleString('en-US')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-center pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-[#0f6b4a]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>হোম পেজে ফিরে যান</span>
        </Link>
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-gray-500">লোড হচ্ছে...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
