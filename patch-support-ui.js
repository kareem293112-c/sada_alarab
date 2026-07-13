import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf-8');

const targetStr = `                        {/* Drawer Chat messages area */}
                        <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-[#FAF6EB]">
                          {supportChatMessages.map((msg, idx) => (
                            <div 
                              key={idx} 
                              className={\`flex \${msg.isUser ? 'justify-start' : 'justify-end'} text-right\`}
                            >
                              <div className={\`p-3 rounded-2xl text-xs max-w-[80%] shadow-sm \${
                                msg.isUser 
                                  ? 'bg-[#FFAE42] text-white rounded-tr-none' 
                                  : 'bg-white text-[#4A3E3D] rounded-tl-none border border-[#E8DCC4]/60'
                              }\`}>
                                <span className="block font-bold text-[8px] opacity-75 mb-1">{msg.sender}</span>
                                <p className="leading-relaxed">{msg.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Drawer Input send bar */}
                        <div className="p-3 bg-white border-t border-[#E8DCC4]/60 flex gap-2">
                          <input
                            type="text"
                            placeholder="اكتب رسالتك للدعم الفني هنا..."
                            value={supportInput}
                            onChange={(e) => setSupportInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (supportInput.trim()) {
                                  const uText = supportInput.trim();
                                  setSupportChatMessages(prev => [...prev, { sender: currentUser.name, text: uText, isUser: true }]);
                                  setSupportInput('');
                                  
                                  // Auto simulate supportive response
                                  setTimeout(() => {
                                    setSupportChatMessages(prev => [...prev, { 
                                      sender: 'دعم صدى الفني 🐱', 
                                      text: 'تسلم يا غالي! تم استلام رسالتك وتوجيهها للمستشارين والوكيل المعتمد لحلها فوراً. شكراً لتواصلك مع صدى العرب 💖', 
                                      isUser: false 
                                    }]);
                                  }, 1500);
                                }
                              }
                            }}
                            className="flex-grow bg-slate-50 border border-[#E8DCC4] rounded-full px-4 py-1.5 text-xs text-right focus:outline-none focus:border-[#FFAE42]"
                          />
                          <button 
                            onClick={() => {
                              if (supportInput.trim()) {
                                const uText = supportInput.trim();
                                setSupportChatMessages(prev => [...prev, { sender: currentUser.name, text: uText, isUser: true }]);
                                setSupportInput('');
                                
                                setTimeout(() => {
                                  setSupportChatMessages(prev => [...prev, { 
                                    sender: 'دعم صدى الفني 🐱', 
                                    text: 'تسلم يا غالي! تم استلام رسالتك وتوجيهها للمستشارين والوكيل المعتمد لحلها فوراً. شكراً لتواصلك مع صدى العرب 💖', 
                                    isUser: false 
                                  }]);
                                }, 1500);
                              }
                            }}
                            className="bg-[#FFAE42] text-white p-2 w-10 h-10 rounded-full flex items-center justify-center hover:bg-amber-500 shadow-sm transition active:scale-95"
                          >
                            ➤
                          </button>
                        </div>`;

const replacementStr = `                        {/* Drawer Chat messages area */}
                        <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-[#FAF6EB]">
                          {supportMessages.length === 0 && (
                            <div className="flex justify-end text-right">
                              <div className="p-3 rounded-2xl text-xs max-w-[80%] shadow-sm bg-white text-[#4A3E3D] rounded-tl-none border border-[#E8DCC4]/60">
                                <span className="block font-bold text-[8px] opacity-75 mb-1">دعم صدى الفني 🐱</span>
                                <p className="leading-relaxed">مرحباً بك في صدى العرب يا بطل! نحن هنا لخدمتك على مدار الساعة 🌟. اكتب مشكلتك هنا وسيرد عليك فريق الدعم قريباً.</p>
                              </div>
                            </div>
                          )}
                          {supportMessages.map((msg, idx) => (
                            <div 
                              key={idx} 
                              className={\`flex \${!msg.isAdmin ? 'justify-start' : 'justify-end'} text-right\`}
                            >
                              <div className={\`p-3 rounded-2xl text-xs max-w-[80%] shadow-sm \${
                                !msg.isAdmin 
                                  ? 'bg-[#FFAE42] text-white rounded-tr-none' 
                                  : 'bg-white text-[#4A3E3D] rounded-tl-none border border-[#E8DCC4]/60'
                              }\`}>
                                <span className="block font-bold text-[8px] opacity-75 mb-1">{msg.senderName}</span>
                                <p className="leading-relaxed">{msg.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Drawer Input send bar */}
                        <div className="p-3 bg-white border-t border-[#E8DCC4]/60 flex gap-2">
                          <input
                            type="text"
                            placeholder="اكتب رسالتك للدعم الفني هنا..."
                            value={supportInput}
                            onChange={(e) => setSupportInput(e.target.value)}
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter' && supportInput.trim()) {
                                const uText = supportInput.trim();
                                setSupportInput('');
                                try {
                                  let ticketId = activeSupportTicket?.id;
                                  if (!ticketId) {
                                    // Create new ticket
                                    const newTicketRef = doc(collection(db, "support_tickets"));
                                    ticketId = newTicketRef.id;
                                    await setDoc(newTicketRef, {
                                      userId: currentUser.id,
                                      userName: currentUser.name,
                                      userAvatar: currentUser.avatar || "",
                                      status: 'open',
                                      createdAt: new Date().toISOString(),
                                      updatedAt: new Date().toISOString()
                                    });
                                  } else {
                                    await updateDoc(doc(db, "support_tickets", ticketId), {
                                      updatedAt: new Date().toISOString()
                                    });
                                  }
                                  
                                  // Add message
                                  const newMsgRef = doc(collection(db, "support_tickets", ticketId, "messages"));
                                  await setDoc(newMsgRef, {
                                    senderId: currentUser.id,
                                    senderName: currentUser.name,
                                    text: uText,
                                    timestamp: new Date().toISOString(),
                                    isAdmin: false
                                  });
                                } catch(err) {
                                  console.error("Error sending support message", err);
                                }
                              }
                            }}
                            className="flex-grow bg-slate-50 border border-[#E8DCC4] rounded-full px-4 py-1.5 text-xs text-right focus:outline-none focus:border-[#FFAE42]"
                          />
                          <button 
                            onClick={async () => {
                              if (supportInput.trim()) {
                                const uText = supportInput.trim();
                                setSupportInput('');
                                try {
                                  let ticketId = activeSupportTicket?.id;
                                  if (!ticketId) {
                                    // Create new ticket
                                    const newTicketRef = doc(collection(db, "support_tickets"));
                                    ticketId = newTicketRef.id;
                                    await setDoc(newTicketRef, {
                                      userId: currentUser.id,
                                      userName: currentUser.name,
                                      userAvatar: currentUser.avatar || "",
                                      status: 'open',
                                      createdAt: new Date().toISOString(),
                                      updatedAt: new Date().toISOString()
                                    });
                                  } else {
                                    await updateDoc(doc(db, "support_tickets", ticketId), {
                                      updatedAt: new Date().toISOString()
                                    });
                                  }
                                  
                                  // Add message
                                  const newMsgRef = doc(collection(db, "support_tickets", ticketId, "messages"));
                                  await setDoc(newMsgRef, {
                                    senderId: currentUser.id,
                                    senderName: currentUser.name,
                                    text: uText,
                                    timestamp: new Date().toISOString(),
                                    isAdmin: false
                                  });
                                } catch(err) {
                                  console.error("Error sending support message", err);
                                }
                              }
                            }}
                            className="bg-[#FFAE42] text-white p-2 w-10 h-10 rounded-full flex items-center justify-center hover:bg-amber-500 shadow-sm transition active:scale-95"
                          >
                            ➤
                          </button>
                        </div>`;

if (content.includes(targetStr)) {
  fs.writeFileSync('src/App.tsx', content.replace(targetStr, replacementStr));
  console.log("Patched support UI successfully");
} else {
  console.log("Could not find target string for support UI");
}
