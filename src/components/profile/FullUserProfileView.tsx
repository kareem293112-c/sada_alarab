import React, { useState } from 'react';
import { 
  ArrowRight, Edit3, Award, Calendar, Globe, User, Shield, 
  Sparkles, Coins, HelpCircle, Heart, Flame, Compass, ChevronLeft,
  Share2, Trophy, Crown, Gift, Music, Image, Send, Copy, Check, Users, Trash2
} from 'lucide-react';
import { AppUser } from '../../types';

interface Props {
  onBack: () => void;
  currentUser: AppUser | null;
  users: AppUser[];
  onNavigate: (view: string) => void;
}

// Simulated Moments storage in state or localStorage for beautiful interactive demo
interface Moment {
  id: string;
  text: string;
  timestamp: string;
  likes: number;
  commentsCount: number;
}

export default function FullUserProfileView({ onBack, currentUser, users, onNavigate }: Props) {
  const [activeTab, setActiveTab] = useState<'profile' | 'moments'>('profile');
  const [copied, setCopied] = useState(false);
  
  // CP Interactive simulations
  const [cpPartner, setCpPartner] = useState<AppUser | null>(() => {
    // Pick first other user with level > 5 as companion
    const potential = users.filter(u => u.id !== currentUser?.id);
    return potential.length > 0 ? potential[0] : null;
  });
  const [cpDays, setCpDays] = useState(14);
  const [isInviteCpOpen, setIsInviteCpOpen] = useState(false);

  // Close friend simulation
  const [bestFriend, setBestFriend] = useState<AppUser | null>(() => {
    const potential = users.filter(u => u.id !== currentUser?.id && u.id !== cpPartner?.id);
    return potential.length > 0 ? potential[0] : null;
  });

  // Moments interactive simulation
  const [moments, setMoments] = useState<Moment[]>(() => {
    const saved = localStorage.getItem(`moments_${currentUser?.id}`);
    if (saved) return JSON.parse(saved);
    return [
      {
        id: '1',
        text: 'مرحباً بكم في ملفي الشخصي الجديد على تطبيق صدى العرب! 🎙️✨ يسعدني انضمامكم لمجالسي الصوتية ومشاركتكم أسعد اللحظات.',
        timestamp: 'منذ ساعتين',
        likes: 12,
        commentsCount: 3
      },
      {
        id: '2',
        text: 'جلسة طرب الليلة في غرفتي الخاصة "أوتار الشرق" 🎵 لا تفوتوا الحضور الساعة 9 مساءً بتوقيت مكة المكرمة 🇸🇦👑',
        timestamp: 'أمس',
        likes: 24,
        commentsCount: 8
      }
    ];
  });
  const [newMomentText, setNewMomentText] = useState('');

  if (!currentUser) return null;

  // Level calculations
  const senderXp = currentUser.senderXp || 0;
  const charmXp = currentUser.charmXp || 0;

  const getLevelInfo = (xp: number) => {
    const level = Math.floor(Math.sqrt(xp / 10)) + 1;
    const currentLevelBaseXp = Math.pow(level - 1, 2) * 10;
    const nextLevelBaseXp = Math.pow(level, 2) * 10;
    const levelRange = nextLevelBaseXp - currentLevelBaseXp;
    const xpInCurrentLevel = xp - currentLevelBaseXp;
    const percentage = Math.min(100, Math.max(0, (xpInCurrentLevel / levelRange) * 100));
    
    return {
      level,
      xpInCurrentLevel,
      levelRange,
      percentage,
      nextLevelXp: nextLevelBaseXp
    };
  };

  const senderInfo = getLevelInfo(senderXp);
  const charmInfo = getLevelInfo(charmXp);

  // Get social counts
  const followingCount = users.filter(u => currentUser.following?.includes(u.id)).length;
  const followersCount = users.filter(u => currentUser.followers?.includes(u.id)).length;
  const friendsCount = users.filter(u => 
    currentUser.following?.includes(u.id) && 
    currentUser.followers?.includes(u.id)
  ).length;

  const handleCopyId = () => {
    const displayVal = currentUser.displayId || currentUser.id;
    navigator.clipboard.writeText(displayVal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePostMoment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMomentText.trim()) return;

    const newMoment: Moment = {
      id: Date.now().toString(),
      text: newMomentText,
      timestamp: 'الآن',
      likes: 0,
      commentsCount: 0
    };

    const updated = [newMoment, ...moments];
    setMoments(updated);
    localStorage.setItem(`moments_${currentUser.id}`, JSON.stringify(updated));
    setNewMomentText('');
  };

  const handleDeleteMoment = (id: string) => {
    const updated = moments.filter(m => m.id !== id);
    setMoments(updated);
    localStorage.setItem(`moments_${currentUser.id}`, JSON.stringify(updated));
  };

  const getCountryFlag = (countryName?: string) => {
    const norm = (countryName || 'العراق').trim();
    if (norm.includes('سعودي') || norm.includes('سعودية') || norm.includes('KSA')) return '🇸🇦';
    if (norm.includes('مصر') || norm.includes('مصري')) return '🇪🇬';
    if (norm.includes('سوريا') || norm.includes('سوري')) return '🇸🇾';
    if (norm.includes('يمن') || norm.includes('يمني')) return '🇾🇪';
    if (norm.includes('تركيا') || norm.includes('تركي')) return '🇹🇷';
    if (norm.includes('أردن') || norm.includes('أردني')) return '🇯🇴';
    if (norm.includes('كويت') || norm.includes('كويتي')) return '🇰🇼';
    if (norm.includes('فلسطين')) return '🇵🇸';
    return '🇮🇶';
  };

  // Supporters list
  const topSupporters = users
    .filter(u => u.id !== currentUser.id)
    .slice(0, 3);

  return (
    <div className="flex flex-col h-full bg-[#FAF6EB] text-[#4A3E3D] overflow-y-auto font-sans" dir="rtl">
      
      {/* Dynamic Golden-Amber Cover Image Background */}
      <div className="relative h-60 bg-gradient-to-b from-[#b8860b] via-[#8a640f] to-[#402a01] shrink-0 overflow-hidden">
        
        {/* Subtle background overlay circles and patterns */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent" />
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-4 right-10 w-32 h-32 bg-amber-400/10 rounded-full blur-xl" />

        {/* Top Action Header Bar */}
        <div className="absolute top-8 inset-x-0 px-4 flex items-center justify-between z-10">
          <button 
            onClick={onBack} 
            className="p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition active:scale-95 border border-white/10 flex items-center justify-center cursor-pointer"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <span className="text-[11px] font-black tracking-widest text-amber-200/90 bg-black/30 border border-amber-500/20 px-3.5 py-1.5 rounded-full backdrop-blur-md">
            الملف الشخصي الفاخر
          </span>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => onNavigate('edit_profile')}
              className="p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition active:scale-95 border border-white/10 flex items-center justify-center cursor-pointer"
            >
              <Edit3 className="w-4.5 h-4.5 text-amber-300" />
            </button>
          </div>
        </div>

        {/* User profile layout inside cover */}
        <div className="absolute bottom-4 inset-x-4 flex items-end gap-4">
          {/* Glowing Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-[#ec2d70] to-yellow-300 shadow-xl relative z-10">
              <img 
                src={currentUser.avatar || "https://api.dicebear.com/7.x/adventurer/svg"} 
                alt={currentUser.name} 
                className="w-full h-full rounded-full object-cover bg-slate-100 border border-white"
              />
            </div>
            {/* Level Badge bottom centered */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-[9px] font-black px-2.5 py-0.5 rounded-full font-mono border border-white shadow-lg z-20">
              Lv.{currentUser.level || 1}
            </div>
          </div>

          {/* User Meta Data */}
          <div className="text-white space-y-1 pb-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-base font-black text-white drop-shadow-md">{currentUser.name}</h2>
              <span className="text-sm select-none" title={currentUser.country}>{getCountryFlag(currentUser.country)}</span>
              {currentUser.role === 'admin' && (
                <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm">إدارة</span>
              )}
              <span className="bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" /> متصل
              </span>
            </div>

            {/* Copyable ID Badge */}
            <button 
              onClick={handleCopyId}
              className="bg-black/25 hover:bg-black/40 text-white/80 rounded-lg px-2 py-0.5 text-[9px] font-mono flex items-center gap-1.5 transition active:scale-95 border border-white/5"
            >
              <span>ID: {currentUser.displayId || currentUser.id.slice(0, 8)}</span>
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
            </button>
          </div>
        </div>

      </div>

      {/* Stats and Counters Row */}
      <div className="bg-[#FAF6EB] border-b border-[#E8DCC4]/40 py-3.5 px-4 sticky top-0 z-20">
        <div className="grid grid-cols-4 divide-x divide-x-reverse divide-[#E8DCC4]/50 text-center">
          
          <button 
            onClick={() => onNavigate('social_followers')}
            className="space-y-0.5 focus:outline-none hover:opacity-85 active:scale-95 transition-all cursor-pointer"
          >
            <strong className="text-sm font-black text-[#4A3E3D] block font-mono">{followersCount}</strong>
            <span className="text-[10px] text-slate-400 font-bold block">المتابعين</span>
          </button>

          <button 
            onClick={() => onNavigate('social_following')}
            className="space-y-0.5 focus:outline-none hover:opacity-85 active:scale-95 transition-all cursor-pointer"
          >
            <strong className="text-sm font-black text-[#4A3E3D] block font-mono">{followingCount}</strong>
            <span className="text-[10px] text-slate-400 font-bold block">يتابع</span>
          </button>

          <button 
            onClick={() => onNavigate('social_friends')}
            className="space-y-0.5 focus:outline-none hover:opacity-85 active:scale-95 transition-all cursor-pointer"
          >
            <strong className="text-sm font-black text-[#4A3E3D] block font-mono">{friendsCount}</strong>
            <span className="text-[10px] text-slate-400 font-bold block">الأصدقاء</span>
          </button>

          <div className="space-y-0.5">
            <strong className="text-sm font-black text-[#4A3E3D] block font-mono">
              {Math.floor((senderXp + charmXp) * 0.1) + 42}
            </strong>
            <span className="text-[10px] text-slate-400 font-bold block">الزوار</span>
          </div>

        </div>
      </div>

      {/* Tabs Selector */}
      <div className="grid grid-cols-2 bg-white border-b border-[#E8DCC4]/40 sticky top-[61px] z-20">
        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3.5 text-xs font-black tracking-wide transition-all border-b-2 ${
            activeTab === 'profile' 
              ? 'border-amber-500 text-amber-600' 
              : 'border-transparent text-slate-400 hover:text-[#4A3E3D]'
          }`}
        >
          الصفحة الشخصية
        </button>
        <button
          onClick={() => setActiveTab('moments')}
          className={`py-3.5 text-xs font-black tracking-wide transition-all border-b-2 flex justify-center items-center gap-1.5 ${
            activeTab === 'moments' 
              ? 'border-amber-500 text-amber-600' 
              : 'border-transparent text-slate-400 hover:text-[#4A3E3D]'
          }`}
        >
          <span>لحظات</span>
          <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 rounded-full font-mono text-slate-500 font-bold">
            {moments.length}
          </span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="p-4 space-y-4 pb-16">
        
        {activeTab === 'profile' ? (
          <>
            {/* عني / التعريف */}
            <div className="bg-white rounded-3xl p-4.5 shadow-xs border border-[#E8DCC4]/40 space-y-2 text-right relative">
              <span className="text-[9px] text-amber-600 font-black bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50 absolute -top-2.5 right-4">
                عني (السيرة الذاتية)
              </span>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                {currentUser.bio || "يمكن أن تؤدي إضافة المعلومات والمؤهلات الفريدة إلى كسب المزيد من المتابعين والداعمين!"}
              </p>
            </div>

            {/* CP (Couple Partner) Section */}
            <div className="bg-white rounded-3xl p-4.5 shadow-xs border border-[#E8DCC4]/40 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <h3 className="text-xs font-black text-[#4A3E3D] flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-red-500 animate-pulse fill-red-500" /> مركز الشريك والارتباط (CP)
                </h3>
                <span className="text-[9px] font-mono text-slate-400 font-bold">مركز العلاقات</span>
              </div>

              {/* Romantic CP card background container with golden badge */}
              <div className="bg-gradient-to-l from-rose-50 via-pink-50/50 to-amber-50/30 rounded-2xl p-4 border border-rose-100 flex items-center justify-between relative overflow-hidden">
                {/* User avatar on left */}
                <div className="flex flex-col items-center gap-1 relative z-10">
                  <div className="w-12 h-12 rounded-full p-0.5 bg-white shadow-sm border border-slate-200">
                    <img 
                      src={currentUser.avatar || "https://api.dicebear.com/7.x/adventurer/svg"} 
                      alt="" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <span className="text-[9px] font-black text-slate-500 truncate max-w-[60px]">{currentUser.name}</span>
                </div>

                {/* Romantic Winged heart central badge */}
                <div className="flex flex-col items-center justify-center relative z-10">
                  <div className="relative animate-bounce duration-1000">
                    {/* Glowing wings background */}
                    <div className="absolute -inset-4 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-400/10 via-transparent to-transparent blur-md" />
                    <span className="text-3xl filter drop-shadow">💝</span>
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full font-mono border border-white">
                      Lv.{cpPartner ? '5' : '0'}
                    </span>
                  </div>
                  <p className="text-[9px] font-bold text-rose-500 font-mono mt-1">
                    {cpPartner ? `${cpDays} يوماً` : 'لا يوجد شريك'}
                  </p>
                </div>

                {/* Partner slot on right */}
                {cpPartner ? (
                  <div className="flex flex-col items-center gap-1 relative z-10">
                    <div className="w-12 h-12 rounded-full p-0.5 bg-white shadow-sm border border-slate-200 relative">
                      <img 
                        src={cpPartner.avatar || "https://api.dicebear.com/7.x/adventurer/svg"} 
                        alt="" 
                        className="w-full h-full rounded-full object-cover"
                      />
                      <button 
                        onClick={() => {
                          setCpPartner(null);
                        }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 rounded-full hover:bg-red-600 transition"
                        title="إنهاء الشراكة"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                    <span className="text-[9px] font-black text-slate-500 truncate max-w-[60px]">{cpPartner.name}</span>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsInviteCpOpen(true)}
                    className="w-12 h-12 rounded-full border-2 border-dashed border-rose-300 bg-rose-50 flex items-center justify-center text-rose-400 hover:bg-rose-100 hover:border-rose-400 transition-all active:scale-95 cursor-pointer"
                  >
                    <span className="text-xl font-bold">+</span>
                  </button>
                )}
              </div>
            </div>

            {/* صديق مقرب (Best Friend) Slot */}
            <div className="bg-white rounded-3xl p-4.5 shadow-xs border border-[#E8DCC4]/40 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-[#4A3E3D] flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-amber-500 fill-amber-400" /> صديق مقرب
                </h3>
                <span className="text-[9px] text-slate-400 font-bold">Best Friend</span>
              </div>

              {bestFriend ? (
                <div className="bg-[#FAF6EB]/40 rounded-2xl p-3 border border-[#E8DCC4]/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={bestFriend.avatar || "https://api.dicebear.com/7.x/adventurer/svg"} 
                      alt="" 
                      className="w-10 h-10 rounded-full border border-slate-200"
                    />
                    <div className="text-right">
                      <h4 className="text-xs font-black text-[#4A3E3D]">{bestFriend.name}</h4>
                      <p className="text-[9px] text-slate-400">صديق مقرب ومتابع مميز</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setBestFriend(null)}
                    className="text-[9px] font-bold text-red-500 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-xl transition"
                  >
                    إلغاء التعيين
                  </button>
                </div>
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                  <p className="text-[10px] font-bold">لا يوجد صديق مقرب معين حتى الآن</p>
                  <button 
                    onClick={() => {
                      const potential = users.filter(u => u.id !== currentUser.id);
                      if (potential.length > 0) setBestFriend(potential[Math.floor(Math.random() * potential.length)]);
                    }}
                    className="text-[9px] text-amber-600 font-black mt-1.5 hover:underline"
                  >
                    اضغط هنا لتعيين أحد الأصدقاء
                  </button>
                </div>
              )}
            </div>

            {/* كبار الداعمين (Top Supporters) */}
            <div className="bg-white rounded-3xl p-4.5 shadow-xs border border-[#E8DCC4]/40 space-y-3.5">
              <h3 className="text-xs font-black text-[#4A3E3D] flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-500" /> كبار الداعمين
              </h3>

              <div className="flex items-center justify-around">
                {topSupporters.map((supporter, idx) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  return (
                    <div key={supporter.id} className="flex flex-col items-center gap-1 text-center">
                      <div className="relative">
                        <img 
                          src={supporter.avatar || "https://api.dicebear.com/7.x/adventurer/svg"} 
                          alt="" 
                          className="w-11 h-11 rounded-full border border-slate-200 shadow-sm"
                        />
                        <span className="absolute -top-1.5 -right-1.5 text-xs">{medals[idx]}</span>
                      </div>
                      <span className="text-[9px] font-black text-slate-600 truncate max-w-[60px]">{supporter.name}</span>
                    </div>
                  );
                })}
                {topSupporters.length === 0 && (
                  <p className="text-[10px] text-slate-400">لا يوجد داعمون مسجلون بعد</p>
                )}
              </div>
            </div>

            {/* غرفتي (Voice Room Slot) */}
            <div className="bg-white rounded-3xl p-4.5 shadow-xs border border-[#E8DCC4]/40 space-y-3">
              <h3 className="text-xs font-black text-[#4A3E3D] flex items-center gap-1.5">
                <Music className="w-4 h-4 text-[#ec2d70]" /> غرفتي الصوتية
              </h3>

              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
                <div className="text-right space-y-1">
                  <h4 className="text-xs font-black">مجلس صدى العرب الصوتي 🎙️</h4>
                  <p className="text-[9px] text-purple-100 font-medium">أكبر تجمع صوتي لأروع المحادثات والمسابقات</p>
                </div>
                <button 
                  onClick={() => onNavigate('my_room')}
                  className="bg-white text-indigo-600 text-[10px] font-black py-1.5 px-4 rounded-xl shadow-xs hover:bg-purple-50 transition active:scale-95"
                >
                  دخول الغرفة
                </button>
              </div>
            </div>

            {/* شارات الشرف والإطارات والمؤثرات (Medals & Showcase) */}
            <div className="bg-white rounded-3xl p-4.5 shadow-xs border border-[#E8DCC4]/40 space-y-4">
              <h3 className="text-xs font-black text-[#4A3E3D] flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-yellow-500" /> شارات الشرف والمقتنيات
              </h3>

              <div className="grid grid-cols-3 gap-3 text-center">
                
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2.5 space-y-1">
                  <span className="text-xl">🏆</span>
                  <p className="text-[10px] font-black text-slate-600">شارة الداعم الذهبي</p>
                  <span className="text-[8px] bg-amber-100 text-amber-700 px-1 rounded block">نشط</span>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2.5 space-y-1">
                  <span className="text-xl">🎙️</span>
                  <p className="text-[10px] font-black text-slate-600">المايك الفضي</p>
                  <span className="text-[8px] bg-slate-200 text-slate-700 px-1 rounded block">مفعّل</span>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2.5 space-y-1">
                  <span className="text-xl">👑</span>
                  <p className="text-[10px] font-black text-slate-600">التاج الملكي</p>
                  <span className="text-[8px] bg-purple-100 text-purple-700 px-1 rounded block">مستمر</span>
                </div>

              </div>
            </div>

            {/* Level Progression & Status (Dual meters) */}
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-[#E8DCC4]/50 space-y-4">
              <h3 className="text-xs font-black text-[#4A3E3D] flex items-center gap-1.5 border-b border-slate-50 pb-2.5">
                <Award className="w-4 h-4 text-[#ec2d70]" /> مستويات ونقاط الخبرة (XP)
              </h3>

              {/* Sender Level Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="flex items-center gap-1 text-[#f39c12]">
                    <Flame className="w-3.5 h-3.5" /> مستوى الثروة والمشاركة
                  </span>
                  <span className="font-mono text-slate-500">LV.{senderInfo.level}</span>
                </div>
                {/* Custom styled progress bar */}
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 relative">
                  <div 
                    className="h-full bg-gradient-to-l from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${senderInfo.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                  <span>{senderXp} / {senderInfo.nextLevelXp} XP</span>
                  <span>تبقي {senderInfo.nextLevelXp - senderXp} XP للمستوى التالي</span>
                </div>
              </div>

              {/* Charm/Popularity Level Progress */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="flex items-center gap-1 text-[#ec2d70]">
                    <Heart className="w-3.5 h-3.5" /> مستوى الجاذبية والشعبية
                  </span>
                  <span className="font-mono text-slate-500">LV.{charmInfo.level}</span>
                </div>
                {/* Custom styled progress bar */}
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 relative">
                  <div 
                    className="h-full bg-gradient-to-l from-[#ec2d70] to-[#f39c12] rounded-full transition-all duration-500"
                    style={{ width: `${charmInfo.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                  <span>{charmXp} / {charmInfo.nextLevelXp} XP</span>
                  <span>تبقي {charmInfo.nextLevelXp - charmXp} XP للمستوى التالي</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Moments (لحظات) View Tab */
          <div className="space-y-4">
            
            {/* Create Moment Form */}
            <form onSubmit={handlePostMoment} className="bg-white rounded-3xl p-4 shadow-xs border border-[#E8DCC4]/40 space-y-3">
              <h3 className="text-xs font-black text-[#4A3E3D] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> شارك لحظاتك اليومية للجميع!
              </h3>
              
              <div className="relative">
                <textarea
                  value={newMomentText}
                  onChange={(e) => setNewMomentText(e.target.value)}
                  placeholder="ماذا يخطر في بالك الليلة؟ اكتب منشورك أو شارك كلمات أغنية..."
                  className="w-full bg-[#FAF6EB]/40 border border-[#E8DCC4]/30 rounded-2xl p-3 text-xs text-[#4A3E3D] placeholder-slate-400 outline-none focus:border-amber-400 focus:bg-white transition-all text-right h-24 resize-none"
                  maxLength={250}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <span className="text-xs text-slate-400 font-mono">{newMomentText.length}/250</span>
                </div>
                <button
                  type="submit"
                  disabled={!newMomentText.trim()}
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-black text-xs py-1.5 px-4 rounded-xl flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>نشر اللحظة</span>
                </button>
              </div>
            </form>

            {/* List of Moments */}
            <div className="space-y-3">
              {moments.map((moment) => (
                <div 
                  key={moment.id} 
                  className="bg-white rounded-3xl p-4 shadow-xs border border-[#E8DCC4]/30 space-y-3 text-right"
                >
                  {/* Moment Author Info */}
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <div className="flex items-center gap-2">
                      <img 
                        src={currentUser.avatar || "https://api.dicebear.com/7.x/adventurer/svg"} 
                        alt="" 
                        className="w-8 h-8 rounded-full border border-slate-200"
                      />
                      <div className="text-right">
                        <h4 className="text-xs font-black text-[#4A3E3D]">{currentUser.name}</h4>
                        <span className="text-[8px] text-slate-400 font-bold block">{moment.timestamp}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleDeleteMoment(moment.id)}
                      className="text-slate-300 hover:text-red-500 transition p-1 rounded-full hover:bg-slate-50 cursor-pointer"
                      title="حذف المنشور"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Body Text */}
                  <p className="text-xs text-slate-600 leading-relaxed font-semibold whitespace-pre-wrap">
                    {moment.text}
                  </p>

                  {/* Actions (Likes, Comments) */}
                  <div className="flex items-center gap-4 pt-1 text-[10px] text-slate-400 font-bold">
                    <button 
                      onClick={() => {
                        // Toggle like simulation
                        const updated = moments.map(m => m.id === moment.id ? { ...m, likes: m.likes + 1 } : m);
                        setMoments(updated);
                        localStorage.setItem(`moments_${currentUser.id}`, JSON.stringify(updated));
                      }}
                      className="flex items-center gap-1 hover:text-red-500 transition cursor-pointer"
                    >
                      <span>❤️</span>
                      <span className="font-mono">{moment.likes}</span>
                    </button>

                    <span className="flex items-center gap-1">
                      <span>💬</span>
                      <span className="font-mono">{moment.commentsCount}</span>
                    </span>
                  </div>

                </div>
              ))}

              {moments.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-xs font-bold">لا توجد لحظات منشورة حتى الآن!</p>
                  <p className="text-[10px] text-slate-400 mt-1">ابدأ بمشاركة أولى لحظاتك لمتابعيك ليتفاعلوا معك.</p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Invite CP Modal Backdrop overlay */}
      {isInviteCpOpen && (
        <div className="absolute inset-0 bg-black/65 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm border border-[#E8DCC4] shadow-2xl text-right space-y-4 animate-scale-up">
            <h4 className="text-xs font-black text-[#4A3E3D] flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
              <span>💝</span> اختيار شريك الارتباط (CP)
            </h4>
            
            <p className="text-[10px] text-slate-500 leading-relaxed">
              اختر شريكاً من بين الأصدقاء النشطين في مجالس صدى العرب للارتباط وتفعيل مستوى CP المشترك!
            </p>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {users.filter(u => u.id !== currentUser.id).map(user => (
                <button
                  key={user.id}
                  onClick={() => {
                    setCpPartner(user);
                    setCpDays(1);
                    setIsInviteCpOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2 bg-slate-50 hover:bg-amber-50/50 rounded-xl border border-slate-100 transition text-right"
                >
                  <div className="flex items-center gap-2">
                    <img src={user.avatar} alt="" className="w-8 h-8 rounded-full border" />
                    <div>
                      <span className="text-[11px] font-black text-[#4A3E3D] block">{user.name}</span>
                      <span className="text-[8px] text-slate-400 font-bold block">مستوى {user.level || 1}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-amber-600 font-black">اختيار</span>
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsInviteCpOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs py-2 px-4 rounded-xl"
              >
                إلغاء
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
