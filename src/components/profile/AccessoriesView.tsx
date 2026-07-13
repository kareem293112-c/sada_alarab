import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

export default function AccessoriesView({ onBack, currentUser }: any) {
  const [activeTab, setActiveTab] = useState('frames');

  const tabs = [
    { id: 'frames', label: 'إطارات' },
    { id: 'entry', label: 'مؤثرات الدخول' },
    { id: 'id_card', label: 'بطاقة التعريف' },
    { id: 'bubbles', label: 'فقاعات الدردشة غرفة' },
    { id: 'medals', label: 'الميداليات' },
    { id: 'name_colors', label: 'ألوان اسم المستخدم' },
    { id: 'mic_wave', label: 'موجة الميكروفون' },
    { id: 'entry_alert', label: 'تنبيه الدخول' },
    { id: 'ad_bg', label: 'خلفيات الإعلانات' },
  ];

  return (
    <div className="flex-grow flex flex-col bg-white" dir="rtl">
      {/* Header Area with Dark Background */}
      <div className="bg-[#0f1f1d] pb-8 relative">
        <div className="p-4 flex items-center justify-between text-white relative z-10">
          <h2 className="font-bold text-lg">الملحقات</h2>
          <div className="flex items-center gap-4">
             <span className="w-5 h-5 rounded-full border border-white/50 flex items-center justify-center text-[10px] cursor-pointer hover:bg-white/10">?</span>
             <button onClick={onBack} className="p-1 hover:bg-white/10 rounded-full transition">
               <ChevronRight className="w-6 h-6 text-white" />
             </button>
          </div>
        </div>

        {/* Avatar Display */}
        <div className="flex justify-center mt-4 relative z-10">
           <div className="w-24 h-24 rounded-full border-2 border-white/20 p-1">
              <img src={currentUser?.avatar || "https://api.dicebear.com/7.x/adventurer/svg"} className="w-full h-full rounded-full object-cover" />
           </div>
        </div>
        
        {/* Background rings */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
          <div className="w-48 h-48 rounded-full border border-white/5 absolute"></div>
          <div className="w-72 h-72 rounded-full border border-white/5 absolute"></div>
          <div className="w-96 h-96 rounded-full border border-white/5 absolute"></div>
        </div>
      </div>

      <div className="flex-grow flex flex-col bg-white rounded-t-3xl -mt-6 relative z-20 pt-6">
         {/* Tabs */}
         <div className="flex flex-wrap justify-center gap-2 px-4 mb-8">
            {tabs.map(tab => (
               <button 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                   activeTab === tab.id 
                     ? 'bg-pink-50 border border-pink-200 text-pink-500 relative' 
                     : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-transparent'
                 }`}
               >
                 {tab.label}
                 {activeTab === tab.id && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-pink-500 rounded-full border border-white"></span>}
               </button>
            ))}
         </div>

         {/* Empty State */}
         <div className="flex-grow flex flex-col items-center justify-center text-center opacity-70">
            <div className="text-4xl mb-4 opacity-80">🦋</div>
            <p className="text-sm font-bold text-slate-400">لا يوجد محتوى</p>
         </div>

         {/* Bottom Actions */}
         <div className="p-4 border-t border-slate-100 bg-white">
            <div className="flex justify-between items-center mb-4 px-2">
               <span className="text-xs font-bold text-slate-600">قم بارتداء الملحقات الجديدة تلقائياً</span>
               <div className="w-10 h-6 bg-pink-500 rounded-full relative cursor-pointer">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all translate-x-4"></div>
               </div>
            </div>
            <button className="w-full bg-slate-50 border border-slate-100 text-slate-700 font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100 transition">
               <span>أذهب الى المتجر</span>
               <span>🏪</span>
            </button>
         </div>
      </div>
    </div>
  );
}
