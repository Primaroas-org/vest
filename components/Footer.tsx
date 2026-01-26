import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ViewState } from '../types';

interface FooterProps {
  onNavigate: (view: ViewState) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { dict } = useLanguage();

  return (
    <footer className="bg-white dark:bg-background-dark py-16 border-t border-gray-100 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => onNavigate('marketplace')}>
              <div className="bg-primary p-2 rounded-lg">
                <span className="material-icons-round text-white">
                  apartment
                </span>
              </div>
              <span className="text-2xl font-extrabold tracking-tight font-display text-charcoal dark:text-white">
                {dict.brandName}
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
              {dict.footer.desc}
            </p>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-bold mb-6 font-display text-charcoal dark:text-white">{dict.footer.platform}</h4>
            <div className="flex flex-col space-y-4 text-gray-500 dark:text-gray-400">
              <button onClick={() => onNavigate('marketplace')} className="text-left hover:text-primary transition-colors w-fit">{dict.nav.marketplace}</button>
              <button onClick={() => onNavigate('how-it-works')} className="text-left hover:text-primary transition-colors w-fit">{dict.nav.howItWorks}</button>
              <button onClick={() => onNavigate('resources')} className="text-left hover:text-primary transition-colors w-fit">{dict.nav.resources}</button>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-6 font-display text-charcoal dark:text-white">{dict.footer.support}</h4>
            <div className="flex flex-col space-y-4 text-gray-500 dark:text-gray-400">
              <button onClick={() => onNavigate('about')} className="text-left hover:text-primary transition-colors w-fit">{dict.nav.about}</button>
              <button onClick={() => onNavigate('contact')} className="text-left hover:text-primary transition-colors w-fit">{dict.footer.contact}</button>
              <button onClick={() => onNavigate('privacy')} className="text-left hover:text-primary transition-colors w-fit">{dict.footer.privacy}</button>
              <button onClick={() => onNavigate('terms')} className="text-left hover:text-primary transition-colors w-fit">{dict.footer.terms}</button>
            </div>
          </div>

          {/* Newsletter Column */}
          <div>
            <h4 className="font-bold mb-6 font-display text-charcoal dark:text-white">{dict.footer.stayUpdated}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Join our newsletter for new investment drops.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all dark:text-white placeholder-gray-400"
                placeholder={dict.footer.emailPlaceholder}
              />
              <button className="bg-primary text-white p-2 rounded-lg hover:bg-emerald-600 transition-colors shadow-lg shadow-primary/20">
                <span className="material-icons-round">send</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {dict.footer.copyright}
          </p>
          <div className="flex gap-6 text-gray-400">
            {['facebook', 'alternate_email', 'camera_alt'].map((icon) => (
              <a
                key={icon}
                href="#"
                className="hover:text-primary transition-colors transform hover:scale-110"
              >
                <span className="material-icons-round">{icon}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};