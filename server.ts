import cors from 'cors';
import express from "express";
import path from "path";
import http from "http";
import 'dotenv/config';
import agoraToken from 'agora-access-token';
const RtcTokenBuilder = (agoraToken as any).RtcTokenBuilder || (agoraToken as any).default?.RtcTokenBuilder;
const RtcRole = (agoraToken as any).RtcRole || (agoraToken as any).default?.RtcRole;
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { GoogleAuth } from "google-auth-library";

// Dynamic PORT assignment for Render or any platform
const PORT = Number(process.env.PORT) || 3000;

// Initialize Firebase Admin SDK lazily with fallback
let firestoreDbInstance: any = null;
let firebaseInitialized = false;
let firestoreDisabled = false;

async function checkFirestoreAccess() {
  if (firestoreDisabled) return;
  try {
    try {
      const auth = new GoogleAuth();
      await auth.getApplicationDefault();
    } catch (credentialError: any) {
      console.warn("⚠️ Google Application Default Credentials are not available. Local DB active.");
      firestoreDbInstance = null;
      firebaseInitialized = true;
      firestoreDisabled = true;
      return;
    }

    const apps = getApps();
    const customDbId = "ai-studio-sadaalarabvoiceb-5f452604-580f-4265-ab18-da9c404b3698";
    const projectId = "gen-lang-client-0348881645";
    
    let app;
    if (apps.length === 0) {
      app = initializeApp({
        credential: applicationDefault(),
        projectId: projectId
      });
    } else {
      app = apps[0];
    }

    const tempDb = getFirestore(app, customDbId);
    await tempDb.collection("users").limit(1).get();
    
    firestoreDbInstance = tempDb;
    firebaseInitialized = true;
    console.log("Firestore connection verified. Operating in Cloud Database mode.");
  } catch (error: any) {
    console.log("Firestore is offline or unauthorized. Operating in secure Local JSON storage mode.");
    firestoreDbInstance = null;
    firebaseInitialized = true;
    firestoreDisabled = true;
  }
}

function getFirestoreDb() {
  if (firestoreDisabled || !firebaseInitialized) return null;
  return firestoreDbInstance;
}

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

interface CustomWebSocket extends WebSocket {
  roomId?: string;
  userId?: string;
  userName?: string;
}

const roomClients = new Map<string, Set<CustomWebSocket>>();

// Broadcast to room helper
function broadcastToRoom(roomId: string, message: any, excludeClient?: CustomWebSocket) {
  const clients = roomClients.get(roomId);
  if (!clients) return;
  const msgString = JSON.stringify(message);
  for (const client of clients) {
    if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
      client.send(msgString);
    }
  }
}

// Broadcast active room users list to everyone in that room
function broadcastRoomUsers(roomId: string) {
  const clients = roomClients.get(roomId);
  if (!clients) return;
  const activeUsers: Array<{ id: string; name: string; avatar: string }> = [];
  for (const client of clients) {
    if (client.userId && client.readyState === WebSocket.OPEN) {
      activeUsers.push({
        id: client.userId,
        name: client.userName || 'مستشار صدى',
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${client.userId}`
      });
    }
  }
  const uniqueUsers = Array.from(new Map(activeUsers.map(item => [item.id, item])).values());
  broadcastToRoom(roomId, {
    type: "room_users_changed",
    users: uniqueUsers
  });
}

// WebSocket Connection Handler
wss.on("connection", (ws: CustomWebSocket) => {
  ws.on("message", async (messageBuffer) => {
    try {
      const data = JSON.parse(messageBuffer.toString());
      const { action, roomId, userId, userName } = data;

      if (action === "join") {
        ws.roomId = roomId;
        ws.userId = userId;
        ws.userName = userName;

        if (!roomClients.has(roomId)) {
          roomClients.set(roomId, new Set());
        }
        roomClients.get(roomId)!.add(ws);

        broadcastToRoom(roomId, {
          type: "system_message",
          text: `دخل ${userName} إلى المجلس`,
          userId,
          userName,
          timestamp: new Date().toISOString()
        }, ws);

        ws.send(JSON.stringify({
          type: "join_success",
          roomId,
          message: "تم الاتصال بالغرفة بنجاح!"
        }));

        broadcastRoomUsers(roomId);
      }

      else if (action === "leave") {
        const savedRoomId = ws.roomId;
        if (ws.roomId && roomClients.has(ws.roomId)) {
          roomClients.get(ws.roomId)!.delete(ws);
        }
        if (savedRoomId) {
          broadcastRoomUsers(savedRoomId);
        }
      }

      else if (action === "register") {
        ws.userId = userId;
        ws.userName = userName;
      }

      else if (action === "chat_message") {
        const { text, avatar, senderLevel } = data;
        broadcastToRoom(roomId, {
          type: "new_chat_message",
          id: Math.random().toString(36).substring(7),
          senderId: userId,
          senderName: userName,
          senderAvatar: avatar,
          senderLevel,
          text,
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        });
      }
    } catch (e) {
      console.error("Error processing websocket message:", e);
    }
  });

  ws.on("close", () => {
    const savedRoomId = ws.roomId;
    if (ws.roomId && roomClients.has(ws.roomId)) {
      roomClients.get(ws.roomId)!.delete(ws);
    }
    if (savedRoomId) {
      broadcastRoomUsers(savedRoomId);
    }
  });
});

// REST API ENDPOINTS
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

function getXpForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += Math.floor(Math.pow(i, 3) * 150) + 500;
  }
  return total;
}

function getLevelFromXp(xp: number): number {
  if (!xp || xp < 0) return 1;
  let level = 1;
  while (level < 500) {
    const nextXp = getXpForLevel(level + 1);
    if (xp >= nextXp) {
      level++;
    } else {
      break;
    }
  }
  return level;
}

app.post("/api/send-gift", async (req, res) => {
  const { senderId, receiverId, giftCost } = req.body;
  if (!senderId || !giftCost) {
    return res.status(400).json({ error: "Missing senderId or giftCost" });
  }

  const dbInstance = getFirestoreDb();
  if (!dbInstance) {
    // Fallback: If DB is inactive (local mode), return success and let the client handle local updates
    return res.json({ success: true, fallback: true });
  }

  try {
    const senderRef = dbInstance.collection("users").doc(senderId);
    
    const result = await dbInstance.runTransaction(async (transaction: any) => {
      const senderDoc = await transaction.get(senderRef);
      if (!senderDoc.exists) {
        throw new Error("Sender does not exist");
      }
      
      const senderData = senderDoc.data() || {};
      const currentCoins = senderData.coins || 0;
      if (currentCoins < giftCost) {
        throw new Error("Insufficient coins balance");
      }

      // Check if supporting themselves
      if (receiverId && senderId === receiverId) {
        const currentDiamonds = senderData.diamonds || 0;
        const currentCharmXp = senderData.charmXp || 0;
        const currentXp = senderData.xp || 0;

        const newCoins = currentCoins - giftCost;
        const newDiamonds = currentDiamonds + giftCost;
        const newCharmXp = currentCharmXp + giftCost;
        const newXp = currentXp + giftCost;
        const newLevel = getLevelFromXp(newXp);
        const newSenderXpSpent = (senderData.senderXp || 0) + giftCost;

        transaction.update(senderRef, {
          coins: newCoins,
          diamonds: newDiamonds,
          charmXp: newCharmXp,
          xp: newXp,
          level: newLevel,
          senderXp: newSenderXpSpent
        });
      } else {
        // Deduct coins from sender and add sender XP
        const newSenderCoins = currentCoins - giftCost;
        const newSenderXp = (senderData.xp || 0) + giftCost;
        const newSenderLevel = getLevelFromXp(newSenderXp);
        const newSenderXpSpent = (senderData.senderXp || 0) + giftCost;

        transaction.update(senderRef, {
          coins: newSenderCoins,
          xp: newSenderXp,
          level: newSenderLevel,
          senderXp: newSenderXpSpent
        });

        // If there is a receiver, award them diamonds and charmXp of the SAME VALUE as the gift cost!
        if (receiverId) {
          const receiverRef = dbInstance.collection("users").doc(receiverId);
          const receiverDoc = await transaction.get(receiverRef);
          if (receiverDoc.exists) {
            const receiverData = receiverDoc.data() || {};
            const currentDiamonds = receiverData.diamonds || 0;
            const currentCharmXp = receiverData.charmXp || 0;
            const currentXp = receiverData.xp || 0;

            const newReceiverDiamonds = currentDiamonds + giftCost;
            const newReceiverCharmXp = currentCharmXp + giftCost;
            const newReceiverLevel = receiverData.level || getLevelFromXp(currentXp);

            transaction.update(receiverRef, {
              diamonds: newReceiverDiamonds,
              charmXp: newReceiverCharmXp,
              xp: currentXp,
              level: newReceiverLevel
            });
          }
        }
      }

      return { success: true };
    });

    return res.json(result);
  } catch (error: any) {
    console.error("[SERVER] Error processing send-gift endpoint:", error);
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/agora-token', (req, res) => {
    const channelName = req.query.channelName as string;
    const uidStr = req.query.uid as string;

    if (!channelName) {
        return res.status(400).json({ error: 'channelName is required' });
    }

    const appId = process.env.VITE_AGORA_APP_ID || "c7dfa22636da4b40980825480e3c090c";
    const appCertificate = process.env.VITE_AGORA_APP_CERTIFICATE || "037e1422e2f644dfb7d57a7bc04bd25f";
    
    console.log(`[SERVER-AGORA] Token request for channel: ${channelName}, UID: ${uidStr}, AppID: ${appId.substring(0, 5)}...`);

    const uid = uidStr ? parseInt(uidStr, 10) : Math.floor(Math.random() * 1000000);
    
    if (!RtcTokenBuilder || !RtcRole) {
        console.error("[SERVER-AGORA] Agora SDK components missing!");
        return res.status(500).json({ error: 'Agora SDK not initialized on server' });
    }

    if (!appCertificate || appCertificate === "YOUR_CERTIFICATE_HERE") {
        console.warn("[SERVER-AGORA] App Certificate missing or placeholder! Token will likely be invalid if project has certificate enabled.");
    }

    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    try {
        const token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, role, privilegeExpiredTs);
        console.log("[SERVER-AGORA] Token generated successfully.");
        return res.json({ token, uid });
    } catch (error) {
        console.error("[SERVER-AGORA] Token generation failed:", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ==================== FRONTEND & STATIC SERVING ====================
async function startApp() {
  checkFirestoreAccess().catch((err) => {
    console.error("Firestore connection check failed:", err);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server successfully running on http://0.0.0.0:${PORT}`);
  });
}

startApp().catch((err) => {
  console.error("Failed to start server:", err);
});
