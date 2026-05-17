import axiosInstance from './axios';

export const userApi = {
  getUsers: async (params?: any) => {
    const response = await axiosInstance.get('/v1/admin/users', { params });
    return response.data;
  },
  getUserStats: async () => {
    const response = await axiosInstance.get('/v1/admin/users/stats');
    return response.data;
  },
  createUser: async (data: any) => {
    const response = await axiosInstance.post('/v1/admin/users', data);
    return response.data;
  },
  updateUser: async (id: number | string, data: any) => {
    const response = await axiosInstance.put(`/v1/admin/users/${id}`, data);
    return response.data;
  },
  toggleStatus: async (id: number | string) => {
    const response = await axiosInstance.patch(`/v1/admin/users/${id}/toggle-status`);
    return response.data;
  },
  getUserById: async (id: number | string) => {
    const response = await axiosInstance.get(`/v1/admin/users/${id}`);
    return response.data;
  },
  deleteUser: async (id: number | string) => {
    const response = await axiosInstance.delete(`/v1/admin/users/${id}`);
    return response.data;
  },
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await axiosInstance.put('/v1/users/change-password', data);
    return response.data;
  },
};
