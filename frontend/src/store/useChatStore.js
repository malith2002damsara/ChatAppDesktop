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

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
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

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      // Check if message already exists (avoid duplicates)
      const currentMessages = get().messages;
      const messageExists = currentMessages.some(msg => 
        msg._id === newMessage._id || 
        (msg.text === newMessage.text && 
         Math.abs(new Date(msg.createdAt) - new Date(newMessage.createdAt)) < 1000)
      );

      if (!messageExists) {
        set({
          messages: [...currentMessages, newMessage],
        });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));