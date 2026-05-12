import axiosInstance from './axios';

export const doctorApi = {
  // Dashboard
  getDashboard: async () => {
    const response = await axiosInstance.get('/v1/doctor/dashboard');
    return response.data;
  },

  // Patients
  getMyPatients: async (params?: any) => {
    const response = await axiosInstance.get('/v1/doctor/patients', { params });
    return response.data;
  },

  getPatientStats: async () => {
    const response = await axiosInstance.get('/v1/doctor/patients/stats');
    return response.data;
  },

  getPatientDetail: async (id: number) => {
    const response = await axiosInstance.get(`/v1/doctor/patients/${id}`);
    return response.data;
  },

  // Prescriptions
  getPrescriptions: async (params?: any) => {
    const response = await axiosInstance.get('/v1/doctor/prescriptions', { params });
    return response.data;
  },

  getPrescriptionStats: async () => {
    const response = await axiosInstance.get('/v1/doctor/prescriptions/stats');
    return response.data;
  },

  createPrescription: async (data: any) => {
    const response = await axiosInstance.post('/v1/doctor/prescriptions', data);
    return response.data;
  },

  // Appointments
  getUpcomingAppointments: async () => {
    const response = await axiosInstance.get('/v1/doctor/appointments/upcoming');
    return response.data;
  },
  
  getAllAppointments: async () => {
    const response = await axiosInstance.get('/v1/doctor/appointments');
    return response.data;
  },

  createAppointment: async (data: any) => {
    const response = await axiosInstance.post('/v1/doctor/appointments', data);
    return response.data;
  },

  rescheduleAppointment: async (id: number, data: any) => {
    const response = await axiosInstance.put(`/v1/doctor/appointments/${id}/reschedule`, data);
    return response.data;
  },

  batchReschedule: async (sourceDate: string, targetDate: string) => {
    const response = await axiosInstance.put('/v1/doctor/appointments/batch-reschedule', null, {
      params: { sourceDate, targetDate }
    });
    return response.data;
  },

  updateAppointmentStatus: async (id: number, status: string, meetingLink?: string) => {
    const params: any = { status };
    if (meetingLink) params.meetingLink = meetingLink;
    const response = await axiosInstance.put(`/v1/doctor/appointments/${id}/status`, null, { params });
    return response.data;
  },

  // Messages
  getConversations: async () => {
    const response = await axiosInstance.get('/v1/doctor/messages/conversations');
    return response.data;
  },

  getMessages: async (conversationId: number, params?: any) => {
    const response = await axiosInstance.get(`/v1/doctor/messages/conversations/${conversationId}/messages`, { params });
    return response.data;
  },

  sendMessage: async (data: any) => {
    const response = await axiosInstance.post('/v1/doctor/messages/send', data);
    return response.data;
  },

  markMessagesAsRead: async (conversationId: number) => {
    const response = await axiosInstance.put(`/v1/doctor/messages/conversations/${conversationId}/read`);
    return response.data;
  }
};
