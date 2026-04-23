import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import { GoogleGenAI, Type } from "@google/generative-ai";
import admin from "firebase-admin";
import http from "http";
import { Server } from "socket.io";

// Initialize Firebase Admin
admin.initializeApp();
const dbAdmin = admin.firestore();

// Note: Headless monitoring via LLM is restricted to frontend execution 
// to ensure proper API key handling in this environment.
// Backend AI initialization removed to prevent startup errors.

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = 3000;

  app.use(express.json());

  // Socket.io connection handling
  io.on("connection", (socket) => {
    console.log("Client connected to neural link:", socket.id);
    
    // Simulate real-time data ingestion
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      const streamData = {
        label: timeStr,
        value: Math.floor(Math.random() * 40) + 40,
        baseline: 50 + Math.sin(now.getTime() / 10000) * 10,
        timestamp: now.toISOString(),
        load: Math.random() * 100
      };
      
      socket.emit("neural_pulse", streamData);
    }, 2000);

    socket.on("disconnect", () => {
      clearInterval(interval);
      console.log("Client severed neural link:", socket.id);
    });
  });

// API Route for scraping website content
  app.post("/api/scrape", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      $('script, style').remove();
      const siteData = {
        title: $('title').text(),
        metaDescription: $('meta[name="description"]').attr('content') || '',
        headings: $('h1').map((i, el) => $(el).text()).get(),
        content: $('body').text().replace(/\s+/g, ' ').trim().substring(0, 10000),
        url
      };
      res.json(siteData);
    } catch (error: any) {
      console.error("Scraping error:", error);
      res.status(500).json({ error: "Failed to fetch website content." });
    }
  });

  // Keep Firestore Admin for potential non-AI backend tasks
  // (e.g. data cleanup or non-LLM based logic)
  
  // Note: Headless monitoring via LLM is restricted to frontend execution 
  // to ensure proper API key handling in this environment.
  // We will maintain the structure for the user to see, 
  // but move the core AI pulse back to the client.


  // Vite middleware for development
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

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
