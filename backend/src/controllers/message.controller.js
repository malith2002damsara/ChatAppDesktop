import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    
    // Optimize user query with lean and reduced timeout
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } })
      .select("-password")
      .lean() // Use lean for faster queries
      .maxTimeMS(5000); // Reduce timeout for faster response

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    
    // Handle specific MongoDB timeout errors
    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      return res.status(500).json({ 
        message: "Database connection timeout", 
        error: "Please try again in a moment" 
      });
    }
    
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    // Optimize query with sorting and limit for faster retrieval
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    })
    .sort({ createdAt: 1 }) // Sort by creation time
    .limit(100) // Limit to last 100 messages for faster loading
    .lean() // Use lean for faster queries
    .maxTimeMS(5000); // Reduce timeout for faster response

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    
    // Handle specific MongoDB timeout errors
    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      return res.status(500).json({ 
        message: "Database connection timeout", 
        error: "Please try again in a moment" 
      });
    }
    
    res.status(500).json({ error: "Internal server error" });
  }
};

// New endpoint for checking new messages since timestamp
export const getNewMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const { since } = req.query; // timestamp
    const myId = req.user._id;

    const query = {
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    };

    // Add timestamp filter if provided
    if (since) {
      query.createdAt = { $gt: new Date(since) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: 1 })
      .lean()
      .maxTimeMS(3000);

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getNewMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    // Save message and emit to socket in parallel for faster response
    const [savedMessage] = await Promise.all([
      newMessage.save(),
      // Emit to both sender and receiver immediately
      (async () => {
        const receiverSocketId = getReceiverSocketId(receiverId);
        const senderSocketId = getReceiverSocketId(senderId);
        
        console.log(`Emitting message to receiver: ${receiverSocketId}, sender: ${senderSocketId}`);
        
        // Send to receiver
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("newMessage", newMessage);
        }
        
        // Send to sender (for multi-device sync)
        if (senderSocketId && senderSocketId !== receiverSocketId) {
          io.to(senderSocketId).emit("newMessage", newMessage);
        }
      })()
    ]);

    res.status(201).json(savedMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
