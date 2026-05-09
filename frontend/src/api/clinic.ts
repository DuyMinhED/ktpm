import axiosInstance from './axios';

export const clinicApi = {
  // Clinic Manager APIs
  getDashboard: async (clinicId: string | number, period?: string) => {
    const response = await axiosInstance.get(`/v1/clinics/${clinicId}/dashboard`, { params: { period } });
    return response.data;
  },

  getPatients: async (clinicId: string | number, params?: any) => {
    const response = await axiosInstance.get(`/v1/clinics/${clinicId}/patients`, { params });
    return response.data;
  },

  createPatient: async (clinicId: string | number, data: any) => {
    const response = await axiosInstance.post(`/v1/clinics/${clinicId}/patients`, data);
    return response.data;
  },

  updatePatient: async (clinicId: string | number, patientId: string | number, data: any) => {
    const response = await axiosInstance.put(`/v1/clinics/${clinicId}/patients/${patientId}`, data);
    return response.data;
  },

  deletePatient: async (clinicId: string | number, patientId: string | number) => {
    const response = await axiosInstance.delete(`/v1/clinics/${clinicId}/patients/${patientId}`);
    return response.data;
  },

  getDoctors: async (clinicId: string | number, params?: any) => {
    const response = await axiosInstance.get(`/v1/clinics/${clinicId}/doctors`, { params });
    return response.data;
  },

  createDoctor: async (clinicId: string | number, data: any) => {
    const response = await axiosInstance.post(`/v1/clinics/${clinicId}/doctors`, data);
    return response.data;
  },

  updateDoctor: async (clinicId: string | number, doctorId: string | number, data: any) => {
    const response = await axiosInstance.put(`/v1/clinics/${clinicId}/doctors/${doctorId}`, data);
    return response.data;
  },

  deleteDoctor: async (clinicId: string | number, doctorId: string | number) => {
    const response = await axiosInstance.delete(`/v1/clinics/${clinicId}/doctors/${doctorId}`);
    return response.data;
  },

  getAvailableDoctors: async (clinicId: string | number) => {
    const response = await axiosInstance.get(`/v1/clinics/${clinicId}/doctors/available`);
    return response.data;
  },

  getConditions: async (clinicId: string | number) => {
    const response = await axiosInstance.get(`/v1/clinics/${clinicId}/conditions`);
    return response.data;
  },

  getProfile: async (clinicId: string | number) => {
    const response = await axiosInstance.get(`/v1/clinics/${clinicId}/profile`);
    return response.data;
  },

  getAppointments: async (clinicId: string | number, params?: any) => {
    const response = await axiosInstance.get(`/v1/clinics/${clinicId}/appointments`, { params });
    return response.data;
  },

  createAppointment: async (clinicId: string | number, data: any) => {
    const response = await axiosInstance.post(`/v1/clinics/${clinicId}/appointments`, data);
    return response.data;
  },

  updateProfile: async (clinicId: string | number, data: any) => {
    const response = await axiosInstance.put(`/v1/clinics/${clinicId}/profile`, data);
    return response.data;
  },

  updateAppointmentStatus: async (clinicId: string | number, appointmentId: string | number, status: string) => {
    const response = await axiosInstance.patch(`/v1/clinics/${clinicId}/appointments/${appointmentId}/status`, { status });
    return response.data;
  },

  // Admin Clinic Management (if needed by Admin role)
  getClinics: async (params?: any) => {
    const response = await axiosInstance.get('/v1/admin/clinics', { params });
    return response.data;
  },

  createClinic: async (clinicData: any) => {
    const response = await axiosInstance.post('/v1/admin/clinics', clinicData);
    return response.data;
  },

  getClinicById: async (id: number) => {
    const response = await axiosInstance.get(`/v1/admin/clinics/${id}`);
    return response.data;
  },

  updateClinic: async (id: number, clinicData: any) => {
    const response = await axiosInstance.put(`/v1/admin/clinics/${id}`, clinicData);
    return response.data;
  },

  toggleClinicStatus: async (id: number) => {
    const response = await axiosInstance.patch(`/v1/admin/clinics/${id}/toggle-status`);
    return response.data;
  },

  getClinicStats: async () => {
    const response = await axiosInstance.get('/v1/admin/clinics/stats');
    return response.data;
  },
};
