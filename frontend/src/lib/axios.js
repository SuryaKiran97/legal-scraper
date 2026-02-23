import axios from "axios";

// In dev, let Vite proxy /api → backend on 3001 by default.
// In prod, you can set VITE_API_URL to your backend origin.
const baseURL = import.meta.env.VITE_API_URL || "";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json"
  }
});

