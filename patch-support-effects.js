import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf-8');

const targetStr = `useEffect(() => {
    if (currentUser?.id) {`;

const replacementStr = `useEffect(() => {
    // ---------------- Support Tickets Listener ----------------
    let unsubscribeUserTicket = () => {};
    let unsubscribeTicketMessages = () => {};
    let unsubscribeAdminTickets = () => {};

    if (currentUser?.id) {
      // 1. User side: Find their latest active ticket or any open ticket
      const ticketsQuery = query(
        collection(db, "support_tickets"),
        where("userId", "==", currentUser.id),
        orderBy("updatedAt", "desc"),
        limit(1)
      );

      unsubscribeUserTicket = onSnapshot(ticketsQuery, (snapshot) => {
        if (!snapshot.empty) {
          const ticketDoc = snapshot.docs[0];
          const ticketData = { id: ticketDoc.id, ...ticketDoc.data() } as SupportTicket;
          setActiveSupportTicket(ticketData);

          // 2. Fetch messages for this ticket
          const messagesQuery = query(
            collection(db, "support_tickets", ticketDoc.id, "messages"),
            orderBy("timestamp", "asc")
          );

          unsubscribeTicketMessages = onSnapshot(messagesQuery, (msgSnap) => {
            const msgs = msgSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SupportTicketMessage[];
            setSupportMessages(msgs);
          });
        } else {
          setActiveSupportTicket(null);
          setSupportMessages([]);
        }
      });
      
      // 3. Admin side: Find all open tickets
      if (currentUser.role === 'admin' || auth.currentUser?.email === 'karmo2931@gmail.com') {
        const adminTicketsQuery = query(
          collection(db, "support_tickets"),
          where("status", "==", "open"),
          orderBy("updatedAt", "desc")
        );
        unsubscribeAdminTickets = onSnapshot(adminTicketsQuery, (snap) => {
          const adminTkts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SupportTicket[];
          setSupportTickets(adminTkts);
        });
      }
    }

    return () => {
      unsubscribeUserTicket();
      unsubscribeTicketMessages();
      unsubscribeAdminTickets();
    };
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    // ---------------- Active Admin Ticket Messages Listener ----------------
    let unsubscribe = () => {};
    if (activeAdminTicket) {
      const messagesQuery = query(
        collection(db, "support_tickets", activeAdminTicket.id, "messages"),
        orderBy("timestamp", "asc")
      );
      unsubscribe = onSnapshot(messagesQuery, (snap) => {
        const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SupportTicketMessage[];
        setActiveTicketMessages(msgs);
      });
    }
    return () => unsubscribe();
  }, [activeAdminTicket]);

  useEffect(() => {
    if (currentUser?.id) {`;

if (content.includes(targetStr)) {
  fs.writeFileSync('src/App.tsx', content.replace(targetStr, replacementStr));
  console.log("Patched support effects successfully");
} else {
  console.log("Could not find target string for support effects");
}
