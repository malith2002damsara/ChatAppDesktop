import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    // Optimize for production/serverless environments
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
      connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
      family: 4, // Use IPv4, skip trying IPv6
    };

    if (mongoose.connections[0].readyState) {
      console.log("MongoDB already connected");
      return;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("MongoDB connection error:", error);
    throw error;
  }
};
