import React, { useState, useEffect } from 'react';
import { ChevronRight, Search, UserPlus, UserMinus, ShieldAlert, Users, Award, Trash2, Clock } from 'lucide-react';
import { AppUser } from '../../types';
import { db } from '../../lib/firebase';
import { doc, updateDoc, getDoc, collection, query, where, onSnapshot, addDoc, getDocs, deleteDoc } from 'firebase/firestore';

interface Props {
  onBack: () => void;
  currentUser: AppUser | null;
  users: AppUser[];
}

interface AgencyInfo {
  id: string;
  agency_name: string;
  owner_name: string;
  whatsapp_number: string;
  display_id?: string;
  owner_id: string;
}

export default function AgencyPortalView({ onBack, currentUser, users }: Props) {
  const [agency, setAgency] = useState<AgencyInfo | null>(null);
  const [loadingAgency, setLoadingAgency] = useState(true);
  const [members, setMembers] = useState<AppUser[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [searchId, setSearchId] = useState('');
  const [searchedUser, setSearchedUser] = useState<AppUser | null>(null);
  const [searchError, setSearchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch current user's Agency in real-time
  useEffect(() => {
    if (!currentUser?.id) return;

    const agenciesRef = collection(db, 'agencies');
    const q = query(agenciesRef, where('owner_id', '==', currentUser.id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        setAgency({
          id: docSnap.id,
          ...docSnap.data()
        } as AgencyInfo);
      } else {
        setAgency(null);
      }
      setLoadingAgency(false);
    }, (err) => {
      console.error("Error fetching agency details:", err);
      setLoadingAgency(false);
    });

    return () => unsubscribe();
  }, [currentUser?.id]);

  // 2. Fetch all agency members in real-time
  useEffect(() => {
    if (!currentUser?.id) return;

    const q = query(collection(db, 'users'), where('agencyId', '==', currentUser.id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const agencyMembers: AppUser[] = [];
      snapshot.forEach((doc) => {
        agencyMembers.push({ id: doc.id, ...doc.data() } as AppUser);
      });
      setMembers(agencyMembers);
    }, (err) => {
      console.error("Error fetching agency members:", err);
    });

    return () => unsubscribe();
  }, [currentUser?.id]);

  // 3. Fetch pending invitations in real-time
  useEffect(() => {
    if (!currentUser?.id) return;

    const q = query(
      collection(db, 'agency_invitations'),
      where('agency_id', '==', currentUser.id),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setPendingInvitations(list);
    }, (err) => {
      console.error("Error fetching pending invitations:", err);
    });

    return () => unsubscribe();
  }, [currentUser?.id]);

  // Cancel invitation
  const handleCancelInvitation = async (invId: string) => {
    if (!window.confirm('هل أنت متأكد من إلغاء دعوة الانضمام هذه؟')) {
      return;
    }
    setActionError('');
    setActionSuccess('');

    try {
      await deleteDoc(doc(db, 'agency_invitations', invId));
      setActionSuccess('تم إلغاء دعوة الانضمام بنجاح.');
      setTimeout(() => setActionSuccess(''), 5000);
    } catch (err) {
      console.error("Error cancelling invitation:", err);
      setActionError('حدث خطأ أثناء إلغاء الدعوة.');
    }
  };

  // Handle Search for a target user to add
  const handleSearchUser = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    setSearchedUser(null);

    if (!searchId.trim()) {
      setSearchError('الرجاء إدخال رقم الآيدي الخاص بالمستخدم.');
      return;
    }

    // Look up by displayId or originalDisplayId or raw Firestore ID
    const target = users?.find(
      u => u.displayId === searchId.trim() || 
           u.originalDisplayId === searchId.trim() || 
           u.id === searchId.trim()
    );

    if (!target) {
      setSearchError('عذراً، لم يتم العثور على أي مستخدم بهذا الآيدي.');
      return;
    }

    if (target.id === currentUser?.id) {
      setSearchError('لا يمكنك إضافة نفسك إلى وكالتك الخاصة.');
      return;
    }

    if (target.agencyId) {
      setSearchError(`هذا المستخدم ينتمي بالفعل لوكالة أخرى (${target.agencyName || 'وكالة غير معروفة'}).`);
      return;
    }

    setSearchedUser(target);
  };

  // Add user to agency (Send invitation request)
  const handleAddMember = async () => {
    if (!searchedUser || !agency || !currentUser) return;
    setIsSubmitting(true);
    setActionError('');
    setActionSuccess('');

    try {
      // Check if there is already an active pending invitation for this user
      const q = query(
        collection(db, 'agency_invitations'),
        where('agency_id', '==', currentUser.id),
        where('target_user_id', '==', searchedUser.id),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setActionError('تم إرسال دعوة بالفعل لهذا المستخدم وهي بانتظار موافقته.');
        setIsSubmitting(false);
        return;
      }

      // Create pending invitation
      await addDoc(collection(db, 'agency_invitations'), {
        agency_id: currentUser.id,
        agency_name: agency.agency_name,
        owner_name: agency.owner_name,
        target_user_id: searchedUser.id,
        target_user_name: searchedUser.name,
        target_user_avatar: searchedUser.avatar || '',
        status: 'pending',
        timestamp: new Date().toISOString()
      });

      setActionSuccess(`تم إرسال دعوة الانضمام إلى (${searchedUser.name}) بنجاح! الطلب معلّق بانتظار موافقة المستخدم.`);
      setSearchedUser(null);
      setSearchId('');
      
      setTimeout(() => setActionSuccess(''), 6000);
    } catch (err) {
      console.error("Error creating agency invitation:", err);
      setActionError('حدث خطأ أثناء إرسال الدعوة. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove user from agency
  const handleRemoveMember = async (targetUser: AppUser) => {
    if (!window.confirm(`هل أنت متأكد من طرد العضو (${targetUser.name}) من الوكالة؟`)) {
      return;
    }

    setActionError('');
    setActionSuccess('');

    try {
      const userRef = doc(db, 'users', targetUser.id);
      await updateDoc(userRef, {
        agencyId: null,
        agencyName: null
      });

      setActionSuccess(`تم إزالة العضو (${targetUser.name}) من الوكالة بنجاح.`);
      setTimeout(() => setActionSuccess(''), 5000);
    } catch (err) {
      console.error("Error removing member from agency:", err);
      setActionError('حدث خطأ أثناء إزالة العضو.');
    }
  };

  if (loadingAgency) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0a0a0f] text-slate-400">
        <p className="font-bold text-sm">جاري تحميل بيانات الوكالة...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] text-slate-200 font-cairo" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-gradient-to-l from-indigo-900 to-[#0a0a0f] border-b border-white/10 sticky top-0 z-20">
        <button onClick={onBack} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition active:scale-95">
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">
          بوابة إدارة الوكالة
        </h2>
        <div className="w-10"></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Agency Info Display */}
        {agency ? (
          <div className="bg-gradient-to-br from-indigo-800/40 to-indigo-900/40 border border-indigo-500/20 rounded-3xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute -top-10 -right-10 opacity-10 text-9xl pointer-events-none">🏢</div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                <Award className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">{agency.agency_name}</h3>
                <p className="text-xs text-indigo-200">الوكالة الرسمية المعتمدة</p>
              </div>
            </div>

            <div className="bg-black/30 rounded-2xl p-4 space-y-3.5 border border-black/20 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold">صاحب الوكالة:</span>
                <span className="text-slate-200 font-black">{agency.owner_name}</span>
              </div>
              <div className="flex justify-between items-center border-t border-white/5 pt-3">
                <span className="text-slate-400 font-bold">رقم الواتساب:</span>
                <span className="text-indigo-300 font-mono font-bold" dir="ltr">+{agency.whatsapp_number}</span>
              </div>
              <div className="flex justify-between items-center border-t border-white/5 pt-3">
                <span className="text-slate-400 font-bold">رقم الآيدي:</span>
                <span className="text-slate-400 font-mono font-bold">{agency.display_id || agency.id}</span>
              </div>
              <div className="flex justify-between items-center border-t border-white/5 pt-3">
                <span className="text-slate-400 font-bold">عدد الأعضاء الحاليين:</span>
                <span className="text-indigo-400 font-bold">{members.length} عضو</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 text-center space-y-3">
            <ShieldAlert className="w-10 h-10 text-red-400 mx-auto" />
            <h3 className="text-sm font-black text-white">لم يتم العثور على وكالة</h3>
            <p className="text-xs text-slate-400">يبدو أنه لم يتم إعطاء وكالة لهذا الحساب بعد أو هناك خطأ في الصلاحيات.</p>
          </div>
        )}

        {agency && (
          <>
            {/* Add Member Section */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-black text-white">إضافة مستخدمين إلى الوكالة</h4>
              </div>

              <form onSubmit={handleSearchUser} className="flex gap-2">
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="أدخل آيدي المستخدم (مثال: 1001)"
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-right text-white focus:border-indigo-500 outline-none"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-5 py-3 rounded-xl transition flex items-center gap-1.5 active:scale-95 shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>بحث</span>
                </button>
              </form>

              {searchError && (
                <div className="text-red-400 text-xs font-bold bg-red-500/10 p-2.5 rounded-xl text-center">
                  {searchError}
                </div>
              )}

              {/* Searched User Result */}
              {searchedUser && (
                <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-3">
                    <img
                      src={searchedUser.avatar}
                      alt={searchedUser.name}
                      className="w-11 h-11 rounded-full object-cover bg-slate-800"
                    />
                    <div className="text-right space-y-0.5">
                      <h5 className="text-xs font-black text-white">{searchedUser.name}</h5>
                      <p className="text-[10px] text-slate-400">آيدي: {searchedUser.displayId || searchedUser.id}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleAddMember}
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black px-4 py-2.5 rounded-xl transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
                  >
                    <span>ضم للوكالة</span>
                  </button>
                </div>
              )}

              {actionError && (
                <div className="text-red-400 text-xs font-bold bg-red-500/10 p-2.5 rounded-xl text-center">
                  {actionError}
                </div>
              )}

              {actionSuccess && (
                <div className="text-emerald-400 text-xs font-bold bg-emerald-500/10 p-2.5 rounded-xl text-center">
                  {actionSuccess}
                </div>
              )}
            </div>

            {/* Pending Invitations Section */}
            {pendingInvitations.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                  <h4 className="text-sm font-black text-white">دعوات الانضمام المعلقة ({pendingInvitations.length})</h4>
                </div>

                <div className="divide-y divide-white/5 max-h-60 overflow-y-auto pr-1">
                  {pendingInvitations.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={inv.target_user_avatar || 'https://api.dicebear.com/7.x/bottts/svg'}
                          alt={inv.target_user_name}
                          className="w-10 h-10 rounded-full object-cover bg-slate-800"
                        />
                        <div className="text-right space-y-0.5">
                          <h5 className="text-xs font-black text-white">{inv.target_user_name}</h5>
                          <p className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                            <span>●</span> قيد الانتظار...
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCancelInvitation(inv.id)}
                        className="p-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition active:scale-95"
                        title="إلغاء الدعوة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Members List */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-black text-white">قائمة أعضاء الوكالة ({members.length})</h4>
              </div>

              {members.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4 font-bold">لا يوجد أي أعضاء مضافين في وكالتك حالياً.</p>
              ) : (
                <div className="divide-y divide-white/5 max-h-72 overflow-y-auto pr-1">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-10 h-10 rounded-full object-cover bg-slate-800"
                        />
                        <div className="text-right space-y-0.5">
                          <h5 className="text-xs font-black text-white">{member.name}</h5>
                          <p className="text-[9px] text-slate-400">آيدي: {member.displayId || member.id}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveMember(member)}
                        className="p-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition active:scale-95"
                        title="إزالة العضو"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
