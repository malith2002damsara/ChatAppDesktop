// 1. Frontend - lib/axios.js
import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" 
    ? "http://localhost:5001/api" 
    : "https://chat-backend-sand-eight.vercel.app/api",
  withCredentials: true,
});