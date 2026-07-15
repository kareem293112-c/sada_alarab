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


// Legacy Socket.io and WebSocket setup removed.


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
