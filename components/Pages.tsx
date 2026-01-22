import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export const HowItWorks: React.FC = () => {
  const { dict } = useLanguage();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 min-h-[60vh]">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-4xl font-extrabold text-charcoal dark:text-white font-display mb-6">{dict.pages.howTitle}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {[
          { icon: 'app_registration', title: dict.pages.howStep1, desc: dict.pages.howStep1Desc },
          { icon: 'manage_search', title: dict.pages.howStep2, desc: dict.pages.howStep2Desc },
          { icon: 'payments', title: dict.pages.howStep3, desc: dict.pages.howStep3Desc }
        ].map((step, i) => (
          <div key={i} className="bg-white dark:bg-charcoal p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 text-center relative group hover:-translate-y-2 transition-transform">
             <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-lg border-4 border-white dark:border-charcoal">
                {i + 1}
             </div>
             <span className="material-icons-round text-5xl text-gray-300 group-hover:text-primary transition-colors mb-4 mt-4 block">{step.icon}</span>
             <h3 className="text-xl font-bold mb-3 text-charcoal dark:text-white">{step.title}</h3>
             <p className="text-gray-500 dark:text-gray-400">{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Resources: React.FC = () => {
  const { dict } = useLanguage();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 min-h-[60vh]">
      <h2 className="text-4xl font-extrabold text-charcoal dark:text-white font-display mb-12 text-center">{dict.pages.resourcesTitle}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[dict.pages.res1, dict.pages.res2, dict.pages.res3].map((title, i) => (
           <div key={i} className="group cursor-pointer">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-4 overflow-hidden relative">
                 <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/40 transition-colors"></div>
                 <span className="absolute bottom-4 right-4 bg-white/90 p-2 rounded-full shadow-sm">
                    <span className="material-icons-round text-primary">arrow_forward</span>
                 </span>
              </div>
              <h3 className="text-xl font-bold text-charcoal dark:text-white group-hover:text-primary transition-colors">{title}</h3>
           </div>
        ))}
      </div>
    </div>
  );
};

export const About: React.FC = () => {
  const { dict } = useLanguage();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 min-h-[60vh]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
         <div>
            <h2 className="text-4xl font-extrabold text-charcoal dark:text-white font-display mb-6">{dict.pages.aboutTitle}</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
               {dict.pages.aboutDesc}
            </p>
            <div className="grid grid-cols-2 gap-6 mt-8">
               <div className="border-l-4 border-primary pl-4">
                  <p className="text-3xl font-bold text-charcoal dark:text-white mb-1">2023</p>
                  <p className="text-sm text-gray-500">Founded in Ulaanbaatar</p>
               </div>
               <div className="border-l-4 border-primary pl-4">
                  <p className="text-3xl font-bold text-charcoal dark:text-white mb-1">₮42B+</p>
                  <p className="text-sm text-gray-500">Assets Tokenized</p>
               </div>
            </div>
         </div>
         <div className="relative h-[500px] rounded-3xl overflow-hidden shadow-2xl">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8m9Ay_gcICqYNambA7M9ltd2-ipZdoBPxjl-BlhAQ7LD3OuIjSFoFaQaeOMsBqLDL40EECv3E2dzu2aM-9g82kMPIpEwv1cfqXFin3Q7DMoOYwEqi1FJ0VlmPbHdUerdTJQhAYPPL7gWQ8a0GKqE6OKvS9zyEDXCz9ibS4t8LkcTTZzlrM72sUMzW-ZGUqiwIg9LbJTs8r6_Wya-d60YTfVfSPWP5nT4KDd7UX8H6nXladIo5tUjpockgF7BaVq8pPz5SCAZ1qR0" alt="Office" className="absolute inset-0 w-full h-full object-cover" />
         </div>
      </div>
    </div>
  );
};

export const Contact: React.FC = () => {
  const { dict } = useLanguage();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 min-h-[60vh]">
      <h2 className="text-4xl font-extrabold text-charcoal dark:text-white font-display mb-6">{dict.pages.contactTitle}</h2>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-12">{dict.pages.contactDesc}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="bg-white dark:bg-charcoal p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
           <form className="space-y-6">
              <div>
                 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Name</label>
                 <input type="text" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white" />
              </div>
              <div>
                 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email</label>
                 <input type="email" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white" />
              </div>
              <div>
                 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Message</label>
                 <textarea rows={4} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"></textarea>
              </div>
              <button className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-emerald-600 transition-colors">Send Message</button>
           </form>
        </div>
        
        <div className="space-y-8">
           <div className="flex items-start gap-4">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-lg text-primary">
                 <span className="material-icons-round">email</span>
              </div>
              <div>
                 <h3 className="font-bold text-lg text-charcoal dark:text-white">Email Us</h3>
                 <p className="text-gray-500 dark:text-gray-400">hello@vest.mn</p>
              </div>
           </div>
           <div className="flex items-start gap-4">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-lg text-primary">
                 <span className="material-icons-round">location_on</span>
              </div>
              <div>
                 <h3 className="font-bold text-lg text-charcoal dark:text-white">Visit Us</h3>
                 <p className="text-gray-500 dark:text-gray-400">Shangri-La Centre, Level 15<br/>Sukhbaatar District, Ulaanbaatar</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export const Privacy: React.FC = () => {
  const { dict } = useLanguage();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 min-h-[60vh]">
      <h2 className="text-4xl font-extrabold text-charcoal dark:text-white font-display mb-8">{dict.pages.privacyTitle}</h2>
      <div className="prose dark:prose-invert max-w-none space-y-8 text-gray-600 dark:text-gray-300">
         <p>{dict.pages.privacyDesc}</p>
         
         <section>
            <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-4">1. Information Collection</h3>
            <p>We collect information you provide directly to us when you create an account, verify your identity, make an investment, or communicate with us.</p>
         </section>

         <section>
            <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-4">2. Use of Information</h3>
            <p>We use the information we collect to operate our platform, process transactions, comply with legal obligations (KYC/AML), and improve our services.</p>
         </section>

         <section>
            <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-4">3. Data Security</h3>
            <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.</p>
         </section>
      </div>
    </div>
  );
};