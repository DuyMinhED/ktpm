import axiosInstance from './axios';

export const authApi = {
  login: async (data: any) => {
    const response = await axiosInstance.post('/v1/auth/login', data);
    return response.data;
  },
  getMe: async () => {
    const response = await axiosInstance.get('/v1/users/me');
    return response.data;
  },
};
