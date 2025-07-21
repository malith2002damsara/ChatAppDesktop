import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "https://chat-app-desktop-backend.vercel.app/api",
  withCredentials: import.meta.env.MODE === "development",
  headers: {
    'Content-Type': 'application/json',
  },
});