import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { ensureDbConnection } from "../middleware/db.middleware.js";
import { getMessages, getUsersForSidebar, sendMessage, getNewMessages } from "../controllers/message.controller.js";

const router = express.Router();

// Apply database connection middleware to all message routes
router.use(ensureDbConnection);

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.get("/:id/new", protectRoute, getNewMessages); // New endpoint for polling new messages

router.post("/send/:id", protectRoute, sendMessage);

export default router;
