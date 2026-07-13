import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf-8');

const startMarker = '{/* Avatar with beautiful gold crow';
const endMarker = '<span>{icon}</span>';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `                            {/* Avatar with beautiful gold crown frame */}
                            <div className="relative">
                              <div className="w-14 h-14 rounded-full border-2 border-amber-400 p-0.5 shadow-md bg-amber-50/10">
                                <img
                                  src={currentUser.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=placeholder"}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full rounded-full object-cover"
                                />
                              </div>
                              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-md rotate-12">👑</span>
                            </div>

                            <div className="text-right">
                              <h3 className="text-sm font-black flex items-center gap-1.5 font-sans">
                                <span>{currentUser.name}</span>
                                <span className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full shadow-sm border border-purple-400/20">
                                  VIP {currentUser.vipLevel || 1}
                                </span>
                              </h3>
                              <p className="text-[10px] text-amber-100 font-mono mt-0.5">معرف الحساب: {currentUser.id}</p>
                              
                              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                <span className="bg-amber-400/20 text-amber-300 text-[8px] px-2 py-0.5 rounded border border-amber-400/20 font-bold">
                                  مستوى الحساب: {currentUser.level}
                                </span>
                                {currentUser.clanId && (
                                  <span className="bg-blue-400/20 text-blue-300 text-[8px] px-2 py-0.5 rounded border border-blue-400/20 font-bold">
                                    🛡️ عائلة: {currentUser.clanId}
                                  </span>
                                )}
                              </div>

                              {currentUser.badges && currentUser.badges.length > 0 && (
                                <div className="flex gap-1 mt-1.5 flex-wrap">
                                  {currentUser.badges.map((badgeId) => {
                                    let icon = "🏅";
                                    let name = badgeId;
                                    if (badgeId === 'king') { icon = "👑"; name = "الملك"; }
                                    else if (badgeId === 'diamond_charger') { icon = "💎"; name = "الداعم الماسي"; }
                                    else if (badgeId === 'loyal_member') { icon = "🛡️"; name = "العضو الوفي"; }
                                    else if (badgeId === 'charm_prince') { icon = "✨"; name = "أمير الجاذبية"; }
                                    
                                    return (
                                      <span key={badgeId} className="bg-amber-400/25 border border-amber-400/40 px-1.5 py-0.5 rounded-full text-[7.5px] text-amber-200 font-extrabold flex items-center gap-0.5">
                                        `;
  
  const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync('src/App.tsx', newContent);
  console.log('Fixed successfully!');
} else {
  console.log('Markers not found', startIndex, endIndex);
}
