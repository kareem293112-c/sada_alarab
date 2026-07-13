import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';

export const saveAgencyData = async (
  userId: string, 
  displayId: string,
  agencyName: string, 
  ownerName: string, 
  whatsappNumber: string
): Promise<string> => {
  const agencyData = {
    owner_id: userId,
    display_id: displayId,
    agency_name: agencyName,
    owner_name: ownerName,
    whatsapp_number: whatsappNumber,
    created_at: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, "agencies"), agencyData);
  await updateDoc(doc(db, "users", userId), {
    role: 'agency_owner'
  });
  return docRef.id;
};

export const toggleUserAgentStatus = async (userId: string, isAgent: boolean): Promise<void> => {
  await updateDoc(doc(db, "users", userId), {
    isAgent: isAgent
  });
};

export const updateUserWhatsapp = async (userId: string, whatsapp: string): Promise<void> => {
  await updateDoc(doc(db, "users", userId), {
    whatsapp: whatsapp
  });
};
