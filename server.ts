import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from 'cors';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { db } from './src/db/index.ts';
import { users } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- API Routes ---
  
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/users/me", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      
      const result = await db.select().from(users).where(eq(users.uid, req.user.uid));
      if (result.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(result[0]);
    } catch (error: any) {
      console.error("Failed to fetch user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // TODO: Add more API routes here to replace Firebase Firestore services

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
