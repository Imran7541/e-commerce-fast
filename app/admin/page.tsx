import React from 'react';
import Link from 'next/link';
import db from '../../src/db/database';
import { 
  Package, 
  ShoppingBag, 
  TrendingUp, 
  AlertTriangle, 
  Layers, 
  ExternalLink, 
  Users, 
  Clock, 
  CheckCircle2, 
  Truck
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function getAdminStats() {
  try {
    const productsCount = db.get(`SELECT COUNT(*) as count, SUM(stock) as totalStock FROM products`) as any;
    const lowStockCount = db.get(`SELECT COUNT(*) as count FROM products WHERE stock < 10`) as any;
    const ordersCount = db.get(`SELECT COUNT(*) as count, SUM(total) as revenue FROM orders`) as any;
    const recentOrders = db.all(`SELECT * FROM orders ORDER BY id DESC LIMIT 8`) as any[];

    return {
      totalProducts: productsCount?.count || 0,
      totalStock: productsCount?.totalStock || 0,
      lowStockProducts: lowStockCount?.count || 0,
      totalOrders: ordersCount?.count || 0,
      totalRevenue: ordersCount?.revenue || 0,
      recentOrders: recentOrders || []
    };
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    return {
      totalProducts: 0,
      totalStock: 0,
      lowStockProducts: 0,
      totalOrders: 0,
      totalRevenue: 0,
      recentOrders: []
    };
  }
}

export default async function AdminDashboardPage() {
  const stats = getAdminStats();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <span className="text-xs uppercase font-extrabold text-[#0f6b4a] tracking-wider">
            Control Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            অ্যাডমিন ড্যাশবোর্ড ও ম্যানেজমেন্ট
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            রিয়েল-টাইম অর্ডার স্থিতি, ইনভেন্টরি স্টক নিয়ন্ত্রণ ও ব্যবসার ওভারভিউ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/inventory"
            className="px-4 py-2.5 rounded-2xl bg-[#0f6b4a] hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2"
          >
            <Layers className="w-4 h-4" />
            <span>স্টক ম্যানেজমেন্ট</span>
          </Link>
          <Link
            href="/"
            target="_blank"
            className="px-4 py-2.5 rounded-2xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span>লাইভ শপ</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </Link>
        </div>
      </div>

      {/* 4 Core Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">মোট বিক্রয় (Revenue)</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-gray-900">
            ৳{stats.totalRevenue.toLocaleString('en-US')}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold block">
            ক্যাশ অন ডেলিভারি ও অনলাইন
          </span>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">সর্বমোট অর্ডার</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-gray-900">
            {stats.totalOrders}
          </div>
          <span className="text-[11px] text-blue-600 font-semibold block">
            ওয়েবসাইট ও ল্যান্ডিং পেজ
          </span>
        </div>

        {/* Total Products */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">মোট সক্রিয় পণ্য</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-gray-900">
            {stats.totalProducts} <span className="text-xs font-normal text-gray-400">টি</span>
          </div>
          <span className="text-[11px] text-purple-600 font-semibold block">
            সর্বমোট স্টক: {stats.totalStock} পিস
          </span>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">লো-স্টক সতর্কতা</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-600">
            {stats.lowStockProducts} <span className="text-xs font-normal text-gray-400">টি পণ্য</span>
          </div>
          <Link
            href="/admin/inventory"
            className="text-[11px] font-bold text-[#0f6b4a] hover:underline block"
          >
            স্টক রিফিল করুন →
          </Link>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-gray-900">সাম্প্রতিক অর্ডারসমূহ</h2>
            <p className="text-xs text-gray-500">সর্বশেষ গ্রাহক অর্ডার ও ডেলিভারি অগ্রগতি</p>
          </div>
          <Link
            href="/track"
            className="text-xs font-bold text-[#0f6b4a] hover:underline"
          >
            অর্ডার ট্র্যাকিং পেজ →
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="text-center py-12 text-xs text-gray-400">
            এখনও কোনো অর্ডার আসেনি।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">অর্ডার নং</th>
                  <th className="py-3 px-4">গ্রাহকের নাম ও ফোন</th>
                  <th className="py-3 px-4">জেলা / এলাকা</th>
                  <th className="py-3 px-4">মোট বিল</th>
                  <th className="py-3 px-4">পেমেন্ট</th>
                  <th className="py-3 px-4">অবস্থা</th>
                  <th className="py-3 px-4 rounded-r-xl text-right">তারিখ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-black text-[#0f6b4a]">
                      {o.order_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-gray-900 block">{o.customer_name}</span>
                      <span className="text-gray-500 font-mono text-[11px]">{o.phone}</span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-700">
                      {o.district}
                    </td>
                    <td className="py-3.5 px-4 font-black text-gray-900">
                      ৳{Number(o.total).toLocaleString('en-US')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px]">
                        COD
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[10px] capitalize ${
                          o.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : o.status === 'shipped'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-gray-400 text-[11px]">
                      {new Date(o.created_at).toLocaleDateString('bn-BD')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
