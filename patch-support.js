import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf-8');

const targetStr = `const [supportChatOpen, setSupportChatOpen] = useState(false);
  const [supportChatMessages, setSupportChatMessages] = useState<Array<{ sender: string; text: string; isUser: boolean }>>([
    { sender: 'دعم صدى الفني 🐱', text: 'مرحباً بك في صدى العرب يا بطل! نحن هنا لخدمتك على مدار الساعة 🌟', isUser: false }
  ]);
  const [supportInput, setSupportInput] = useState('');`;

const replacementStr = `const [supportChatOpen, setSupportChatOpen] = useState(false);
  const [supportInput, setSupportInput] = useState('');
  
  // Real Firestore Support States
  const [activeSupportTicket, setActiveSupportTicket] = useState<SupportTicket | null>(null);
  const [supportMessages, setSupportMessages] = useState<SupportTicketMessage[]>([]);
  
  // Admin Support States
  const [isSupportAdminModalOpen, setIsSupportAdminModalOpen] = useState(false);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [activeAdminTicket, setActiveAdminTicket] = useState<SupportTicket | null>(null);
  const [adminSupportInput, setAdminSupportInput] = useState('');`;

if (content.includes(targetStr)) {
  fs.writeFileSync('src/App.tsx', content.replace(targetStr, replacementStr));
  console.log("Patched support states successfully");
} else {
  console.log("Could not find target string for support states");
}
