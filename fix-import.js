import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');
content = content.replace(
  "import { collection, onSnapshot, addDoc, query, updateDoc, doc, setDoc, deleteDoc, runTransaction, increment, serverTimestamp, where, getDoc, orderBy, arrayUnion, arrayRemove } from 'firebase/firestore';",
  "import { collection, onSnapshot, addDoc, query, updateDoc, doc, setDoc, deleteDoc, runTransaction, increment, serverTimestamp, where, getDoc, orderBy, arrayUnion, arrayRemove, limit } from 'firebase/firestore';"
);
fs.writeFileSync('src/App.tsx', content);
console.log("Import patched.");
