import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import admin from 'firebase-admin';
import { createServer as createHttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

dotenv.config();

const app = express();

// Configure robust CORS
app.use(cors({
  origin: [
    'https://wif.onrender.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://ais-dev-qts7zckbddelnrwnra7g7o-150385904306.europe-west2.run.app',
    'https://ais-pre-qts7zckbddelnrwnra7g7o-150385904306.europe-west2.run.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-userid'],
  credentials: true
}));

app.use(express.json());

// Lazy Firebase Database Getter to prevent crashes on startup/boot validation
let dbInstance: admin.firestore.Firestore | null = null;

function getDb(): admin.firestore.Firestore {
  if (dbInstance) return dbInstance;

  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  const projectId = "gen-lang-client-0348881645";
  const databaseId = "ai-studio-sadaalarabvoiceb-5f452604-580f-4265-ab18-da9c404b3698";

  if (serviceAccountVar && serviceAccountVar.trim()) {
    try {
      const serviceAccount = JSON.parse(serviceAccountVar.trim());
      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id || projectId
        });
      }
      const firestoreInstance = admin.firestore();
      firestoreInstance.settings({ databaseId });
      dbInstance = firestoreInstance;
      console.log("[FIREBASE] Admin initialized with Service Account and Custom Database ID");
      return dbInstance;
    } catch (err: any) {
      console.error("[FIREBASE ERROR] Failed to initialize with FIREBASE_SERVICE_ACCOUNT:", err.message);
    }
  }

  // Fallback / Development mode when service account is not yet provided or parsed
  try {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        projectId: projectId
      });
    }
    const firestoreInstance = admin.firestore();
    firestoreInstance.settings({ databaseId });
    dbInstance = firestoreInstance;
    console.log("[FIREBASE] Admin initialized with fallback config and Custom Database ID");
    return dbInstance;
  } catch (err: any) {
    console.error("[FIREBASE ERROR] Gracefully caught initialization error to prevent startup crash:", err.message);
    throw new Error("Database not configured. Please supply a valid FIREBASE_SERVICE_ACCOUNT environment variable.");
  }
}

// Health Check API
app.get('/api/health', async (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Define types for game state
interface Bet {
  userId: string;
  optionId: string;
  amount: number;
}

interface RoundHistory {
  roundId: string;
  winningOption: string;
  multiplier: number;
  timestamp: string;
}

// Global Game State
let gameRound = {
  id: Date.now().toString(),
  phase: 'betting' as 'betting' | 'spinning' | 'result',
  countdown: 20, // 20 seconds betting phase
  winningOption: null as string | null,
  activeBets: [] as Bet[],
};

let roundHistory: RoundHistory[] = [];
let multiplierOptions = [
  { id: 'pizza', name: '🍕 بيتزا', multiplier: 2, weight: 60 },
  { id: 'burger', name: '🍔 برجر', multiplier: 3, weight: 30 },
  { id: 'sushi', name: '🍣 سوشي', multiplier: 5, weight: 8 },
  { id: 'cupcake', name: '🧁 كاب كيك', multiplier: 10, weight: 2 },
];

// Broadcast structures
const sseClients = new Set<any>();
let wss: WebSocketServer | null = null;

function getGameStatePayload() {
  return {
    roundId: gameRound.id,
    phase: gameRound.phase,
    countdown: gameRound.countdown,
    winningOption: gameRound.winningOption,
    history: roundHistory,
    totalBets: gameRound.activeBets.reduce((sum, b) => sum + b.amount, 0),
    options: multiplierOptions.map(o => ({ id: o.id, name: o.name, multiplier: o.multiplier }))
  };
}

function broadcastGameState() {
  const data = JSON.stringify({
    type: 'game_state',
    data: getGameStatePayload()
  });

  // 1. Broadcast to SSE Clients
  for (const res of sseClients) {
    try {
      res.write(`data: ${data}\n\n`);
    } catch (err) {
      sseClients.delete(res);
    }
  }

  // 2. Broadcast to WebSockets
  if (wss) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(data);
        } catch (err) {
          console.error("Error sending message to WebSocket client:", err);
        }
      }
    });
  }
}

// Secure Firestore Transactions for payouts
async function processPayouts() {
  const winningOption = gameRound.winningOption;
  if (!winningOption) return;

  const currentOpt = multiplierOptions.find(o => o.id === winningOption);
  const multiplier = currentOpt?.multiplier || 1;

  const winners = gameRound.activeBets.filter(b => b.optionId === winningOption);
  console.log(`[GAME] Round completed: ${gameRound.id}. Winning item: ${winningOption}. Winners Count: ${winners.length}`);

  for (const bet of winners) {
    try {
      const firestoreDb = getDb();
      const userRef = firestoreDb.collection('users').doc(bet.userId);
      const reward = bet.amount * multiplier;

      await firestoreDb.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          console.error(`User ${bet.userId} not found during payout.`);
          return;
        }

        const currentCoins = userDoc.data()?.coins || 0;
        const newCoins = currentCoins + reward;

        // Atomically update user's coins and award dynamic XP (10% of reward amount)
        const currentXp = userDoc.data()?.xp || 0;
        const newXp = currentXp + Math.floor(reward * 0.1);

        transaction.update(userRef, {
          coins: newCoins,
          xp: newXp
        });

        console.log(`[PAYOUT] Successfully credited user ${bet.userId} with ${reward} coins. New Balance: ${newCoins}`);
      });
    } catch (err) {
      console.error(`[PAYOUT ERROR] Transaction failed for user ${bet.userId}:`, err);
    }
  }
}

// Background Game Loop Interval
setInterval(async () => {
  if (gameRound.phase === 'betting') {
    gameRound.countdown--;
    if (gameRound.countdown <= 0) {
      // Transition to spinning phase
      gameRound.phase = 'spinning';
      gameRound.countdown = 5; // 5 seconds spin animation

      // Determine the winner based on weighted random selection
      const totalWeight = multiplierOptions.reduce((sum, opt) => sum + opt.weight, 0);
      let randomValue = Math.random() * totalWeight;
      let selectedOption = multiplierOptions[0];

      for (const opt of multiplierOptions) {
        randomValue -= opt.weight;
        if (randomValue <= 0) {
          selectedOption = opt;
          break;
        }
      }

      gameRound.winningOption = selectedOption.id;
      console.log(`[GAME LOOP] Wheel spinning... Chosen Winner: ${selectedOption.id}`);
      broadcastGameState();
    } else {
      broadcastGameState();
    }
  } else if (gameRound.phase === 'spinning') {
    gameRound.countdown--;
    if (gameRound.countdown <= 0) {
      // Transition to result showing and process transactions
      gameRound.phase = 'result';
      gameRound.countdown = 5; // 5 seconds display phase

      // Run transactional payouts safely
      await processPayouts();

      // Log to history list
      const winningOptObj = multiplierOptions.find(o => o.id === gameRound.winningOption);
      roundHistory.unshift({
        roundId: gameRound.id,
        winningOption: gameRound.winningOption || 'pizza',
        multiplier: winningOptObj?.multiplier || 2,
        timestamp: new Date().toISOString(),
      });

      if (roundHistory.length > 30) {
        roundHistory.pop();
      }

      broadcastGameState();
    } else {
      broadcastGameState();
    }
  } else if (gameRound.phase === 'result') {
    gameRound.countdown--;
    if (gameRound.countdown <= 0) {
      // Reset state for new round
      gameRound = {
        id: Date.now().toString(),
        phase: 'betting',
        countdown: 20,
        winningOption: null,
        activeBets: [],
      };
      console.log(`[GAME LOOP] New Round started: ${gameRound.id}`);
      broadcastGameState();
    } else {
      broadcastGameState();
    }
  }
}, 1000);

// API Endpoint to Place a Bet (Secure Firestore Transaction)
const placeBetHandler = async (req: express.Request, res: express.Response) => {
  try {
    const { userId, optionId, amount } = req.body;

    if (!userId || !optionId || typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ error: "Invalid parameters. Require: userId, optionId, amount" });
      return;
    }

    if (gameRound.phase !== 'betting') {
      res.status(400).json({ error: "Betting is closed for the current round!" });
      return;
    }

    const validOption = multiplierOptions.find(o => o.id === optionId);
    if (!validOption) {
      res.status(400).json({ error: "Invalid betting option selected" });
      return;
    }

    const firestoreDb = getDb();
    const userRef = firestoreDb.collection('users').doc(userId);
    let finalCoins = 0;

    // Use transaction to verify balance and deduct bet amount atomically
    await firestoreDb.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error("User does not exist in our system");
      }

      const currentCoins = userDoc.data()?.coins || 0;
      if (currentCoins < amount) {
        throw new Error("Insufficient coin balance!");
      }

      finalCoins = currentCoins - amount;
      transaction.update(userRef, { coins: finalCoins });
    });

    // Record bet in game memory
    gameRound.activeBets.push({ userId, optionId, amount });
    console.log(`[BET REGISTERED] User ${userId} bet ${amount} on ${optionId}. Remaining: ${finalCoins}`);

    // Broadcast update immediately to show live bets updates
    broadcastGameState();

    res.json({
      success: true,
      message: "Bet placed successfully",
      newBalance: finalCoins,
      roundId: gameRound.id
    });
  } catch (err: any) {
    console.error("[BET ERROR] Bet processing failed:", err);
    res.status(500).json({ error: err.message });
  }
};

// Map both /api/placeBet and /api/game/bet to handle requests seamlessly
app.post('/api/placeBet', placeBetHandler);
app.post('/api/game/bet', placeBetHandler);

// API Endpoint: Get Current Real-time Game State
app.get('/api/game/state', (req, res) => {
  res.json(getGameStatePayload());
});

// SSE Stream Endpoint for Game Countdown Updates
app.get('/api/game/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.add(res);

  // Send initial game state immediately
  const initialPayload = JSON.stringify({
    type: 'game_state',
    data: getGameStatePayload()
  });
  res.write(`data: ${initialPayload}\n\n`);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Admin Dashboard: Get detailed game stats
app.get('/api/admin/game-status', (req, res) => {
  res.json({
    gameState: gameRound,
    history: roundHistory,
    totalRegisteredSSE: sseClients.size,
    totalWebSockets: wss ? wss.clients.size : 0,
    config: multiplierOptions
  });
});

// Admin: Force immediate spin result to a specific chosen option
app.post('/api/admin/force-spin', (req, res) => {
  const { optionId } = req.body;
  if (gameRound.phase !== 'betting') {
    res.status(400).json({ error: "Cannot force spin when not in betting phase!" });
    return;
  }

  const validOption = multiplierOptions.find(o => o.id === optionId);
  if (!validOption) {
    res.status(400).json({ error: "Invalid force option id" });
    return;
  }

  gameRound.phase = 'spinning';
  gameRound.countdown = 5;
  gameRound.winningOption = optionId;
  console.log(`[ADMIN FORCE] Admin forced winning option to: ${optionId}`);
  broadcastGameState();

  res.json({ success: true, message: `Forced spin result to ${optionId}` });
});

// Admin: Configure win rate or weight configurations dynamically
app.post('/api/admin/set-rate', (req, res) => {
  const { optionId, weight, multiplier } = req.body;
  const targetOption = multiplierOptions.find(o => o.id === optionId);

  if (!targetOption) {
    res.status(404).json({ error: "Option not found" });
    return;
  }

  if (typeof weight === 'number') targetOption.weight = weight;
  if (typeof multiplier === 'number') targetOption.multiplier = multiplier;

  console.log(`[ADMIN CONFIG] Custom settings updated for ${optionId}: weight=${targetOption.weight}, mult=${targetOption.multiplier}`);
  res.json({ success: true, option: targetOption });
});

// Create base HTTP server to attach WebSockets perfectly
const httpServer = createHttpServer(app);

// Initialize WebSockets server attached to the HTTP server
wss = new WebSocketServer({ server: httpServer, path: '/ws/game' });

wss.on('connection', (ws) => {
  console.log('[WEBSOCKET] New client connected');

  // Send current state on connection
  ws.send(JSON.stringify({
    type: 'game_state',
    data: getGameStatePayload()
  }));

  ws.on('error', (err) => {
    console.error('[WEBSOCKET ERROR]', err);
  });

  ws.on('close', () => {
    console.log('[WEBSOCKET] Client disconnected');
  });
});

// Setup Vite middleware for development & static serving for production
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
    // Serve static frontend files built in dist
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running beautifully on http://0.0.0.0:${PORT}`);
  });
}

startServer();
