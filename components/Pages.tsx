import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export const HowItWorks: React.FC = () => {
  const { dict } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const steps = [
    { icon: 'person_add', title: dict.pages.howStep1, desc: dict.pages.howStep1Desc },
    { icon: 'apartment', title: dict.pages.howStep2, desc: dict.pages.howStep2Desc },
    { icon: 'account_balance_wallet', title: dict.pages.howStep3, desc: dict.pages.howStep3Desc },
    { icon: 'trending_up', title: dict.pages.howStep4, desc: dict.pages.howStep4Desc },
  ];

  const faqs = [
    { q: dict.pages.howFaq1Q, a: dict.pages.howFaq1A },
    { q: dict.pages.howFaq2Q, a: dict.pages.howFaq2A },
    { q: dict.pages.howFaq3Q, a: dict.pages.howFaq3A },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 min-h-[60vh]">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-20">
        <h2 className="text-4xl md:text-5xl font-extrabold text-charcoal dark:text-white font-display mb-4">{dict.pages.howTitle}</h2>
        <p className="text-lg text-gray-500 dark:text-gray-400">{dict.pages.howSubtitle}</p>
      </div>

      {/* Steps - Timeline layout */}
      <div className="relative max-w-4xl mx-auto mb-24">
        {/* Vertical line */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/10"></div>

        {steps.map((step, i) => (
          <div key={i} className={`relative flex items-start gap-8 mb-16 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
            {/* Content card */}
            <div className={`flex-1 ${i % 2 === 0 ? 'md:text-right md:pr-12' : 'md:text-left md:pl-12'}`}>
              <div className="bg-white dark:bg-charcoal p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-shadow">
                <span className="material-icons-round text-4xl text-primary mb-4 block">{step.icon}</span>
                <h3 className="text-xl font-bold mb-3 text-charcoal dark:text-white">{step.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
            </div>
            {/* Step number */}
            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 bg-primary text-white w-12 h-12 rounded-full items-center justify-center font-bold text-xl shadow-lg border-4 border-white dark:border-gray-900 z-10">
              {i + 1}
            </div>
            {/* Spacer for opposite side */}
            <div className="hidden md:block flex-1"></div>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto">
        <h3 className="text-2xl font-bold text-charcoal dark:text-white font-display mb-8 text-center">{dict.pages.howFaqTitle}</h3>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white dark:bg-charcoal rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-bold text-charcoal dark:text-white pr-4">{faq.q}</span>
                <span className={`material-icons-round text-primary transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>expand_more</span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Resources: React.FC = () => {
  const { dict } = useLanguage();
  const resources = [
    { title: dict.pages.res1, desc: dict.pages.res1Desc, icon: 'pie_chart', color: 'bg-blue-500' },
    { title: dict.pages.res2, desc: dict.pages.res2Desc, icon: 'receipt_long', color: 'bg-amber-500' },
    { title: dict.pages.res3, desc: dict.pages.res3Desc, icon: 'shield', color: 'bg-red-500' },
    { title: dict.pages.res4, desc: dict.pages.res4Desc, icon: 'payments', color: 'bg-emerald-500' },
    { title: dict.pages.res5, desc: dict.pages.res5Desc, icon: 'verified_user', color: 'bg-purple-500' },
    { title: dict.pages.res6, desc: dict.pages.res6Desc, icon: 'analytics', color: 'bg-cyan-500' },
  ];
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 min-h-[60vh]">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-4xl md:text-5xl font-extrabold text-charcoal dark:text-white font-display mb-4">{dict.pages.resourcesTitle}</h2>
        <p className="text-lg text-gray-500 dark:text-gray-400">{dict.pages.resourcesSubtitle}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {resources.map((res, i) => (
           <div key={i} className="group cursor-pointer bg-white dark:bg-charcoal rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className={`h-2 ${res.color}`}></div>
              <div className="p-6">
                <div className={`${res.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                  <span className="material-icons-round text-white text-2xl">{res.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-charcoal dark:text-white group-hover:text-primary transition-colors mb-2">{res.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{res.desc}</p>
                <div className="mt-4 flex items-center text-primary text-sm font-bold group-hover:gap-2 transition-all">
                  <span className="material-icons-round text-base mr-1">arrow_forward</span>
                </div>
              </div>
           </div>
        ))}
      </div>
    </div>
  );
};

export const About: React.FC = () => {
  const { dict } = useLanguage();
  const values = [
    { icon: 'visibility', title: dict.pages.aboutValue1, desc: dict.pages.aboutValue1Desc },
    { icon: 'security', title: dict.pages.aboutValue2, desc: dict.pages.aboutValue2Desc },
    { icon: 'accessibility_new', title: dict.pages.aboutValue3, desc: dict.pages.aboutValue3Desc },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 min-h-[60vh]">
      {/* Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
         <div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-charcoal dark:text-white font-display mb-6">{dict.pages.aboutTitle}</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
               {dict.pages.aboutDesc}
            </p>
            <div className="grid grid-cols-2 gap-6 mt-8">
               <div className="border-l-4 border-primary pl-4">
                  <p className="text-3xl font-bold text-charcoal dark:text-white mb-1">2024</p>
                  <p className="text-sm text-gray-500">Founded in Ulaanbaatar</p>
               </div>
               <div className="border-l-4 border-primary pl-4">
                  <p className="text-3xl font-bold text-charcoal dark:text-white mb-1">₮100K</p>
                  <p className="text-sm text-gray-500">Min. Investment</p>
               </div>
            </div>
         </div>
         <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary/20 to-emerald-600/30 flex items-center justify-center">
            <span className="material-icons-round text-[120px] text-primary/50">apartment</span>
         </div>
      </div>

      {/* Why Vest */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h3 className="text-3xl font-extrabold text-charcoal dark:text-white font-display mb-4">{dict.pages.aboutWhy}</h3>
        <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">{dict.pages.aboutWhyDesc}</p>
      </div>

      {/* Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
        {values.map((v, i) => (
          <div key={i} className="bg-white dark:bg-charcoal p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 text-center hover:-translate-y-1 transition-transform">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-icons-round text-3xl text-primary">{v.icon}</span>
            </div>
            <h4 className="text-xl font-bold text-charcoal dark:text-white mb-2">{v.title}</h4>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{v.desc}</p>
          </div>
        ))}
      </div>

      {/* Team */}
      <div className="text-center max-w-3xl mx-auto">
        <h3 className="text-3xl font-extrabold text-charcoal dark:text-white font-display mb-4">{dict.pages.aboutTeamTitle}</h3>
        <p className="text-lg text-gray-500 dark:text-gray-400">{dict.pages.aboutTeamDesc}</p>
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
  const { dict, language } = useLanguage();
  
  const content = language === 'mn' ? {
    title: "Нууцлалын бодлого",
    subtitle: "[Vest] Нууцлалын бодлогын мэдэгдэл",
    section1: {
      title: "1. Мэдээлэл цуглуулах хууль эрх зүйн үндэслэл",
      content: "\"Вест\" ХХК (цаашид \"Бид\" гэх) нь таны хувийн мэдээллийг цуглуулах, боловсруулахдаа Монгол Улсын Хувь хүний мэдээлэл хамгаалах тухай хууль (2021 оны 12 дугаар сарын 17-ны өдөр батлагдсан) болон Санхүүгийн Зохицуулах Хорооноос (СЗХ) тогтоосон журмыг чанд мөрдөн ажиллана."
    },
    section2: {
      title: "2. Хувь хүний эмзэг мэдээлэл цуглуулах",
      content: "Мөнгө угаах болон терроризмыг санхүүжүүлэхтэй тэмцэх (AML/CFT) тухай хуулийн дагуу бид таны овог нэр, регистрийн дугаар, оршин суугаа хаяг болон биометрик мэдээллийг (selfie verification) цуглуулж, баталгаажуулах үүрэгтэй. Та бүртгэлээ үргэлжлүүлснээр эдгээр мэдээллийг зөвхөн таныг таньж тогтоох зорилгоор ашиглахыг зөвшөөрч буй хэрэг юм."
    },
    section3: {
      title: "3. Мэдээллийн хадгалалт ба аюулгүй байдал",
      content: "Бид мэдээллийн бүрэн бүтэн байдлыг дээдэлдэг. Таны хувийн мэдээлэл болон гүйлгээний түүх нь олон улсын стандарт бүхий нууцлалын системээр хамгаалагдана. Хэрэглэгчийн үндсэн мэдээлэл нь Монгол Улсын нутаг дэвсгэр дээрх серверүүдэд хадгалагдах бөгөөд аюулгүй байдлыг хангах үүднээс олон улсын үүлэн технологийн (cloud) системд давхар шифрлэгдэж нөөцлөгдөнө."
    },
    section4: {
      title: "4. Төрийн мэдээллийн системтэй нэгдэх",
      content: "Хэрэв та \"ДАН\" нэгдсэн системээр нэвтэрч буй бол өөрийн мэдээллийг төрийн \"ХУР\" мэдээлэл солилцооны системээс шууд татахыг \"Вест\" апп-д зөвшөөрч буй хэрэг болно."
    }
  } : {
    title: "Privacy Policy",
    subtitle: "[Vest] Privacy Policy Statement",
    section1: {
      title: "1. Legal Basis for Information Collection",
      content: "Vest LLC (hereinafter referred to as \"We\") strictly adheres to Mongolia's Personal Data Protection Law (enacted on December 17, 2021) and regulations established by the Financial Regulatory Commission (FRC) when collecting and processing your personal information."
    },
    section2: {
      title: "2. Collection of Sensitive Personal Information",
      content: "In accordance with the Anti-Money Laundering and Counter-Terrorism Financing (AML/CFT) law, we are obligated to collect and verify your full name, registration number, residential address, and biometric information (selfie verification). By continuing with your registration, you consent to the use of this information solely for the purpose of identity verification."
    },
    section3: {
      title: "3. Data Storage and Security",
      content: "We prioritize data integrity. Your personal information and transaction history are protected by internationally standardized security systems. User core data is stored on servers within Mongolia's territory and is additionally encrypted and backed up in international cloud technology systems to ensure security."
    },
    section4: {
      title: "4. Integration with Government Information Systems",
      content: "If you log in through the \"DAN\" unified system, you consent to the \"Vest\" app directly retrieving your information from the government's \"HUR\" information exchange system."
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 min-h-[60vh]">
      <div className="mb-8">
        <h2 className="text-4xl font-extrabold text-charcoal dark:text-white font-display mb-4">{content.title}</h2>
        <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">{content.subtitle}</p>
      </div>
      <div className="prose dark:prose-invert max-w-none space-y-8 text-gray-600 dark:text-gray-300 leading-relaxed">
         <section className="bg-white dark:bg-charcoal p-6 rounded-xl border border-gray-100 dark:border-gray-800">
            <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-4">{content.section1.title}</h3>
            <p className="leading-relaxed">{content.section1.content}</p>
         </section>

         <section className="bg-white dark:bg-charcoal p-6 rounded-xl border border-gray-100 dark:border-gray-800">
            <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-4">{content.section2.title}</h3>
            <p className="leading-relaxed">{content.section2.content}</p>
         </section>

         <section className="bg-white dark:bg-charcoal p-6 rounded-xl border border-gray-100 dark:border-gray-800">
            <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-4">{content.section3.title}</h3>
            <p className="leading-relaxed">{content.section3.content}</p>
         </section>

         <section className="bg-white dark:bg-charcoal p-6 rounded-xl border border-gray-100 dark:border-gray-800">
            <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-4">{content.section4.title}</h3>
            <p className="leading-relaxed">{content.section4.content}</p>
         </section>
      </div>
    </div>
  );
};

export const Terms: React.FC = () => {
  const { dict, language } = useLanguage();
  
  const content = language === 'mn' ? {
    title: "Үйлчилгээний нөхцөл",
    subtitle: "[Vest] Үйлчилгээний нөхцөл, эрсдэлийн мэдэгдэл",
    section1: {
      title: "1. СЗХ-ны \"Регулятор sandbox\" орчны статус",
      content: "\"Вест\" платформ нь одоогоор Санхүүгийн Зохицуулах Хорооны \"Финтек зохицуулалтын туршилтын орчин\"-д (Sandbox) үйл ажиллагаа явуулж байна. Бид үйл ажиллагааны хатуу удирдамжийг баримталдаг хэдий ч үл хөдлөх хөрөнгийн хувьцаажуулалт нь зохицуулалтын хувьд шинээр хөгжиж буй салбар гэдгийг хэрэглэгч анхаарна уу."
    },
    section2: {
      title: "2. Хөрөнгө оруулалтын бүтэц (ТЗК загвар)",
      content: "Та \"Вест\" апп-аар дамжуулан үл хөдлөх хөрөнгөнд хөрөнгө оруулалт хийхдээ тухайн үл хөдлөх хөрөнгийг эзэмшигч \"Тусгай зориулалтын компани\"-ийн (ТЗК) хөрөнгө оруулалтын эрх буюу хувьцааг худалдан авч буй хэрэг юм. Таны өмчлөх эрх нь биет үл хөдлөх хөрөнгө дээр биш, харин тухайн хөрөнгийг эзэмшиж буй ТЗК-ийн хувьцаан дээр тогтоно."
    },
    section3: {
      title: "3. Хөрвөх чадвар ба эрсдэлийн санамж",
      content: "Үл хөдлөх хөрөнгө нь урт хугацааны хөрөнгө оруулалт юм. Хөрөнгийн зах зээл шиг хурдан хугацаанд хувьцаагаа зарах боломжгүй бөгөөд хөрөнгө оруулагчид 3-5 жилийн хугацаанд хөрөнгөө байршуулахад бэлэн байх ёстой. Улаанбаатар хотын үл хөдлөх хөрөнгийн зах зээлийн өнгөрсөн үеийн өсөлт нь ирээдүйн ашгийн баталгаа болохгүй. Хөрөнгө оруулалт бүр тодорхой хэмжээний эрсдэлийг дагуулдаг."
    }
  } : {
    title: "Terms of Service",
    subtitle: "[Vest] Terms of Service and Risk Disclosure",
    section1: {
      title: "1. FRC Regulatory Sandbox Status",
      content: "The \"Vest\" platform currently operates within the Financial Regulatory Commission's \"Fintech Regulatory Testing Environment\" (Sandbox). While we strictly adhere to operational guidelines, users should note that real estate tokenization is a newly developing sector in terms of regulation."
    },
    section2: {
      title: "2. Investment Structure (SPV Model)",
      content: "When you invest in real estate through the \"Vest\" app, you are purchasing investment rights or shares of the \"Special Purpose Vehicle\" (SPV) company that owns the real estate property. Your ownership rights are not on the physical real estate property itself, but rather on the shares of the SPV that owns the property."
    },
    section3: {
      title: "3. Liquidity and Risk Warning",
      content: "Real estate is a long-term investment. Unlike stock markets, you cannot quickly sell your shares, and investors should be prepared to commit their capital for 3-5 years. Past growth in Ulaanbaatar's real estate market does not guarantee future returns. Every investment carries a certain degree of risk."
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 min-h-[60vh]">
      <div className="mb-8">
        <h2 className="text-4xl font-extrabold text-charcoal dark:text-white font-display mb-4">{content.title}</h2>
        <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">{content.subtitle}</p>
      </div>
      <div className="prose dark:prose-invert max-w-none space-y-8 text-gray-600 dark:text-gray-300 leading-relaxed">
         <section className="bg-white dark:bg-charcoal p-6 rounded-xl border border-gray-100 dark:border-gray-800">
            <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-4">{content.section1.title}</h3>
            <p className="leading-relaxed">{content.section1.content}</p>
         </section>

         <section className="bg-white dark:bg-charcoal p-6 rounded-xl border border-gray-100 dark:border-gray-800">
            <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-4">{content.section2.title}</h3>
            <p className="leading-relaxed">{content.section2.content}</p>
         </section>

         <section className="bg-white dark:bg-charcoal p-6 rounded-xl border border-gray-100 dark:border-gray-800">
            <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-4">{content.section3.title}</h3>
            <p className="leading-relaxed">{content.section3.content}</p>
         </section>
      </div>
    </div>
  );
};