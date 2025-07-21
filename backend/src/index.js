import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        "http://localhost:5173",
        "https://localhost:5173",
        "https://your-frontend-domain.vercel.app", // Replace with your actual frontend domain
      ];
      
      // Check if the origin is in the allowed list or if it's a vercel.app domain
      if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  })
);

// API status route - shows server is working
app.get("/", (req, res) => {
  res.json({ 
    message: "🚀 API is working perfectly!",
    timestamp: new Date().toISOString(),
    cors: "enabled"
  });
});

// Test endpoint for CORS
app.get("/api/test", (req, res) => {
  res.json({ 
    message: "CORS test successful!",
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    message: "✅ Server is healthy and running!",
    status: "healthy", 
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    // Skip API routes from catch-all handler
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ 
        error: "API route not found", 
        path: req.path 
      });
    }
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

server.listen(PORT, () => {
  console.log(`🌟 Server is running on PORT: ${PORT}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("🔄 Connecting to database...");
  connectDB();
});