import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// The useEffect we want to extract
const useEffectStart = '  useEffect(() => {\n    // ---------------- Active Admin Ticket Messages Listener ----------------';
const useEffectEnd = '  }, [activeAdminTicket]);\n';

const startIndex = content.indexOf(useEffectStart);
const endIndex = content.indexOf(useEffectEnd, startIndex) + useEffectEnd.length;

if (startIndex !== -1 && endIndex !== -1) {
  const useEffectBlock = content.substring(startIndex, endIndex);
  
  // Remove it from the original place
  content = content.substring(0, startIndex) + content.substring(endIndex);
  
  // Find where to insert it: after activeAdminTicket declaration
  const insertTarget = "  const [activeAdminTicket, setActiveAdminTicket] = useState<SupportTicket | null>(null);\n";
  const insertIndex = content.indexOf(insertTarget);
  
  if (insertIndex !== -1) {
    const afterInsertIndex = insertIndex + insertTarget.length;
    
    // Add the missing state declaration as well
    const missingStateDecl = "  const [activeTicketMessages, setActiveTicketMessages] = useState<SupportTicketMessage[]>([]);\n";
    
    content = content.substring(0, afterInsertIndex) + missingStateDecl + "\n" + useEffectBlock + content.substring(afterInsertIndex);
    fs.writeFileSync('src/App.tsx', content);
    console.log("Fixed activeAdminTicket ReferenceError successfully");
  } else {
    console.log("Could not find insert target");
  }
} else {
  console.log("Could not find useEffect block to move");
}
