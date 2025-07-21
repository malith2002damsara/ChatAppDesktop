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

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    // Find the message and verify ownership
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only allow sender to delete their own messages
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only delete your own messages" });
    }

    await Message.findByIdAndDelete(messageId);

    // Emit deletion event to both sender and receiver
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    const senderSocketId = getReceiverSocketId(message.senderId);
    
    const deleteEvent = { messageId, senderId: message.senderId, receiverId: message.receiverId };
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", deleteEvent);
    }
    
    if (senderSocketId && senderSocketId !== receiverSocketId) {
      io.to(senderSocketId).emit("messageDeleted", deleteEvent);
    }

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const clearAllMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    // Delete all messages between the two users where current user is the sender
    const deleteResult = await Message.deleteMany({
      senderId: myId,
      receiverId: userToChatId
    });

    // Emit clear event to both users
    const receiverSocketId = getReceiverSocketId(userToChatId);
    const senderSocketId = getReceiverSocketId(myId);
    
    const clearEvent = { senderId: myId, receiverId: userToChatId, deletedCount: deleteResult.deletedCount };
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messagesCleared", clearEvent);
    }
    
    if (senderSocketId && senderSocketId !== receiverSocketId) {
      io.to(senderSocketId).emit("messagesCleared", clearEvent);
    }

    res.status(200).json({ 
      message: `${deleteResult.deletedCount} messages cleared successfully`,
      deletedCount: deleteResult.deletedCount
    });
  } catch (error) {
    console.log("Error in clearAllMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
