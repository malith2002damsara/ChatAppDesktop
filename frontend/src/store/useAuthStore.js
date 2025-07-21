import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "https://chat-app-desktop-backend.vercel.app";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      // Check for stored token
      const token = localStorage.getItem('token');
      if (token) {
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      if (error.code === 'NETWORK_ERROR' || error.message.includes('CORS')) {
        console.log("Network or CORS error - check backend connection");
      }
      // Clear invalid token
      localStorage.removeItem('token');
      delete axiosInstance.defaults.headers.common['Authorization'];
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      console.log('Attempting signup with:', data);
      const res = await axiosInstance.post("/auth/signup", data);
      console.log('Signup successful:', res.data);
      
      set({ authUser: res.data });
      
      // Store token if provided
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      }
      
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      console.error("Signup error details:", {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      
      let errorMessage = "Signup failed";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = `Signup error: ${error.response.data.error}`;
      } else if (error.message.includes('timeout')) {
        errorMessage = "Request timeout - backend may be sleeping. Please try again.";
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = "Network error - please check your connection";
      } else if (error.message.includes('CORS')) {
        errorMessage = "CORS error - backend configuration issue";
      } else if (error.response?.status === 404) {
        errorMessage = "Signup endpoint not found";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error - please check backend logs";
      }
      
      toast.error(errorMessage);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      console.log('Attempting login with:', data);
      const res = await axiosInstance.post("/auth/login", data);
      console.log('Login successful:', res.data);
      
      set({ authUser: res.data });
      
      // Store token if provided
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      }
      
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      console.error("Login error details:", {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      
      let errorMessage = "Login failed";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = `Login error: ${error.response.data.error}`;
      } else if (error.message.includes('timeout')) {
        errorMessage = "Request timeout - backend may be sleeping. Please try again.";
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = "Network error - please check your connection";
      } else if (error.message.includes('CORS')) {
        errorMessage = "CORS error - backend configuration issue";
      } else if (error.response?.status === 404) {
        errorMessage = "Login endpoint not found";
      } else if (error.response?.status === 401) {
        errorMessage = "Invalid credentials";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error - please check backend logs";
      }
      
      toast.error(errorMessage);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      
      // Clear token and auth header
      localStorage.removeItem('token');
      delete axiosInstance.defaults.headers.common['Authorization'];
      
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      console.error("Logout error:", error);
      
      // Clear token even if logout request fails
      localStorage.removeItem('token');
      delete axiosInstance.defaults.headers.common['Authorization'];
      set({ authUser: null });
      
      toast.error(error.response?.data?.message || "Logout failed");
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));