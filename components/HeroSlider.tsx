'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface SlideItem {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  badge: string;
  ctaText: string;
  ctaLink: string;
}

const defaultSlides: SlideItem[] = [
  {
    id: 1,
    image: '/uploads/hero/hero-slide-1.jpg',
    title: 'Trendy Fashion & Lifestyle Collection',
    subtitle: 'Discover Premium Quality Styles with Up to 50% Off & Fast Cash On Delivery',
    badge: 'NEW SEASON 2026',
    ctaText: 'Shop Collection',
    ctaLink: '/shop'
  },
  {
    id: 2,
    image: '/uploads/hero/hero-slide-2.jpg',
    title: 'Smart Fashion & Everyday Essentials',
    subtitle: 'Exclusive Bangladeshi Designs Crafted for Unmatched Elegance and Comfort',
    badge: 'BESTSELLER PICKS',
    ctaText: 'Explore Now',
    ctaLink: '/shop?category=men-s-fashion'
  },
  {
    id: 3,
    image: '/uploads/hero/hero-slide-3.jpg',
    title: 'Premium Hoodies & Urban Streetwear',
    subtitle: 'Upgrade Your Wardrobe with the Freshest Modern Fits & Colorways',
    badge: 'LIMITED DROPS',
    ctaText: 'Grab Yours',
    ctaLink: '/shop'
  }
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-play interval
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % defaultSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? defaultSlides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % defaultSlides.length);
  };

  return (
    <section 
      className="relative w-full overflow-hidden bg-gray-900 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Promotional Hero Carousel"
    >
      {/* Slider Viewport */}
      <div className="relative w-full h-[220px] sm:h-[360px] md:h-[460px] lg:h-[540px]">
        {defaultSlides.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Background Image */}
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover object-center"
                loading={index === 0 ? 'eager' : 'lazy'}
              />

              {/* Gradient Overlay for Text Readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent flex items-center">
                <div className="max-w-7xl mx-auto px-6 sm:px-12 w-full">
                  <div className="max-w-xl text-white space-y-2 sm:space-y-4">
                    {/* Badge */}
                    <span className="inline-block px-3 py-1 bg-[#0f6b4a] text-white text-[11px] sm:text-xs font-bold tracking-wider rounded-full shadow-sm">
                      {slide.badge}
                    </span>

                    {/* Headline */}
                    <h1 className="text-xl sm:text-3xl md:text-5xl font-extrabold tracking-tight leading-tight sm:leading-none text-white drop-shadow-md">
                      {slide.title}
                    </h1>

                    {/* Subtitle */}
                    <p className="text-xs sm:text-base text-gray-200 line-clamp-2 drop-shadow">
                      {slide.subtitle}
                    </p>

                    {/* Call to Action Button */}
                    <div className="pt-2">
                      <Link
                        href={slide.ctaLink}
                        className="inline-flex items-center gap-2 bg-[#0f6b4a] hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 sm:px-7 sm:py-3 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                      >
                        {slide.ctaText}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Next Slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2">
        {defaultSlides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`transition-all rounded-full ${
              idx === currentSlide
                ? 'w-8 h-2.5 bg-[#0f6b4a]'
                : 'w-2.5 h-2.5 bg-white/60 hover:bg-white'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
