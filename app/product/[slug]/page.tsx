import React from 'react';
import Link from 'next/link';
import db from '../../../src/db/database';
import ProductCard from '../../../components/ProductCard';
import ProductDetailActions from '../../../components/ProductDetailActions';
import { Star } from 'lucide-react';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

interface DBProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  image: string;
  images: string | null;
  short_description: string | null;
  description: string | null;
  stock: number;
  rating: number;
  review_count: number;
  category_id: number;
  categoryName?: string;
}

async function getProductDetails(slug: string) {
  try {
    const rawProduct = db.get(`
      SELECT p.*, c.name as categoryName, c.slug as categorySlug,
             b.name as brandName, b.slug as brandSlug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.slug = ?
    `, [slug]) as unknown as DBProduct | undefined;

    if (!rawProduct) return null;

    const variations = db.all(`SELECT * FROM product_variations WHERE product_id = ?`, [rawProduct.id]);
    const rawRelated = db.all(`
      SELECT id, name, slug, price, sale_price as salePrice, image, rating, review_count as reviewCount
      FROM products
      WHERE category_id = ? AND id != ? AND status = 'active'
      LIMIT 5
    `, [rawProduct.category_id, rawProduct.id]) as unknown as any[];

    return { product: rawProduct, variations, related: rawRelated };
  } catch (err) {
    console.error('Error fetching product details:', err);
    return null;
  }
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const data = await getProductDetails(slug);

  if (!data || !data.product) {
    notFound();
  }

  const { product, related } = data;
  const price = Number(product.price);
  const salePrice = product.sale_price ? Number(product.sale_price) : null;
  const currentPrice = salePrice && salePrice < price ? salePrice : price;
  const discountPercent = salePrice && price > salePrice 
    ? Math.round(((price - salePrice) / price) * 100) 
    : 0;

  let displayImages: string[] = [];
  try {
    if (product.images) {
      displayImages = JSON.parse(product.images);
    }
  } catch {
    displayImages = [];
  }
  if (displayImages.length === 0) {
    displayImages = [product.image || '/uploads/1790671329971_92b7da_imgi_9_4.jpg'];
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:underline">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:underline">Shop</Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold truncate max-w-xs">{product.name}</span>
      </div>

      {/* Product Hero Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-3xl bg-gray-50 overflow-hidden border border-gray-100 shadow-sm">
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 z-10 px-3 py-1 bg-rose-600 text-white text-xs font-black rounded-lg shadow-sm">
                SAVE {discountPercent}%
              </span>
            )}
            <img
              src={displayImages[0]}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Thumbnails */}
          {displayImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {displayImages.map((img: string, idx: number) => (
                <div
                  key={idx}
                  className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-200 overflow-hidden flex-shrink-0 cursor-pointer hover:border-[#0f6b4a] transition-all"
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="space-y-6">
          <div>
            <span className="text-xs uppercase font-extrabold text-[#0f6b4a] tracking-wider block mb-1">
              {product.categoryName || 'Exclusive Collection'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
              {product.name}
            </h1>

            {/* Ratings */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-xs font-bold text-gray-700">{product.rating || '5.0'}</span>
              <span className="text-xs text-gray-400">({product.review_count || 12} Customer Reviews)</span>
              <span className="text-xs text-emerald-600 font-bold ml-2">✓ In Stock ({product.stock} items)</span>
            </div>
          </div>

          {/* Price Box */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-baseline gap-3">
            <span className="text-3xl font-black text-[#0f6b4a]">
              ৳{currentPrice.toLocaleString('en-US')}
            </span>
            {salePrice && salePrice < price && (
              <span className="text-base text-gray-400 line-through">
                ৳{price.toLocaleString('en-US')}
              </span>
            )}
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full ml-auto">
              Cash On Delivery
            </span>
          </div>

          {/* Short Description */}
          {product.short_description && (
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              {product.short_description}
            </p>
          )}

          {/* Interactive Order & Cart Actions (Client Component) */}
          <ProductDetailActions
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: price,
              salePrice: salePrice,
              image: displayImages[0],
              stock: product.stock,
            }}
          />
        </div>
      </div>

      {/* Detailed Description */}
      {product.description && (
        <div className="border-t border-gray-100 pt-8 space-y-4">
          <h2 className="text-lg font-black text-gray-900">পণ্য সম্পর্কিত বিস্তারিত তথ্য</h2>
          <div 
            className="prose prose-sm text-gray-700 max-w-none leading-relaxed bg-white p-6 rounded-3xl border border-gray-100 shadow-sm"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}

      {/* Related Products */}
      {related && related.length > 0 && (
        <div className="border-t border-gray-100 pt-8 space-y-6">
          <h2 className="text-xl font-black text-gray-900">সম্পর্কিত অন্যান্য পণ্য</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {related.map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
