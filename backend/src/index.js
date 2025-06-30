// 3. Backend - Updated server code (src/index.js)
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

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS configuration - FIXED
app.use(
  cors({
    origin: process.env.NODE_ENV === "production" 
      ? [
          "https://your-frontend-domain.vercel.app", // Replace with your actual frontend URL
          "https://chat-frontend-your-username.vercel.app" // Replace with your actual frontend URL
        ]
      : "http://localhost:5173",
    credentials: true,
  })
);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Root route for development
app.get("/", (req, res) => {
  res.json({ 
    message: "Chat App Backend API is running!",
    status: "success",
    environment: process.env.NODE_ENV || "development"
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});

// Production static files serving (Remove this if deploying separately)
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  
  // Catch all handler for React Router
  app.get("*", (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: "API route not found" });
    }
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: "Something went wrong!",
    message: process.env.NODE_ENV === "development" ? err.message : "Internal server error"
  });
});

// 404 handler for non-existent routes
app.use("*", (req, res) => {
  res.status(404).json({ 
    error: "Route not found",
    path: req.originalUrl 
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  connectDB();
});
