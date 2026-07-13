import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const startMarker = '{/* Drawer Input send bar */}';
const endMarker = '                            <Send className="w-3.5 h-3.5" />\n                          </button>';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker, startIndex) + endMarker.length;

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `{/* Drawer Input send bar */}
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
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>`;

  content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync('src/App.tsx', content);
  console.log("Patched input bar 2 successfully");
} else {
  console.log("Could not find start/end markers for input bar");
}
