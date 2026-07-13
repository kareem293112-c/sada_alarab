import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const targetStr = `              {/* SYSTEM ADMIN MANAGEMENT MODAL */}`;

const replacementStr = `              {/* SUPPORT ADMIN MODAL */}
              {isSupportAdminModalOpen && (
                <>
                  <div 
                    className="absolute inset-0 bg-black/60 z-40 animate-fade-in cursor-pointer"
                    onClick={() => setIsSupportAdminModalOpen(false)}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-white border-t border-amber-500/40 rounded-t-[32px] z-50 animate-fade-in shadow-2xl text-right font-sans h-[90%] flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center border-b border-slate-100 p-5 bg-gradient-to-r from-amber-50 to-yellow-50">
                      <button 
                        onClick={() => {
                          if (activeAdminTicket) {
                            setActiveAdminTicket(null);
                          } else {
                            setIsSupportAdminModalOpen(false);
                          }
                        }}
                        className="text-xs text-slate-500 hover:text-slate-800 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 cursor-pointer font-black transition"
                      >
                        {activeAdminTicket ? 'رجوع' : 'إغلاق'}
                      </button>
                      <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5 font-sans">
                        <span>طلبات الدعم الفني</span>
                        <span>🛡️</span>
                      </h4>
                    </div>

                    {!activeAdminTicket ? (
                      <div className="flex-grow overflow-y-auto p-4 space-y-3">
                        {supportTickets.length === 0 ? (
                          <div className="text-center py-10 text-slate-400 font-bold text-xs">
                            لا توجد طلبات دعم فني مفتوحة حالياً
                          </div>
                        ) : (
                          supportTickets.map(ticket => (
                            <div 
                              key={ticket.id}
                              onClick={() => setActiveAdminTicket(ticket)}
                              className="bg-white border border-slate-200 p-3 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-slate-50 transition shadow-sm"
                            >
                              <div className="text-left text-xs font-bold text-amber-500">
                                رد على الطلب ➤
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <div className="font-bold text-xs text-slate-800">{ticket.userName}</div>
                                  <div className="text-[10px] text-slate-500">{new Date(ticket.updatedAt).toLocaleString('ar-EG')}</div>
                                </div>
                                <img src={ticket.userAvatar} alt="user" className="w-10 h-10 rounded-full border-2 border-amber-100 object-cover" />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    ) : (
                      <div className="flex-grow flex flex-col h-full overflow-hidden">
                        <div className="bg-amber-100 text-amber-800 p-2 text-center text-[10px] font-bold">
                          أنت ترد كـ "دعم صدى الفني 🐱"
                        </div>
                        <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-[#FAF6EB]">
                          {activeTicketMessages.map((msg, idx) => (
                            <div 
                              key={idx} 
                              className={\`flex \${msg.isAdmin ? 'justify-end' : 'justify-start'} text-right\`}
                            >
                              <div className={\`p-3 rounded-2xl text-xs max-w-[80%] shadow-sm \${
                                msg.isAdmin 
                                  ? 'bg-white text-[#4A3E3D] rounded-tl-none border border-[#E8DCC4]/60'
                                  : 'bg-[#FFAE42] text-white rounded-tr-none'
                              }\`}>
                                <span className="block font-bold text-[8px] opacity-75 mb-1">{msg.senderName}</span>
                                <p className="leading-relaxed">{msg.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="p-3 bg-white border-t border-[#E8DCC4]/60 flex gap-2">
                          <input
                            type="text"
                            placeholder="اكتب ردك للعميل..."
                            value={adminSupportInput}
                            onChange={(e) => setAdminSupportInput(e.target.value)}
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter' && adminSupportInput.trim()) {
                                const uText = adminSupportInput.trim();
                                setAdminSupportInput('');
                                try {
                                  // Update ticket updatedAt
                                  await updateDoc(doc(db, "support_tickets", activeAdminTicket.id), {
                                    updatedAt: new Date().toISOString()
                                  });
                                  
                                  // Add message
                                  const newMsgRef = doc(collection(db, "support_tickets", activeAdminTicket.id, "messages"));
                                  await setDoc(newMsgRef, {
                                    senderId: 'admin',
                                    senderName: 'دعم صدى الفني 🐱',
                                    text: uText,
                                    timestamp: new Date().toISOString(),
                                    isAdmin: true
                                  });
                                } catch(err) {
                                  console.error("Error sending admin support reply", err);
                                }
                              }
                            }}
                            className="flex-grow bg-slate-50 border border-[#E8DCC4] rounded-full px-4 py-1.5 text-xs text-right focus:outline-none focus:border-[#FFAE42]"
                          />
                          <button 
                            onClick={async () => {
                              if (adminSupportInput.trim()) {
                                const uText = adminSupportInput.trim();
                                setAdminSupportInput('');
                                try {
                                  await updateDoc(doc(db, "support_tickets", activeAdminTicket.id), {
                                    updatedAt: new Date().toISOString()
                                  });
                                  const newMsgRef = doc(collection(db, "support_tickets", activeAdminTicket.id, "messages"));
                                  await setDoc(newMsgRef, {
                                    senderId: 'admin',
                                    senderName: 'دعم صدى الفني 🐱',
                                    text: uText,
                                    timestamp: new Date().toISOString(),
                                    isAdmin: true
                                  });
                                } catch(err) {
                                  console.error("Error sending admin support reply", err);
                                }
                              }
                            }}
                            className="bg-[#FFAE42] text-white p-2 rounded-full hover:bg-amber-500 active:scale-95 transition flex items-center justify-center cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="p-2 border-t border-slate-100 flex justify-center bg-white">
                           <button 
                             onClick={async () => {
                               if(window.confirm('هل تريد إغلاق هذا الطلب؟')) {
                                 await updateDoc(doc(db, "support_tickets", activeAdminTicket.id), {
                                   status: 'closed',
                                   updatedAt: new Date().toISOString()
                                 });
                                 setActiveAdminTicket(null);
                               }
                             }}
                             className="text-red-500 font-bold text-xs py-1 px-3 bg-red-50 rounded-full hover:bg-red-100"
                           >
                             إغلاق تذكرة الدعم
                           </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* SYSTEM ADMIN MANAGEMENT MODAL */}`;

if (content.includes(targetStr)) {
  fs.writeFileSync('src/App.tsx', content.replace(targetStr, replacementStr));
  console.log("Patched support admin modal successfully");
} else {
  console.log("Could not find admin management modal target string");
}
