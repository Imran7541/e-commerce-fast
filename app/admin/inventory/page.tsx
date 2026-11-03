'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Layers, 
  Search, 
  Plus, 
  Minus, 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  Save,
  Package
} from 'lucide-react';

interface ProductInventory {
  id: number;
  name: string;
  slug: string;
  sku: string;
  price: number;
  salePrice: number | null;
  stock: number;
  status: string;
  image: string;
  categoryName: string;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<ProductInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/inventory');
      const data = await res.json();
      if (res.ok && data.products) {
        setProducts(data.products);
      }
    } catch {
      setMessage({ text: 'ইনভেন্টরি লোড করতে সমস্যা হয়েছে', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const updateStock = async (id: number, newStock: number) => {
    if (newStock < 0) return;
    setUpdatingId(id);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, stock: newStock })
      });
      const data = await res.json();

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p))
        );
        setMessage({ text: `পণ্যটির স্টক আপডেট করা হয়েছে: ${newStock} পিস`, type: 'success' });
      } else {
        setMessage({ text: data.error || 'স্টক আপডেট করতে ব্যর্থ হয়েছে', type: 'error' });
      }
    } catch {
      setMessage({ text: 'সার্ভার সংযোগ সমস্যা', type: 'error' });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (filter === 'low') return p.stock > 0 && p.stock < 10;
    if (filter === 'out') return p.stock === 0;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin"
              className="text-gray-400 hover:text-gray-700 transition-colors p-1 -ml-1 rounded-lg"
              title="Back to Admin"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="text-xs uppercase font-extrabold text-[#0f6b4a] tracking-wider">
              Stock & Inventory
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            স্টক ও ইনভেন্টরি ম্যানেজমেন্ট
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            পণ্য অনুযায়ী লাইভ স্টক হিসাব, দ্রুত পরিমাণ পরিবর্তন ও লো-স্টক সতর্কতা
          </p>
        </div>

        <button
          onClick={fetchInventory}
          className="px-4 py-2 rounded-2xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-all flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>রিফ্রেশ</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="পণ্য বা SKU দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#0f6b4a]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            সকল স্টক ({products.length})
          </button>
          <button
            onClick={() => setFilter('low')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === 'low'
                ? 'bg-amber-500 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            লো-স্টক (&lt;10) ({products.filter((p) => p.stock > 0 && p.stock < 10).length})
          </button>
          <button
            onClick={() => setFilter('out')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === 'out'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            স্টক আউট (0) ({products.filter((p) => p.stock === 0).length})
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-xs text-gray-400">ইনভেন্টরি তথ্য লোড হচ্ছে...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Package className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-xs font-bold text-gray-500">কোনো পণ্য পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">পণ্য</th>
                  <th className="py-3 px-4">ক্যাটাগরি</th>
                  <th className="py-3 px-4">মূল্য</th>
                  <th className="py-3 px-4">বর্তমান স্টক</th>
                  <th className="py-3 px-4">স্টক স্থিতি</th>
                  <th className="py-3 px-4 text-right">দ্রুত স্টক পরিবর্তন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p) => {
                  const isLow = p.stock > 0 && p.stock < 10;
                  const isOut = p.stock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image || '/uploads/1790671329971_92b7da_imgi_9_4.jpg'}
                            alt={p.name}
                            className="w-12 h-12 object-cover rounded-xl border border-gray-100 flex-shrink-0"
                          />
                          <div>
                            <Link
                              href={`/product/${p.slug}`}
                              target="_blank"
                              className="font-bold text-gray-900 hover:text-[#0f6b4a] block leading-snug line-clamp-1"
                            >
                              {p.name}
                            </Link>
                            <span className="text-[10px] text-gray-400 font-mono">
                              SKU: {p.sku || `PROD-${p.id}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-gray-600">
                        {p.categoryName || 'সাধারণ'}
                      </td>

                      <td className="py-3.5 px-4 font-black text-gray-900">
                        ৳{p.price?.toLocaleString('en-US')}
                        {p.salePrice && p.salePrice < p.price && (
                          <span className="text-[10px] text-rose-500 font-bold block">
                            সেল: ৳{p.salePrice?.toLocaleString('en-US')}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-sm font-black text-gray-900">
                          {p.stock}
                        </span>{' '}
                        <span className="text-[10px] text-gray-400">পিস</span>
                      </td>

                      <td className="py-3.5 px-4">
                        {isOut ? (
                          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-black text-[10px]">
                            স্টক শেষ
                          </span>
                        ) : isLow ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-black text-[10px]">
                            লো-স্টক (&lt;10)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                            পর্যাপ্ত স্টক
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            disabled={updatingId === p.id || p.stock === 0}
                            onClick={() => updateStock(p.id, Math.max(0, p.stock - 1))}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                            title="Decrease 1"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={updatingId === p.id}
                            onClick={() => updateStock(p.id, p.stock + 1)}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                            title="Increase 1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={updatingId === p.id}
                            onClick={() => updateStock(p.id, p.stock + 10)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#0f6b4a] hover:bg-emerald-100 text-[10px] font-bold border border-emerald-200 disabled:opacity-40 transition-colors"
                            title="Add 10"
                          >
                            +১০ স্টক
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
