import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "https://chat-backend-sand-eight.vercel.app" : "/api",
  withCredentials: true,
});
