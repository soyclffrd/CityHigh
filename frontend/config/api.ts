import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
export const API_BASE_URL = 'http://localhost:8000';
export const API_URL = `${API_BASE_URL}/api`;

// Common fetch configuration
export const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 30000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    // Get the auth token from AsyncStorage
    const token = await AsyncStorage.getItem('auth-token');
    
    // Check if the request body is FormData
    const isFormData = options.body instanceof FormData;
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    // Only add Content-Type if it's not FormData
    if (!isFormData) {
      headers['Content-Type'] = (options.headers as Record<string, string>)?.['Content-Type'] || 'application/json';
    }

    // Add auth token if it exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers,
    });
    clearTimeout(id);
    return response;
  } catch (error: unknown) {
    clearTimeout(id);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Could not connect to the server. Please check if the server is running and accessible.');
      }
    }
    throw error;
  }
}; 