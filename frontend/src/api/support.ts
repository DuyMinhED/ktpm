import axiosInstance from './axios';

export const supportApi = {
    getAllTickets: (params?: { status?: string; priority?: string; page?: number; size?: number }) => {
        return axiosInstance.get('/v1/support-tickets', { params });
    },

    getClinicTickets: (clinicId: string | number, params?: { status?: string; page?: number; size?: number }) => {
        return axiosInstance.get(`/v1/support-tickets/clinic/${clinicId}`, { params });
    },

    getCreatorTickets: (creatorId: string | number, params?: { status?: string; page?: number; size?: number }) => {
        return axiosInstance.get(`/v1/support-tickets/creator/${creatorId}`, { params });
    },

    getTicketById: (id: string | number) => {
        return axiosInstance.get(`/v1/support-tickets/${id}`);
    },

    createTicket: (data: any) => {
        return axiosInstance.post('/v1/support-tickets', data);
    },

    updateTicketStatus: (id: string | number, status: string, adminNote?: string) => {
        return axiosInstance.put(`/v1/support-tickets/${id}/status`, null, {
            params: { status, adminNote }
        });
    },

    getStats: () => {
        return axiosInstance.get('/v1/support-tickets/stats');
    },

    deleteTicket: (id: string | number) => {
        return axiosInstance.delete(`/v1/support-tickets/${id}`);
    }
};
