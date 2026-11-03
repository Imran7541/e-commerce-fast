import type { Metadata } from 'next';
import './globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';
import { CartProvider } from '../context/CartContext';

export const metadata: Metadata = {
  title: 'Digital Bazar - Fast Commerce & Best Online Shop',
  description: 'Shop Men Fashion, Women Fashion, Smart Watches and Lifestyle Products online in Bangladesh with Cash On Delivery.',
  keywords: 'ecommerce bangladesh, online shop, panjabi, saree, fashion, digital bazar',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <body className="min-h-screen flex flex-col justify-between antialiased bg-gray-50/30 text-gray-900">
        <CartProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
