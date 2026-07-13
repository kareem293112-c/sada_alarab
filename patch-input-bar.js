import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const targetStr = `{/* Drawer Input send bar */}
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
                            className="bg-[#FFAE42] text-white p-2 rounded-full hover:bg-amber-500 active:scale-95 transition flex items-center justify-center cursor-pointer"
                          >`;

const replacementStr = `{/* Drawer Input send bar */}
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
                            className="bg-[#FFAE42] text-white p-2 rounded-full hover:bg-amber-500 active:scale-95 transition flex items-center justify-center cursor-pointer"
                          >`;

if (content.includes(targetStr)) {
  fs.writeFileSync('src/App.tsx', content.replace(targetStr, replacementStr));
  console.log("Patched input bar successfully");
} else {
  console.log("Could not find input bar target string");
}
