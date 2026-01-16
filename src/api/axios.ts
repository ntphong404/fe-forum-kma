import axios, { type InternalAxiosRequestConfig, type AxiosRequestHeaders, AxiosError } from "axios";
import { useAuthStore } from "@/store/useStore";

let isRefreshing = false;
let failedQueue: Array<{
    resolve: () => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve();
    });
    failedQueue = [];
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://72.60.198.235:8080/api/v1';

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    withCredentials: false,
    headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "69420"
    },
});

// Request interceptor - Add auth token
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        const headers = config.headers as AxiosRequestHeaders | undefined;
        if (headers && typeof headers === 'object') {
            (headers as Record<string, string>).Authorization = `Bearer ${token}`;
        } else {
            config.headers = ({ Authorization: `Bearer ${token}` } as unknown) as AxiosRequestHeaders;
        }
    }
    return config;
});

// Response interceptor - Handle 401 and refresh token
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({
                        resolve: () => resolve(axiosInstance(originalRequest)),
                        reject,
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    useAuthStore.getState().logout();
                    processQueue(new Error('No refresh token'));
                    return Promise.reject(error);
                }

                const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken }, {
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = response.data?.result ?? response.data;
                const newAccess = data?.accessToken ?? null;

                if (newAccess) {
                    localStorage.setItem('accessToken', newAccess);
                    axiosInstance.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
                }

                processQueue(null);
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newAccess}`;
                }
                return axiosInstance(originalRequest);
            } catch (err) {
                useAuthStore.getState().logout();
                processQueue(err);
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export { BASE_URL };
export default axiosInstance;
