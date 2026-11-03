'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '../../context/CartContext';
import { 
  ShieldCheck, 
  Truck, 
  ShoppingBag, 
  CheckCircle2, 
  ArrowRight, 
  Trash2, 
  Plus, 
  Minus, 
  Clock, 
  Lock,
  Tag
} from 'lucide-react';

const BD_DISTRICTS = [
  'Dhaka (ঢাকা সিটি)',
  'Gazipur (গাজীপুর)',
  'Narayanganj (নারায়ণগঞ্জ)',
  'Chittagong (চট্টগ্রাম)',
  'Sylhet (সিলেট)',
  'Rajshahi (রাজশাহী)',
  'Khulna (খুলনা)',
  'Barisal (বরিশাল)',
  'Rangpur (রংপুর)',
  'Mymensingh (ময়মনসিংহ)',
  'Comilla (কুমিল্লা)',
  'Bogra (বগুড়া)',
  'Dinajpur (দিনাজপুর)',
  'Faridpur (ফরিদপুর)',
  'Feni (ফেনী)',
  'Jessore (যশোর)',
  'Kushtia (কুষ্টিয়া)',
  'Noakhali (নোয়াখালী)',
  'Pabna (পাবনা)',
  'Tangail (টাঙ্গাইল)',
  'Other District (অন্যান্য জেলা)'
];

export default function CheckoutPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, subtotal } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('Dhaka (ঢাকা সিটি)');
  const [thana, setThana] = useState('');
  const [note, setNote] = useState('');
  
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  // Delivery charge calculation
  const isDhaka = district.toLowerCase().includes('dhaka');
  const shippingCost = subtotal >= 2000 ? 0 : isDhaka ? 70 : 120;
  const grandTotal = Math.max(0, subtotal + shippingCost - discount);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponError('');
    setCouponSuccess('');
    try {
      const res = await fetch('/api/orders/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, subtotal })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setDiscount(data.discount);
        setCouponSuccess(`কুপন কোড "${data.code}" কার্যকর হয়েছে! ৳${data.discount} ছাড়.`);
      } else {
        setDiscount(0);
        setCouponError(data.error || 'ভুল বা মেয়াদোত্তীর্ণ কুপন কোড');
      }
    } catch {
      setCouponError('কুপন যাচাই করতে সমস্যা হয়েছে');
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (cart.length === 0) {
      setError('আপনার কার্টে কোনো পণ্য নেই!');
      return;
    }
    if (!customerName.trim()) {
      setError('দয়া করে আপনার পুরো নাম লিখুন');
      return;
    }
    if (!phone.trim() || phone.trim().length < 11) {
      setError('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01712345678)');
      return;
    }
    if (!address.trim()) {
      setError('পণ্য পৌঁছানোর পূর্ণাঙ্গ ঠিকানা দিন');
      return;
    }

    setLoading(true);

    try {
      const orderPayload = {
        customerName: customerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        district: district.trim(),
        thana: thana.trim() || district.trim(),
        paymentMethod: 'cod',
        note: note.trim(),
        items: cart.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.salePrice && item.salePrice < item.price ? item.salePrice : item.price,
          totalPrice: (item.salePrice && item.salePrice < item.price ? item.salePrice : item.price) * item.quantity,
          image: item.image
        })),
        couponCode: discount > 0 ? couponCode : null,
        discount: discount
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'অর্ডার সম্পন্ন হতে ব্যর্থ হয়েছে');
      }

      setOrderSuccess(data.order);
      clearCart();
    } catch (err: any) {
      setError(err.message || 'অর্ডারে ত্রুটি দেখা দিয়েছে, আবার চেষ্টা করুন');
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 text-[#0f6b4a] flex items-center justify-center animate-bounce">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase font-extrabold text-[#0f6b4a] tracking-wider">
            Order Confirmation
          </span>
          <h1 className="text-3xl font-black text-gray-900">
            ধন্যবাদ! আপনার অর্ডারটি সফলভাবে সম্পন্ন হয়েছে
          </h1>
          <p className="text-sm text-gray-600 max-w-lg mx-auto">
            আমাদের প্রতিনিধি দ্রুততম সময়ে কল করে আপনার অর্ডারটি কনফার্ম করবেন এবং ডেলিভারি টিম পণ্য আপনার ঠিকানায় পৌঁছে দেবে।
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xl text-left space-y-4 max-w-md mx-auto">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <span className="text-xs text-gray-500 font-bold">অর্ডার নম্বর:</span>
            <span className="text-sm font-black text-[#0f6b4a]">{orderSuccess.orderNumber}</span>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <span className="text-xs text-gray-500 font-bold">গ্রাহকের নাম:</span>
            <span className="text-sm font-bold text-gray-900">{orderSuccess.customerName}</span>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <span className="text-xs text-gray-500 font-bold">মোবাইল নম্বর:</span>
            <span className="text-sm font-bold text-gray-900">{orderSuccess.phone}</span>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <span className="text-xs text-gray-500 font-bold">ডেলিভারি ঠিকানা:</span>
            <span className="text-xs font-semibold text-gray-700 text-right max-w-[200px]">
              {orderSuccess.address}, {orderSuccess.district}
            </span>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <span className="text-xs text-gray-500 font-bold">পেমেন্ট মেথড:</span>
            <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
              Cash on Delivery (ক্যাশ অন ডেলিভারি)
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 text-base font-black text-gray-900">
            <span>সর্বমোট প্রদেয় বিল:</span>
            <span className="text-xl text-[#0f6b4a]">৳{orderSuccess.total?.toLocaleString('en-US')}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href={`/track?orderNumber=${orderSuccess.orderNumber}`}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#0f6b4a] hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all text-center"
          >
            অর্ডার ট্র্যাক করুন
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-sm transition-all text-center"
          >
            হোম পেজে ফিরে যান
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Checkout Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          ফাস্ট চেকআউট (ক্যাশ অন ডেলিভারি)
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          অর্ডার কনফার্ম করতে নিচের ফর্মটি সঠিক তথ্য দিয়ে পূরণ করুন। কোনো অগ্রিম পেমেন্ট লাগবে না।
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold flex items-center gap-2">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Split Checkout Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Column (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
            <span className="w-8 h-8 rounded-full bg-emerald-100 text-[#0f6b4a] font-black text-sm flex items-center justify-center">
              ১
            </span>
            <h2 className="text-lg font-black text-gray-900">ডেলিভারি তথ্য</h2>
          </div>

          <form onSubmit={handlePlaceOrder} id="checkout-form" className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                আপনার নাম <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="সম্পূর্ণ নাম লিখুন"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#0f6b4a] focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                মোবাইল নম্বর <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="যেমন: 017XXXXXXXX"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#0f6b4a] focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  জেলা নির্বাচন করুন <span className="text-rose-500">*</span>
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#0f6b4a] focus:ring-2 focus:ring-emerald-100 outline-none text-sm bg-white transition-all font-medium text-gray-800"
                >
                  {BD_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d} {d.includes('Dhaka') ? '(চার্জ ৳৭০)' : '(চার্জ ৳১২০)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  থানা / উপজেলা (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={thana}
                  onChange={(e) => setThana(e.target.value)}
                  placeholder="যেমন: মিরপুর, ধানমন্ডি, বা থানা"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#0f6b4a] focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                পূর্ণাঙ্গ ঠিকানা (বাসা/রোড/এলাকা) <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="বাসা নম্বর, রোড নম্বর, এলাকার নাম বিস্তারিত লিখুন"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#0f6b4a] focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                অর্ডার সম্পর্কে কোনো বিশেষ নোট (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="ডেলিভারি সংক্রান্ত নির্দেশনা"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#0f6b4a] focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all"
              />
            </div>

            {/* Payment Method Section */}
            <div className="pt-4 border-t border-gray-100">
              <label className="block text-xs font-bold text-gray-700 mb-3">
                পেমেন্ট মেথড
              </label>
              <div className="p-4 rounded-2xl border-2 border-[#0f6b4a] bg-emerald-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-4 border-[#0f6b4a] bg-white flex items-center justify-center" />
                  <div>
                    <span className="text-sm font-black text-gray-900 block">
                      ক্যাশ অন ডেলিভারি (Cash on Delivery)
                    </span>
                    <span className="text-xs text-gray-500">
                      পণ্য ডেলিভারি ম্যানের কাছ থেকে বুঝে নিয়ে মূল্য পরিশোধ করুন।
                    </span>
                  </div>
                </div>
                <ShieldCheck className="w-6 h-6 text-[#0f6b4a]" />
              </div>
            </div>
          </form>
        </div>

        {/* Right Summary Column (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <h2 className="text-lg font-black text-gray-900">অর্ডার সারসংক্ষেপ</h2>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {cart.reduce((s, i) => s + i.quantity, 0)} টি পণ্য
            </span>
          </div>

          {/* Cart Items List */}
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-500">
                <p>কার্টে কোনো পণ্য নেই।</p>
                <Link href="/shop" className="text-[#0f6b4a] font-bold underline mt-2 inline-block">
                  দোকান ব্রাউজ করুন
                </Link>
              </div>
            ) : (
              cart.map((item) => {
                const currentPrice = item.salePrice && item.salePrice < item.price ? item.salePrice : item.price;
                return (
                  <div key={item.id} className="flex gap-3 py-2 border-b border-gray-50 items-center">
                    <img
                      src={item.image || '/uploads/1790671329971_92b7da_imgi_9_4.jpg'}
                      alt={item.name}
                      className="w-14 h-14 object-cover rounded-xl border border-gray-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-gray-800 truncate">{item.name}</h4>
                      <p className="text-xs text-[#0f6b4a] font-extrabold mt-0.5">
                        ৳{currentPrice.toLocaleString('en-US')} × {item.quantity}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold px-1.5">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Coupon Code Section */}
          <div className="pt-2">
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                placeholder="কুপন কোড (যদি থাকে)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#0f6b4a]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-black transition-colors"
              >
                প্রয়োগ করুন
              </button>
            </form>
            {couponSuccess && <p className="text-[11px] text-emerald-600 font-bold mt-1.5">{couponSuccess}</p>}
            {couponError && <p className="text-[11px] text-rose-500 font-semibold mt-1.5">{couponError}</p>}
          </div>

          {/* Price Breakdown */}
          <div className="space-y-2.5 pt-4 border-t border-gray-100 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>সাবটোটাল</span>
              <span className="font-bold text-gray-900">৳{subtotal.toLocaleString('en-US')}</span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-gray-400" />
                ডেলিভারি চার্জ ({isDhaka ? 'ঢাকা' : 'ঢাকার বাইরে'})
              </span>
              <span className="font-bold text-gray-900">
                {shippingCost === 0 ? <span className="text-emerald-600 font-black">ফ্রি ডেলিভারি</span> : `৳${shippingCost}`}
              </span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> কুপন ছাড়
                </span>
                <span>-৳{discount.toLocaleString('en-US')}</span>
              </div>
            )}

            <div className="flex justify-between items-baseline pt-3 border-t border-gray-200">
              <span className="text-sm font-black text-gray-900">সর্বমোট প্রদেয়</span>
              <span className="text-2xl font-black text-[#0f6b4a]">
                ৳{grandTotal.toLocaleString('en-US')}
              </span>
            </div>
          </div>

          {/* Place Order Button */}
          <button
            type="submit"
            form="checkout-form"
            disabled={loading || cart.length === 0}
            className="w-full py-4 rounded-2xl bg-[#0f6b4a] hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5"
          >
            {loading ? (
              <span>অর্ডার সম্পন্ন হচ্ছে...</span>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>অর্ডার নিশ্চিত করুন (৳{grandTotal.toLocaleString('en-US')})</span>
              </>
            )}
          </button>

          {/* Trust Guarantees */}
          <div className="pt-2 text-center space-y-1">
            <p className="text-[11px] text-gray-500 flex items-center justify-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              ১০০% নিরাপদ কেনাকাটা ও দ্রুততম হোম ডেলিভারি
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
