import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export const Hero: React.FC = () => {
  const { dict } = useLanguage();

  return (
    <section className="relative h-[600px] overflow-hidden">
      <img
        alt="Modern Architecture"
        className="absolute inset-0 w-full h-full object-cover"
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDceoZ1OgEj0FqYto1OHX2ULZca4eedvsFNtuTJbMvMjk4LkdFmLdqYMLxS4JmfTAWVZ3EzBvBmgAY27PZJWSKa9glZHcqRSgLWMLUtPrNQKNIwbVwzVHW4olqHJGwj2ku4nEV9l_XPayk7ZBQSePXLKZeYlVppEtx6zDKZbyghlr-_xeCFhCIpXzeIeyZDuaSpoE-nnPyzq5Ah8DYoZwM0gtAEMKusXHDLD116gI-yHJ5ZK9EbX2irpx2aeO93z7lwtRD_Bn4gqMw"
      />
      <div className="absolute inset-0 hero-gradient"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
        <div className="max-w-2xl animate-fade-in-up">
          <span className="inline-block py-1 px-3 rounded-full bg-primary/20 text-primary font-bold text-xs uppercase tracking-widest mb-4">
            {dict.hero.tag}
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6 font-display">
            {dict.hero.titleStart} <br />
            <span className="text-primary">{dict.hero.titleEnd}</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            {dict.hero.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="bg-primary hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-95">
              {dict.hero.browse}
            </button>
            <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-xl font-bold text-lg transition-all active:scale-95">
              {dict.hero.learn}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};