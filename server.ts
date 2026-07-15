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
        const firestoreInstance = getFirestore(app);
        firestoreInstance.settings({ databaseId });
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
      const firestoreInstance = getFirestore(app);
      firestoreInstance.settings({ databaseId });
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
    const firestoreInstance = getFirestore(app);
    firestoreInstance.settings({ databaseId });
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
  getDb();
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
    const { displayId, name, avatarUrl } = data;

    if (!displayId) {
      console.error("[SOCKET.IO] Missing displayId in client:connect from socket", socket.id);
      socket.emit('error', { message: 'Missing displayId' });
      return;
    }

    // Fetch user balance
    const db = getDb();
    
    // TEST: Verify DB connection
    if (db) {
      const test = await db.collection("users").where("displayId", "==", "50505").get();
      console.log("USERS FOUND (TEST):", test.size);
    }
    
    let balance = 0;
    if (db) {
      try {
        console.log(`[SOCKET.IO] Fetching balance for displayId: ${displayId}`);
        // Query users collection where displayId == displayId
        const usersSnapshot = await db.collection('users').where('displayId', '==', displayId).get();
        if (!usersSnapshot.empty) {
          balance = usersSnapshot.docs[0].data().coins || 0;
          console.log(`[SOCKET.IO] Found balance: ${balance} for displayId: ${displayId}`);
        } else {
          console.log(`[SOCKET.IO] No user found for displayId: ${displayId}`);
        }
      } catch (e) {
        console.error("[SOCKET.IO] Error fetching balance:", e);
      }
    }

    // Update player mapping
    activeRoomPlayers[displayId] = {
      id: displayId,
      name: name || 'Player',
      avatar: avatarUrl || '',
      balance: balance,
      isBot: false
    };

    console.log(`[SOCKET.IO] Broadcasting game:connected to socket`, socket.id);
    
    // Broadcast status and confirm connection
    socket.emit('game:connected', { balance });
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
