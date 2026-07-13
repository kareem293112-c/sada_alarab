import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const targetStr = `                            <button 
                              onClick={() => setIsAdminManageModalOpen(true)}
                              className="w-full bg-red-50 text-red-600 border border-red-200 font-black text-[10px] px-3 py-2.5 rounded-xl shadow-sm hover:bg-red-100 transition cursor-pointer flex justify-center items-center gap-1.5"
                            >
                              <span>⚙️</span>
                              <span>فتح لوحة إدارة الوكلاء</span>
                            </button>
                          </div>
                        )}
`;

const replacementStr = `                            <button 
                              onClick={() => setIsAdminManageModalOpen(true)}
                              className="w-full bg-red-50 text-red-600 border border-red-200 font-black text-[10px] px-3 py-2.5 rounded-xl shadow-sm hover:bg-red-100 transition cursor-pointer flex justify-center items-center gap-1.5 mb-2"
                            >
                              <span>⚙️</span>
                              <span>فتح لوحة إدارة الوكلاء</span>
                            </button>
                            <button 
                              onClick={() => setIsSupportAdminModalOpen(true)}
                              className="w-full bg-amber-50 text-amber-600 border border-amber-200 font-black text-[10px] px-3 py-2.5 rounded-xl shadow-sm hover:bg-amber-100 transition cursor-pointer flex justify-center items-center gap-1.5"
                            >
                              <span>🛡️</span>
                              <span>طلبات الدعم الفني ({supportTickets.length})</span>
                            </button>
                          </div>
                        )}
`;

if (content.includes(targetStr)) {
  fs.writeFileSync('src/App.tsx', content.replace(targetStr, replacementStr));
  console.log("Patched admin button successfully");
} else {
  console.log("Could not find admin button target string");
}
