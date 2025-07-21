import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  lastMessageTime: null, // Track last message for auto-refresh
  messagePollingInterval: null, // For polling fallback

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      const messages = res.data;
      set({ 
        messages,
        lastMessageTime: messages.length > 0 ? messages[messages.length - 1].createdAt : null
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // Auto-refresh messages function with smarter polling
  refreshMessages: async () => {
    const { selectedUser, lastMessageTime } = get();
    if (!selectedUser) return;

    try {
      // Use the new endpoint to only get messages since last known message
      const url = lastMessageTime 
        ? `/messages/${selectedUser._id}/new?since=${lastMessageTime}`
        : `/messages/${selectedUser._id}`;
        
      const res = await axiosInstance.get(url);
      const newMessages = res.data;
      
      if (newMessages.length > 0) {
        const currentMessages = get().messages;
        
        // Filter out any duplicates
        const uniqueNewMessages = newMessages.filter(newMsg => 
          !currentMessages.some(existingMsg => existingMsg._id === newMsg._id)
        );
        
        if (uniqueNewMessages.length > 0) {
          console.log(`Found ${uniqueNewMessages.length} new messages`);
          set({ 
            messages: [...currentMessages, ...uniqueNewMessages],
            lastMessageTime: uniqueNewMessages[uniqueNewMessages.length - 1].createdAt
          });
        }
      }
    } catch (error) {
      console.error("Failed to refresh messages:", error);
    }
  },

  // Start auto-refresh polling as fallback with faster interval
  startMessagePolling: () => {
    const { messagePollingInterval } = get();
    if (messagePollingInterval) return; // Already polling

    console.log("Starting message polling fallback");
    const interval = setInterval(() => {
      get().refreshMessages();
    }, 2000); // Poll every 2 seconds for faster updates

    set({ messagePollingInterval: interval });
  },

  // Stop auto-refresh polling
  stopMessagePolling: () => {
    const { messagePollingInterval } = get();
    if (messagePollingInterval) {
      clearInterval(messagePollingInterval);
      set({ messagePollingInterval: null });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      // Optimistic update - add message immediately to UI
      const tempMessage = {
        _id: Date.now().toString(), // Temporary ID
        senderId: useAuthStore.getState().authUser._id,
        receiverId: selectedUser._id,
        text: messageData.text,
        image: messageData.image,
        createdAt: new Date(),
        isOptimistic: true // Flag to identify optimistic messages
      };
      
      // Immediately update UI
      set({ messages: [...messages, tempMessage] });

      // Send message to server
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      
      // Replace optimistic message with real message
      set({ 
        messages: messages.map(msg => 
          msg._id === tempMessage._id ? res.data : msg
        ).concat(res.data._id === tempMessage._id ? [] : [res.data])
      });
    } catch (error) {
      // Remove optimistic message on error
      set({ 
        messages: messages.filter(msg => msg._id !== tempMessage._id)
      });
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    
    if (!socket) {
      console.warn("Socket not available, starting polling fallback");
      get().startMessagePolling();
      return;
    }

    // Enhanced socket message handling
    socket.on("newMessage", (newMessage) => {
      console.log("Received new message:", newMessage);
      
      const currentMessages = get().messages;
      const currentSelectedUser = get().selectedUser;
      
      // Check if message is for current chat
      const isForCurrentChat = 
        (newMessage.senderId === currentSelectedUser._id && newMessage.receiverId === useAuthStore.getState().authUser._id) ||
        (newMessage.receiverId === currentSelectedUser._id && newMessage.senderId === useAuthStore.getState().authUser._id);
      
      if (!isForCurrentChat) {
        console.log("Message not for current chat, ignoring");
        return;
      }

      // Check if message already exists (avoid duplicates)
      const messageExists = currentMessages.some(msg => 
        msg._id === newMessage._id || 
        (msg.text === newMessage.text && 
         msg.senderId === newMessage.senderId &&
         Math.abs(new Date(msg.createdAt) - new Date(newMessage.createdAt)) < 2000)
      );

      if (!messageExists) {
        console.log("Adding new message to chat");
        set({
          messages: [...currentMessages, newMessage],
          lastMessageTime: newMessage.createdAt
        });
      } else {
        console.log("Message already exists, skipping");
      }
    });

    // Handle connection issues
    socket.on("disconnect", () => {
      console.log("Socket disconnected, starting polling fallback");
      get().startMessagePolling();
    });

    socket.on("connect", () => {
      console.log("Socket reconnected, stopping polling");
      get().stopMessagePolling();
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
      socket.off("disconnect");
      socket.off("connect");
    }
    // Stop polling when unsubscribing
    get().stopMessagePolling();
  },

  setSelectedUser: (selectedUser) => {
    // Stop polling for previous chat
    get().stopMessagePolling();
    set({ selectedUser, messages: [] }); // Clear messages when switching users
  },
}));