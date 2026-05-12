import axiosInstance from './axios';

export const patientApi = {
  recordMetric: async (metricData: any) => {
    // Controller mapping is /api/v1/patient/health-metrics
    const response = await axiosInstance.post('/v1/patient/health-metrics', metricData);
    return response.data;
  },

  getHistory: async (page = 0, size = 10) => {
    const response = await axiosInstance.get(`/v1/patient/health-metrics/history?page=${page}&size=${size}`);
    return response.data;
  },

  getDashboard: async () => {
    const response = await axiosInstance.get('/v1/patient/dashboard');
    return response.data;
  },

  getMetricsSummary: async (period = 'WEEK') => {
    const response = await axiosInstance.get(`/v1/patient/health-metrics/summary?period=${period}`);
    return response.data;
  },

  getChartData: async (metricType: string, period = 'WEEK') => {
    const response = await axiosInstance.get(`/v1/patient/health-metrics/chart?metricType=${metricType}&period=${period}`);
    return response.data;
  },

  getProfile: async () => {
    const response = await axiosInstance.get('/v1/patient/profile');
    return response.data;
  },
  
  updateProfile: async (profileData: any) => {
    const response = await axiosInstance.put('/v1/patient/profile', profileData);
    return response.data;
  },

  downloadReport: async () => {
    const response = await axiosInstance.get('/v1/patient/profile/download-report', {
      responseType: 'blob'
    });
    return response.data;
  },

  addEmergencyContact: async (contactData: any) => {
    const response = await axiosInstance.post('/v1/patient/profile/emergency-contacts', contactData);
    return response.data;
  },

  updateEmergencyContact: async (id: number, contactData: any) => {
    const response = await axiosInstance.put(`/v1/patient/profile/emergency-contacts/${id}`, contactData);
    return response.data;
  },

  // Prescriptions
  getActivePrescriptions: async () => {
    const response = await axiosInstance.get('/v1/patient/prescriptions/active');
    return response.data;
  },

  getPrescriptionHistory: async () => {
    const response = await axiosInstance.get('/v1/patient/prescriptions/history');
    return response.data;
  },

  getTodayMedicationSchedule: async () => {
    const response = await axiosInstance.get('/v1/patient/prescriptions/today-schedule');
    return response.data;
  },

  logMedication: async (data: { scheduleId: number; status: string; notes?: string }) => {
    const response = await axiosInstance.post('/v1/patient/prescriptions/log-medication', data);
    return response.data;
  },

  requestRefill: async (prescriptionId: number) => {
    const response = await axiosInstance.post(`/v1/patient/prescriptions/${prescriptionId}/request-refill`);
    return response.data;
  },

  // Appointments
  getUpcomingAppointments: async () => {
    const response = await axiosInstance.get('/v1/patient/appointments/upcoming');
    return response.data;
  },

  getAppointmentHistory: async (page = 0, size = 10) => {
    const response = await axiosInstance.get(`/v1/patient/appointments/history?page=${page}&size=${size}`);
    return response.data;
  },

  getAvailableDoctors: async () => {
    const response = await axiosInstance.get('/v1/patient/appointments/doctors');
    return response.data;
  },

  createAppointment: async (data: any) => {
    const response = await axiosInstance.post('/v1/patient/appointments', data);
    return response.data;
  },

  cancelAppointment: async (id: number) => {
    const response = await axiosInstance.put(`/v1/patient/appointments/${id}/cancel`);
    return response.data;
  },
  
  toggleReminder: async (id: number, enabled: boolean) => {
    const response = await axiosInstance.put(`/v1/patient/appointments/${id}/reminder`, null, { params: { enabled } });
    return response.data;
  },

  // Messages APIs
  getConversations: async () => {
    const response = await axiosInstance.get('/v1/patient/messages/conversations');
    return response.data;
  },
  getMessages: async (conversationId: number, page = 0, size = 50) => {
    const response = await axiosInstance.get(`/v1/patient/messages/conversations/${conversationId}/messages`, {
      params: { page, size, sort: 'sentAt,asc' }
    });
    return response.data;
  },
  sendMessage: async (data: { conversationId: number; content: string; messageType?: string; attachmentUrl?: string }) => {
    const response = await axiosInstance.post('/v1/patient/messages/send', data);
    return response.data;
  },
  markMessagesAsRead: async (conversationId: number) => {
    const response = await axiosInstance.put(`/v1/patient/messages/conversations/${conversationId}/read`);
    return response.data;
  },

  // Notification management
  getNotifications: async () => {
    const response = await axiosInstance.get('/v1/notifications');
    return response.data;
  },
  getUnreadNotificationsCount: async () => {
    const response = await axiosInstance.get('/v1/notifications/unread-count');
    return response.data;
  },
  markNotificationAsRead: async (id: number) => {
    const response = await axiosInstance.put(`/v1/notifications/${id}/read`);
    return response.data;
  },
  markAllNotificationsAsRead: async () => {
    const response = await axiosInstance.put('/v1/notifications/read-all');
    return response.data;
  },
  deleteNotification: async (id: number) => {
    const response = await axiosInstance.delete(`/v1/notifications/${id}`);
    return response.data;
  }
};
