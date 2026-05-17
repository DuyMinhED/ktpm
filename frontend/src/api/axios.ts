import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle network errors (server unreachable)
    if (!error.response) {
      console.error('Network error: Backend server is unreachable');
      return Promise.reject(error);
    }

    const status = error.response.status;

    // Handle 401 Unauthorized - redirect to login
    if (status === 401) {
      const isOnLoginPage = window.location.pathname === '/' || window.location.search.includes('action=login');
      if (!isOnLoginPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('clinicId');
        localStorage.removeItem('userId');
        window.location.href = '/?action=login';
      }
    }

    // Handle 403 Forbidden
    if (status === 403) {
      console.error('Access denied: You do not have permission for this action');
    }

    // Handle 429 Too Many Requests (rate limiting)
    if (status === 429) {
      console.warn('Rate limited: Too many requests, please slow down');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
