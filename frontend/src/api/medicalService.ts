import axiosInstance from './axios';

export const medicalServiceApi = {
  getAll: (clinicId?: number) => axiosInstance.get('/v1/medical-services', { params: { clinicId } }),
  getById: (id: number) => axiosInstance.get(`/v1/medical-services/${id}`),
  create: (data: any) => axiosInstance.post('/v1/medical-services', data),
  update: (id: number, data: any) => axiosInstance.put(`/v1/medical-services/${id}`, data),
  delete: (id: number) => axiosInstance.delete(`/v1/medical-services/${id}`),
  toggleStatus: (id: number) => axiosInstance.patch(`/v1/medical-services/${id}/toggle-status`),
  getStats: () => axiosInstance.get('/v1/medical-services/stats'),
};
