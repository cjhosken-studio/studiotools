// src/utils/api.ts
const isDev = import.meta.env.DEV
const API_BASE = isDev 
  ? 'http://localhost:9099/api' 
  : '/api' // Relative path works in production

export const fetchApi = async (endpoint: string, options?: RequestInit) => {
  const response = await fetch(`${API_BASE}${endpoint}`, options)
  if (!response.ok) throw new Error('Network response was not ok')
  return response.json()
}