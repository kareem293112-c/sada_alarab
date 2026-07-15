import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { createServer as createHttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { WebSocketServer, WebSocket } from 'ws';

dotenv.config();

const app = express();
const httpServer = createHttpServer(app);

// 1. Configure robust CORS to prevent any blocking issues
const allowedOrigins = [
  'https://wif.onrender.com',
  'https://sada-alarab.onrender.com',
  'https://onrender.com',
  'http://localhost:3000',
  'http://localhost:5173',
  'https://ais-dev-qts7zckbddelnrwnra7g7o-150385904306.europe-west2.run.app',
  'https://ais-pre-qts7zckbddelnrwnra7g7o-150385904306.europe-west2.run.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
      callback(null, true);
    } else {
      callback(null, true); // Fallback to allow during preview/testing
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-userid'],
  credentials: true
}));

app.use(express.json());

// 2. Lazy Firebase Database Initialization
let dbInstance: Firestore | null = null;

function getDb(): Firestore | null {
  if (dbInstance) return dbInstance;

  const projectId = "gen-lang-client-0348881645";
  const databaseId = "ai-studio-sadaalarabvoiceb-5f452604-580f-4265-ab18-da9c404b3698";

  // Check secret file path first (standard on Render)
  const keyPath = '/etc/secrets/firebase-key.json';
  if (fs.existsSync(keyPath)) {
    try {
      const keyContent = fs.readFileSync(keyPath, 'utf8');
      if (keyContent && keyContent.trim()) {
        const serviceAccount = JSON.parse(keyContent.trim());
        const apps = getApps();
        let app: App;
        if (apps.length === 0) {
          app = initializeApp({
            credential: cert(serviceAccount),
            projectId: serviceAccount.project_id || projectId
          });
        } else {
          app = apps[0];
        }
        const firestoreInstance = getFirestore(app, databaseId);
        dbInstance = firestoreInstance;
        console.log("🔥 [FIREBASE] Initialized with Service Account File");
        return dbInstance;
      }
    } catch (err: any) {
      console.error("❌ [FIREBASE ERROR] Failed to initialize via file:", err.message);
    }
  }

  // Fallback to environment variable
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountVar && serviceAccountVar.trim()) {
    try {
      const serviceAccount = JSON.parse(serviceAccountVar.trim());
      const apps = getApps();
      let app: App;
      if (apps.length === 0) {
        app = initializeApp({
          credential: cert(serviceAccount),
          projectId: serviceAccount.project_id || projectId
        });
      } else {
        app = apps[0];
      }
      const firestoreInstance = getFirestore(app, databaseId);
      dbInstance = firestoreInstance;
      console.log("🔥 [FIREBASE] Initialized via Environment Variable");
      return dbInstance;
    } catch (err: any) {
      console.error("❌ [FIREBASE ERROR] Failed to initialize via env variable:", err.message);
    }
  }

  // Local/Dev Fallback
  try {
    const apps = getApps();
    let app: App;
    if (apps.length === 0) {
      app = initializeApp({
        projectId: projectId
      });
    } else {
      app = apps[0];
    }
    const firestoreInstance = getFirestore(app, databaseId);
    dbInstance = firestoreInstance;
    console.log("⚠️ [FIREBASE] Initialized with fallback configuration (No service account)");
    return dbInstance;
  } catch (err: any) {
    console.error("❌ [FIREBASE ERROR] Fallback initialization failed:", err.message);
    return null;
  }
}

// Ensure database loads once on startup gracefully
try {
  const db = getDb();
  if (db) {
    db.collection("users").where("displayId", "==", "50505").get()
      .then(snapshot => console.log("🔥 [STARTUP TEST] USERS FOUND:", snapshot.size))
      .catch(err => console.error("❌ [STARTUP TEST] Error:", err));
  }
} catch (e) {}

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Legacy game logic variables and functions removed.


// 8. Legacy Game API Routes removed.
// SSE and game endpoints were here.


// 9. Admin Dashboard API removed.


// 3. Game State Variables
interface GamePlayer {
  id: string;
  name: string;
  avatar: string;
  balance: number;
  isBot: boolean;
}
const activeRoomPlayers: Record<string, GamePlayer> = {};

// Legacy Socket.io and WebSocket setup
let io: SocketIOServer | null = null;
io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('[SOCKET.IO] Client connected:', socket.id);

  socket.on('client:connect', async (data) => {
    console.log('[SOCKET.IO] Received client:connect from', socket.id, 'with data:', data);
    if (!data) data = {};
    const displayId = data.displayId || data.userId || data.id;
    const name = data.name || data.username || 'Player';
    const avatarUrl = data.avatarUrl || data.avatar || '';

    if (!displayId) {
      console.error("[SOCKET.IO] Missing displayId or userId in client:connect from socket", socket.id);
      socket.emit('error', { message: 'Missing displayId or userId' });
      return;
    }

    // Fetch user balance and data
    const db = getDb();
    
    let userResult = {
      userId: displayId,
      name: name || 'Player',
      avatar: avatarUrl || '',
      balance: 0
    };

    if (db) {
      try {
        let usersSnapshot = await db.collection('users').where('displayId', '==', displayId).get();
        if (usersSnapshot.empty) {
          // Attempt fallback search by document ID directly if displayId didn't match
          const docRef = db.collection('users').doc(displayId);
          const docSnap = await docRef.get();
          if (docSnap.exists) {
            const docData = docSnap.data();
            if (docData) {
              userResult = {
                userId: docSnap.id,
                name: docData.name || name || 'Player',
                avatar: docData.avatar || avatarUrl || '',
                balance: docData.coins || 0
              };
            }
          }
        } else {
          const doc = usersSnapshot.docs[0];
          const docData = doc.data();
          userResult = {
            userId: doc.id,
            name: docData.name || name || 'Player',
            avatar: docData.avatar || avatarUrl || '',
            balance: docData.coins || 0
          };
        }
        console.log("[SOCKET.IO] User resolved for game connection:", userResult);
      } catch (e) {
        console.error("[SOCKET.IO] Error fetching user:", e);
      }
    }

    // Update player mapping
    activeRoomPlayers[displayId] = {
      id: userResult.userId,
      name: userResult.name,
      avatar: userResult.avatar,
      balance: userResult.balance,
      isBot: false
    };

    console.log("[SYNC SENT TO CLIENT]", userResult);
    
    // Broadcast status and confirm connection
    socket.emit('game:connected', userResult);
    io!.emit('server:status', {
      roomPlayers: activeRoomPlayers
    });
  });

  socket.on('disconnect', () => {
    console.log('[SOCKET.IO] Client disconnected:', socket.id);
  });
});



// Setup Vite development middleware & production static serving
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [SERVER] Running beautifully on http://0.0.0.0:${PORT}`);
  });
}

startServer();
