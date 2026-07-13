import React, { useState, useEffect } from 'react';
import { ChevronRight, Search, X, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle, ArrowLeftRight, TrendingUp } from 'lucide-react';
import { AppUser } from '../../types';
import { db } from '../../lib/firebase';
import { doc, updateDoc, getDoc, addDoc, collection } from 'firebase/firestore';

interface WalletViewProps {
  onBack: () => void;
  currentUser: AppUser | null;
  users: AppUser[];
}

export default function WalletView({ onBack, currentUser, users = [] }: WalletViewProps) {
  const [activeTab, setActiveTab] = useState<'coins' | 'diamonds'>('coins');
  const [isAgentListOpen, setIsAgentListOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Convert state
  const [convertAmount, setConvertAmount] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Live user fields
  const [liveCoins, setLiveCoins] = useState(currentUser?.coins || 0);
  const [liveDiamonds, setLiveDiamonds] = useState(currentUser?.diamonds || 0);

  // Confirmation Modal states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingAmount, setPendingAmount] = useState<number>(0);

  // Sync live balances
  useEffect(() => {
    if (currentUser) {
      setLiveCoins(currentUser.coins || 0);
      setLiveDiamonds(currentUser.diamonds || 0);
    }
  }, [currentUser]);

  // Extract agents
  const agents = users.filter(user => user.isAgent === true);

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (agent.displayId && agent.displayId.includes(searchQuery))
  );

  const handleCashout = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!currentUser?.id) return;

    const amount = parseInt(convertAmount);
    if (isNaN(amount) || amount <= 0) {
      setErrorMessage('الرجاء إدخال كمية صحيحة أكبر من صفر ⚠️');
      return;
    }

    if (amount > liveDiamonds) {
      setErrorMessage('رصيد الألماس الحالي غير كافٍ لإتمام عملية التحويل! ⚠️');
      return;
    }

    setPendingAmount(amount);
    setIsConfirmOpen(true);
  };

  const executeWithdrawal = async () => {
    setIsConfirmOpen(false);
    setIsConverting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const userRef = doc(db, "users", currentUser!.id);
      const snap = await getDoc(userRef);
      
      if (snap.exists()) {
        const userData = snap.data() as AppUser;
        const currentDiamonds = userData.diamonds || 0;
        const currentLocked = userData.lockedDiamonds || 0;

        if (pendingAmount > currentDiamonds) {
          setErrorMessage('رصيد الألماس الفعلي في قاعدة البيانات غير كافٍ.');
          setIsConverting(false);
          return;
        }

        const newDiamonds = currentDiamonds - pendingAmount;
        const newLockedDiamonds = currentLocked + pendingAmount;
        
        // Cashout math: 100,000 Diamonds = $100 total value.
        // User gets 80% ($80), platform gets 20% ($20).
        const withdrawalValueUSD = (pendingAmount / 100000) * 80.00;
        const platformRevenueUSD = (pendingAmount / 100000) * 20.00;

        // Update Firestore: Stage diamonds into lockedDiamonds
        await updateDoc(userRef, {
          diamonds: newDiamonds,
          lockedDiamonds: newLockedDiamonds
        });
        
        // Record withdrawal request in "withdrawal_requests" collection
        const agencyOwner = users.find(u => u.id === userData.agencyId);
        const agencyDisplayId = agencyOwner?.displayId || null;

        await addDoc(collection(db, "withdrawal_requests"), {
          userId: currentUser!.id,
          userDisplayId: currentUser!.displayId || currentUser!.id,
          userName: currentUser!.name || '',
          diamonds_deducted: pendingAmount,
          withdrawal_usd: withdrawalValueUSD,
          platform_revenue_usd: platformRevenueUSD,
          status: 'pending',
          created_at: new Date().toISOString(),
          agencyId: userData.agencyId || null,
          agencyName: userData.agencyName || null,
          agencyDisplayId: agencyDisplayId
        });

        // Update local visual states
        setLiveDiamonds(newDiamonds);
        setConvertAmount('');
        setSuccessMessage(`🎉 تم تقديم طلب السحب بقيمة $${withdrawalValueUSD.toFixed(2)} بنجاح وبانتظار موافقة الإدارة.`);
        
        // Auto clear success banner
        setTimeout(() => setSuccessMessage(''), 6000);
      }
    } catch (err) {
      console.error("Error executing withdrawal:", err);
      setErrorMessage('حدث خطأ أثناء تقديم طلب السحب. يرجى المحاولة لاحقاً.');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col bg-[#0b0a0e] text-slate-100 relative h-full w-full font-sans select-none" dir="rtl">
      
      {/* Top Header */}
      <div className="bg-[#121118]/90 backdrop-blur-md px-4 py-4 border-b border-white/5 flex items-center justify-between sticky top-0 z-30">
        <div className="w-8 h-8"></div> {/* Spacer for symmetry */}
        
        <h2 className="font-black text-base text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-400 to-orange-400 drop-shadow">
          محفظة الحساب الشخصية
        </h2>
        
        <button onClick={onBack} className="p-1.5 hover:bg-white/10 rounded-full transition active:scale-95 text-slate-300 hover:text-white cursor-pointer">
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Modern High-Fidelity Custom Tabs (Coins vs Diamonds) */}
      <div className="p-4 shrink-0">
        <div className="bg-[#17161f] p-1.5 rounded-2xl flex items-center gap-1.5 border border-white/5">
          <button
            onClick={() => {
              setActiveTab('coins');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'coins'
                ? 'bg-gradient-to-l from-amber-400 to-orange-500 text-slate-950 shadow-lg font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <span>🪙</span>
            <span>الكوينزات المشحونة</span>
          </button>
          
          <button
            onClick={() => {
              setActiveTab('diamonds');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'diamonds'
                ? 'bg-gradient-to-l from-pink-500 to-purple-600 text-white shadow-lg font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <span>💎</span>
            <span>الماس (الدعم المستلم)</span>
          </button>
        </div>
      </div>

      {/* Dynamic Tab Contents */}
      <div className="flex-grow overflow-y-auto px-4 pb-12 space-y-4">
        
        {/* SUCCESS / ERROR NOTIFICATIONS */}
        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black p-3.5 rounded-2xl text-center leading-relaxed animate-fade-in flex items-center justify-center gap-2 shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-black p-3.5 rounded-2xl text-center leading-relaxed animate-fade-in flex items-center justify-center gap-2 shadow-lg">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {activeTab === 'coins' ? (
          /* COINS TAB */
          <div className="space-y-4 animate-fade-in">
            {/* Giant Balance Card */}
            <div className="bg-gradient-to-br from-[#1c1a27] via-[#14131d] to-[#121118] border border-amber-500/20 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 text-8xl opacity-5 -translate-y-4 translate-x-4 select-none">🪙</div>
              <h3 className="font-bold text-[10px] text-amber-400/80 tracking-widest uppercase mb-1">الرصيد المشحون المتاح</h3>
              <p className="text-[10px] text-slate-500 font-semibold mb-3">تستخدم لإرسال الهدايا للآخرين ودعمهم في غرف الصوت</p>
              
              <div className="text-4xl font-mono font-black text-amber-300 tracking-tight mb-5 flex items-center justify-center gap-2 drop-shadow-[0_4px_10px_rgba(245,158,11,0.25)]">
                <span>🪙</span>
                <span>{liveCoins.toLocaleString()}</span>
              </div>
              
              <button 
                onClick={() => setIsAgentListOpen(true)}
                className="bg-gradient-to-l from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 active:scale-[0.98] text-slate-950 w-full py-3.5 rounded-xl font-black text-xs transition shadow-[0_4px_15px_rgba(245,158,11,0.3)] cursor-pointer flex justify-center items-center gap-2"
              >
                <span>⚡</span> تواصل مع وكيل معتمد للشحن
              </button>
            </div>

            {/* Quick Informational card */}
            <div className="bg-[#121118] border border-white/5 rounded-2xl p-4 flex items-start gap-3">
              <span className="text-lg">🛡️</span>
              <div className="space-y-1 text-right">
                <h4 className="text-xs font-black text-slate-200">شحن آمن وفوري وموثوق</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                  جميع عمليات شحن الكوينز تتم بإشراف الإدارة العامة لـ صدى العرب من خلال شبكة وكلائنا الرسميين المعتمدين عبر واتساب.
                </p>
              </div>
            </div>

            {/* Transaction log placeholder */}
            <div className="bg-[#121118] rounded-2xl p-4 border border-white/5">
              <h4 className="font-black text-slate-300 text-xs mb-3 flex items-center justify-between">
                <span>سجل تعبئة الكوينز</span>
                <span className="text-[9px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">تحديث فوري</span>
              </h4>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="text-3xl mb-2 opacity-40">📋</span>
                <p className="text-[10px] font-black text-slate-500">لا توجد عمليات شحن سابقة في هذا الحساب</p>
              </div>
            </div>
          </div>
        ) : (
          /* DIAMONDS TAB (RECEIVED SUPPORT) */
          <div className="space-y-4 animate-fade-in">
            {/* Giant Diamonds Card */}
            <div className="bg-gradient-to-br from-[#1d162b] via-[#14111d] to-[#110e19] border border-pink-500/20 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 text-8xl opacity-5 -translate-y-4 translate-x-4 select-none">💎</div>
              <h3 className="font-bold text-[10px] text-pink-400 tracking-widest uppercase mb-1">الماس المستلم (الدعم)</h3>
              <p className="text-[10px] text-slate-500 font-semibold mb-3">قيمة الدعم الفعلي الذي تلقيته من مستخدمي التطبيق بالكامل</p>
              
              <div className="text-4xl font-mono font-black text-pink-400 tracking-tight mb-5 flex items-center justify-center gap-2 drop-shadow-[0_4px_10px_rgba(236,72,153,0.25)]">
                <span>💎</span>
                <span>{liveDiamonds.toLocaleString()}</span>
              </div>
              
              <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-right">
                  <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-[10px] font-black text-slate-300">نسبة أرباح المنصة</span>
                </div>
                <span className="text-[10px] font-black text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                  100,000 💎 = $80.00 USD (نسبة سحب 80%)
                </span>
              </div>
            </div>

            {/* Live Interactive Cashout Form */}
            <div className="bg-[#121118] border border-white/5 rounded-3xl p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-pink-400" />
                  <h4 className="text-sm font-black text-slate-200">سحب الأرباح (Cashout)</h4>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">سحب مالي حقيقي</span>
              </div>

              <form onSubmit={handleCashout} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 block text-right pr-1">الكمية المراد سحبها:</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0"
                      value={convertAmount}
                      onChange={(e) => {
                        setConvertAmount(e.target.value);
                        setErrorMessage('');
                      }}
                      className="w-full h-16 bg-[#181622] border-2 border-white/10 hover:border-white/20 focus:border-pink-500 rounded-2xl px-6 text-xl text-right outline-none focus:ring-2 focus:ring-pink-500/20 transition-all font-mono font-bold text-white placeholder-slate-500"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl select-none">💎</span>
                  </div>
                </div>

                {/* Cashout Preview */}
                {parseInt(convertAmount) > 0 && (
                  <div className="bg-slate-500/5 p-4 rounded-xl border border-dashed border-white/5 flex items-center justify-between text-sm animate-fade-in">
                    <span className="text-xs text-slate-400 font-bold">قيمة السحب المستحقة (80%):</span>
                    <div className="flex items-center gap-1.5 font-mono font-black text-emerald-400 text-base">
                      <span>$</span>
                      <span>{((parseInt(convertAmount) / 100000) * 80).toFixed(2)} USD</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isConverting || !convertAmount}
                  className="w-full py-4 bg-gradient-to-l from-pink-500 via-pink-600 to-purple-600 hover:from-pink-600 hover:to-purple-700 active:scale-[0.98] text-white font-black text-sm rounded-xl transition-all shadow-[0_4px_15px_rgba(236,72,153,0.3)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isConverting ? (
                    <span>جاري تقديم الطلب...</span>
                  ) : (
                    <>
                      <span>✨ تأكيد عملية السحب</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Support explanation info card */}
            <div className="bg-[#121118] border border-white/5 rounded-2xl p-4 flex items-start gap-3">
              <span className="text-lg">💝</span>
              <div className="space-y-1 text-right">
                <h4 className="text-xs font-black text-slate-200">الشفافية الكاملة في الدعم</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                  تحت شعار "الشفافية التامة"، قمنا ببرمجة النظام بحيث تصل إليك كامل قيمة الدعم الذي اندعمت به في المجلس دون أي استقطاعات إدارية، لتستطيع تدويرها ككوينزات لإهداء أصدقائك من جديد.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Slide-up Agent List Modal */}
      {isAgentListOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/80 z-40 animate-fade-in cursor-pointer backdrop-blur-sm"
            onClick={() => setIsAgentListOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 bg-[#121118] rounded-t-[28px] border-t border-white/10 p-4 z-50 animate-slide-up shadow-2xl max-h-[85%] flex flex-col max-w-md mx-auto">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-3 shrink-0">
              <button 
                onClick={() => setIsAgentListOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-full transition text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-black text-slate-100 text-sm flex items-center gap-1.5">
                <span>🛡️</span> شبكة الوكلاء المعتمدين للشحن
              </h3>
            </div>

            {/* Subtext */}
            <p className="text-[11px] text-slate-400 leading-relaxed mb-4 text-right shrink-0">
              لتعبئة وشحن حسابك بالكوينزات، يرجى التواصل مباشرة مع أحد وكلائنا المعتمدين أدناه عبر تطبيق <strong className="text-emerald-400 font-black">واتساب</strong> لشحن رصيدك فورياً وبأمان.
            </p>

            {/* Search Bar */}
            <div className="relative mb-4 shrink-0">
              <input
                type="text"
                placeholder="ابحث عن اسم وكيل أو معرّف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#181622] border border-white/10 text-slate-100 rounded-xl px-4 py-2.5 text-xs text-right outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* List */}
            <div className="flex-grow overflow-y-auto space-y-2.5 min-h-[220px] pb-4">
              {filteredAgents.length === 0 ? (
                <div className="bg-white/5 p-8 rounded-xl text-center text-slate-500 text-xs border border-dashed border-white/5">
                  لا يوجد وكلاء متاحون حالياً أو يطابقون بحثك.
                </div>
              ) : (
                filteredAgents.map((agent) => {
                  let cleanWhatsapp = agent.whatsapp ? agent.whatsapp.replace(/\D/g, '') : '';
                  
                  if (cleanWhatsapp.startsWith('00')) {
                    cleanWhatsapp = cleanWhatsapp.slice(2);
                  }

                  const countryCodes = ['966', '964', '962', '971', '967', '963', '965', '973', '974', '968', '961', '970', '972', '20'];
                  for (const code of countryCodes) {
                    if (cleanWhatsapp.startsWith(code + '0')) {
                      cleanWhatsapp = code + cleanWhatsapp.slice(code.length + 1);
                      break;
                    }
                  }

                  const hasWhatsapp = !!cleanWhatsapp;
                  const waUrl = hasWhatsapp ? `https://wa.me/${cleanWhatsapp}` : '#';
                  
                  return (
                    <div 
                      key={agent.id} 
                      className="bg-white/5 p-3 rounded-2xl border border-white/5 flex justify-between items-center hover:bg-[#181622] transition-colors"
                    >
                      {hasWhatsapp ? (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#25D366] hover:bg-[#20ba56] active:scale-95 text-slate-950 font-black text-[10px] px-3.5 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-sm shadow-emerald-500/10"
                        >
                          <span>💬</span>
                          شحن واتساب
                        </a>
                      ) : (
                        <button
                          disabled
                          className="bg-white/5 text-slate-500 font-bold text-[10px] px-3.5 py-2 rounded-xl cursor-not-allowed"
                        >
                          رقم غير محدد
                        </button>
                      )}

                      <div className="flex items-center gap-2.5">
                        <div className="text-right">
                          <h4 className="text-xs font-black text-slate-200 flex items-center gap-1 justify-end">
                            <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-black flex items-center gap-0.5 shrink-0 border border-amber-500/10">
                              <span>⚡</span> وكيل معتمد
                            </span>
                            <span className="truncate max-w-[100px] inline-block">{agent.name}</span>
                          </h4>
                          <span className="text-[9px] text-slate-500 font-mono block mt-0.5">ID: {agent.displayId || agent.id.slice(0, 8)}</span>
                        </div>
                        <img 
                          src={agent.avatar || "https://api.dicebear.com/7.x/adventurer/svg"} 
                          alt={agent.name} 
                          className="w-10 h-10 rounded-full border border-white/10 bg-[#121118]" 
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </>
      )}

      {/* Interactive Withdrawal Confirmation Popup (User Side) */}
      {isConfirmOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/85 z-[100] animate-fade-in backdrop-blur-sm"
            onClick={() => setIsConfirmOpen(false)}
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <div className="bg-[#121118] border border-white/10 rounded-[28px] max-w-sm w-full p-6 shadow-2xl space-y-5 text-right font-sans animate-scale-up">
              
              {/* Header */}
              <div className="border-b border-white/5 pb-3">
                <h3 className="font-black text-base text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-400 to-orange-400">
                  تأكيد طلب السحب المالي
                </h3>
              </div>

              {/* Layout Content */}
              <div className="space-y-3.5 text-xs text-slate-300">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="font-semibold text-slate-400 mb-1">الآيدي الحقيقي للحساب:</p>
                  <p className="font-mono text-sm font-black text-amber-300">
                    {currentUser?.displayId || currentUser?.id}
                  </p>
                </div>

                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="font-semibold text-slate-400 mb-1">إجمالي التاركت الذي تم تسكيره:</p>
                  <p className="font-mono text-sm font-black text-pink-400">
                    {pendingAmount.toLocaleString()} 💎
                  </p>
                </div>

                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="font-semibold text-slate-400 mb-1">المبلغ المستحق بالدولار:</p>
                  <p className="font-mono text-sm font-black text-emerald-400">
                    ${((pendingAmount / 100000) * 80).toFixed(2)} USD
                  </p>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-xl text-[10px] leading-relaxed font-bold">
                  ⚠️ تنبيه: سيتم إرسال طلبك للإدارة للمراجعة، وسيتم تسليم الراتب يدوياً خارج التطبيق فور الموافقة.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={executeWithdrawal}
                  className="w-full py-3.5 bg-gradient-to-l from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 active:scale-[0.98] text-slate-950 font-black text-xs rounded-xl shadow-[0_4px_15px_rgba(245,158,11,0.25)] transition duration-200 cursor-pointer text-center"
                >
                  إرسال الطلب للإدارة
                </button>
                
                <button
                  onClick={() => setIsConfirmOpen(false)}
                  className="w-full py-3.5 bg-white/5 hover:bg-white/10 active:scale-[0.98] text-slate-300 hover:text-white font-bold text-xs rounded-xl transition duration-200 cursor-pointer text-center"
                >
                  إلغاء
                </button>
              </div>

            </div>
          </div>
        </>
      )}

    </div>
  );
}
