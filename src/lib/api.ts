import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';

// Use local API routes (Next.js API)
const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      Cookies.remove('token');
      Cookies.remove('user');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Helper to extract data from response
const extractData = (response: any) => response?.data || response;

// Auth APIs
export const authAPI = {
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    return extractData(res);
  },

  sendOtp: async (email: string) => {
    const res = await api.post('/auth/send-otp', { email });
    return extractData(res);
  },

  loginWithOtp: async (email: string, otp: string) => {
    const res = await api.post('/auth/login-otp', { email, otp });
    return extractData(res);
  },

  verifyBarCode: async (data: { google2fasecret: string; emp_id: string; code: string }) => {
    const res = await api.post('/auth/verify-2fa', data);
    return extractData(res);
  },

  forgetPassword: async (email: string) => {
    const res = await api.post('/auth/forgot-password', { email });
    return extractData(res);
  },

  resetPassword: async (data: { token: string; password: string; password_confirmation: string }) => {
    const res = await api.post('/auth/reset-password', data);
    return extractData(res);
  },

  changePassword: async (data: { old_password: string; password: string; password_confirmation: string }) => {
    const res = await api.post('/auth/change-password', data);
    return extractData(res);
  },

  logout: async () => {
    const res = await api.post('/auth/logout');
    return extractData(res);
  },

  loginUserData: async () => {
    const res = await api.get('/auth/user-data');
    return extractData(res);
  },
};

// Dashboard APIs
export const dashboardAPI = {
  getWidgets: async (uid: string) => {
    const res = await api.get(`/dashboard/widgets/${uid}`);
    return extractData(res);
  },
  updateWidgets: async (uid: string, data: unknown) => {
    const res = await api.post(`/dashboard/widgets/${uid}`, data);
    return extractData(res);
  },
};

// Employee APIs
export const employeesAPI = {
  getAll: async (params?: Record<string, any>) => {
    const res = await api.get('/employees', { params });
    return extractData(res);
  },

  getById: async (id: string | number) => {
    const res = await api.get(`/employees/${id}`);
    return extractData(res);
  },

  create: async (data: unknown) => {
    const res = await api.post('/employees', data);
    return extractData(res);
  },

  update: async (id: number, data: unknown) => {
    const res = await api.put(`/employees/${id}`, data);
    return extractData(res);
  },

  delete: async (id: number) => {
    const res = await api.delete(`/employees/${id}`);
    return extractData(res);
  },

  // Documents
  getDocuments: async (id: number) => {
    const res = await api.get(`/employees/${id}/documents`);
    return extractData(res);
  },
  saveDocument: async (id: number, data: unknown) => {
    const res = await api.post(`/employees/${id}/documents`, data);
    return extractData(res);
  },
  deleteDocument: async (id: number, docId: number) => {
    const res = await api.delete(`/employees/${id}/documents?docId=${docId}`);
    return extractData(res);
  },

  // Emergency Contacts
  getEmergencyContacts: async (id: number) => {
    const res = await api.get(`/employees/${id}/emergency-contacts`);
    return extractData(res);
  },
  saveEmergencyContact: async (id: number, data: unknown) => {
    const res = await api.post(`/employees/${id}/emergency-contacts`, data);
    return extractData(res);
  },
  deleteEmergencyContact: async (id: number, contactId: number) => {
    const res = await api.delete(`/employees/${id}/emergency-contacts?contactId=${contactId}`);
    return extractData(res);
  },

  // Family
  getFamily: async (id: number) => {
    const res = await api.get(`/employees/${id}/family`);
    return extractData(res);
  },
  saveFamily: async (id: number, data: unknown) => {
    const res = await api.post(`/employees/${id}/family`, data);
    return extractData(res);
  },
  deleteFamily: async (id: number, familyId: number) => {
    const res = await api.delete(`/employees/${id}/family?familyId=${familyId}`);
    return extractData(res);
  },

  // Salary
  getSalary: async (id: number) => {
    const res = await api.get(`/employees/${id}/salary`);
    return extractData(res);
  },
  saveSalary: async (id: number, data: unknown) => {
    const res = await api.post(`/employees/${id}/salary`, data);
    return extractData(res);
  },
  deleteSalary: async (id: number, salaryId: number) => {
    const res = await api.delete(`/employees/${id}/salary?salaryId=${salaryId}`);
    return extractData(res);
  },

  // Experience
  getExperience: async (id: number) => {
    const res = await api.get(`/employees/${id}/experience`);
    return extractData(res);
  },
  saveExperience: async (id: number, data: unknown) => {
    const res = await api.post(`/employees/${id}/experience`, data);
    return extractData(res);
  },
  deleteExperience: async (id: number, expId: number) => {
    const res = await api.delete(`/employees/${id}/experience?expId=${expId}`);
    return extractData(res);
  },

  // Education
  getEducation: async (id: number) => {
    const res = await api.get(`/employees/${id}/education`);
    return extractData(res);
  },
  saveEducation: async (id: number, data: unknown) => {
    const res = await api.post(`/employees/${id}/education`, data);
    return extractData(res);
  },
  deleteEducation: async (id: number, eduId: number) => {
    const res = await api.delete(`/employees/${id}/education?eduId=${eduId}`);
    return extractData(res);
  },

  // Bank
  getBank: async (id: number) => {
    const res = await api.get(`/employees/${id}/bank`);
    return extractData(res);
  },
  saveBank: async (id: number, data: unknown) => {
    const res = await api.post(`/employees/${id}/bank`, data);
    return extractData(res);
  },
};

// Document Requests API
export const documentRequestsAPI = {
  getAll: async (mode?: 'admin' | 'user') => {
    const res = await api.get('/document-requests', { params: { mode } });
    return extractData(res);
  },

  getById: async (id: number) => {
    const res = await api.get(`/document-requests/${id}`);
    return extractData(res);
  },

  create: async (data: { document_type: string; reason?: string }) => {
    const res = await api.post('/document-requests', data);
    return extractData(res);
  },

  update: async (id: number, data: any) => {
    const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const res = await api.put(`/document-requests/${id}`, data, config);
    return extractData(res);
  },

  delete: async (id: number) => {
    const res = await api.delete(`/document-requests/${id}`);
    return extractData(res);
  },
};

// Leave APIs
export const leaveAPI = {
  getAll: async (params?: Record<string, any>) => {
    const res = await api.get('/leave', { params });
    return extractData(res);
  },

  getById: async (id: number) => {
    const res = await api.get(`/leave/${id}`);
    return extractData(res);
  },

  apply: async (data: unknown) => {
    const res = await api.post('/leave', data);
    return extractData(res);
  },

  adminApply: async (data: unknown) => {
    const res = await api.post('/leave/admin-apply', data);
    return extractData(res);
  },

  approve: async (id: number, data: { type: number; reason?: string }) => {
    const res = await api.post(`/leave/${id}/approve`, data);
    return extractData(res);
  },

  delete: async (id: number) => {
    const res = await api.delete(`/leave/${id}`);
    return extractData(res);
  },

  getAllocations: async (uid: string) => {
    const res = await api.get(`/leave/allocations/${uid}`);
    return extractData(res);
  },

  getBalance: async (uid?: string) => {
    const res = await api.get(`/leave/balance${uid ? `?uid=${uid}` : ''}`);
    return extractData(res);
  },

  getStatuses: async () => {
    const res = await api.get('/leave/statuses');
    return extractData(res);
  },
};

// Client APIs
export const clientsAPI = {
  getAll: async (params?: Record<string, any>) => {
    const res = await api.get('/clients', { params });
    return extractData(res);
  },

  getById: async (id: number) => {
    const res = await api.get(`/clients/${id}`);
    return extractData(res);
  },

  create: async (data: unknown) => {
    const res = await api.post('/clients', data);
    return extractData(res);
  },

  update: async (id: number, data: unknown) => {
    const res = await api.put(`/clients/${id}`, data);
    return extractData(res);
  },

  delete: async (id: number) => {
    const res = await api.delete(`/clients/${id}`);
    return extractData(res);
  },
};

// Vendor APIs
export const vendorsAPI = {
  getAll: async (params?: Record<string, any>) => {
    const res = await api.get('/vendors', { params });
    return extractData(res);
  },

  getById: async (id: number) => {
    const res = await api.get(`/vendors/${id}`);
    return extractData(res);
  },

  create: async (data: unknown) => {
    const res = await api.post('/vendors', data);
    return extractData(res);
  },

  update: async (id: number, data: unknown) => {
    const res = await api.put(`/vendors/${id}`, data);
    return extractData(res);
  },

  delete: async (id: number) => {
    const res = await api.delete(`/vendors/${id}`);
    return extractData(res);
  },
};

// Candidates APIs
export const candidatesAPI = {
  getAll: async (params?: Record<string, any>) => {
    const res = await api.get('/candidates', { params });
    return extractData(res);
  },

  getById: async (id: number) => {
    const res = await api.get(`/candidates/${id}`);
    return extractData(res);
  },

  create: async (data: unknown) => {
    const res = await api.post('/candidates', data);
    return extractData(res);
  },

  update: async (id: number, data: unknown) => {
    const res = await api.put(`/candidates/${id}`, data);
    return extractData(res);
  },

  delete: async (id: number) => {
    const res = await api.delete(`/candidates/${id}`);
    return extractData(res);
  },
};

// Project APIs
export const projectsAPI = {
  getAll: async (params?: Record<string, any>) => {
    const res = await api.get('/projects', { params });
    return extractData(res);
  },

  getById: async (id: number) => {
    const res = await api.get(`/projects/${id}`);
    return extractData(res);
  },

  create: async (data: unknown) => {
    const res = await api.post('/projects', data);
    return extractData(res);
  },

  update: async (id: number, data: unknown) => {
    const res = await api.put(`/projects/${id}`, data);
    return extractData(res);
  },

  delete: async (id: number) => {
    const res = await api.delete(`/projects/${id}`);
    return extractData(res);
  },
};

// Opportunity APIs
export const opportunitiesAPI = {
  getAll: async (params?: Record<string, any>) => {
    const res = await api.get('/opportunities', { params });
    return extractData(res);
  },

  getById: async (id: number) => {
    const res = await api.get(`/opportunities/${id}`);
    return extractData(res);
  },

  create: async (data: unknown) => {
    const res = await api.post('/opportunities', data);
    return extractData(res);
  },

  update: async (id: number, data: unknown) => {
    const res = await api.put(`/opportunities/${id}`, data);
    return extractData(res);
  },

  delete: async (id: number) => {
    const res = await api.delete(`/opportunities/${id}`);
    return extractData(res);
  },
};

// Sales / Invoice APIs
export const salesAPI = {
  getAll: async (params?: Record<string, any>) => {
    const res = await api.get('/sales', { params });
    return extractData(res);
  },

  getById: async (id: number) => {
    const res = await api.get(`/sales/${id}`);
    return extractData(res);
  },

  create: async (data: unknown) => {
    const res = await api.post('/sales', data);
    return extractData(res);
  },

  update: async (id: number, data: unknown) => {
    const res = await api.put(`/sales/${id}`, data);
    return extractData(res);
  },

  delete: async (id: number) => {
    const res = await api.delete(`/sales/${id}`);
    return extractData(res);
  },

  updateStatus: async (id: number, data: { status: string }) => {
    const res = await api.post(`/sales/${id}/status`, data);
    return extractData(res);
  },

  generatePdf: async (id: number) => {
    const res = await api.get(`/sales/${id}/pdf`);
    return extractData(res);
  },
};

// Master Data APIs
export const mastersAPI = {
  // Designations
  getDesignations: async (params?: Record<string, any>) => {
    const res = await api.get('/masters/designations', { params });
    return extractData(res);
  },

  // Teams / Departments
  getTeams: async (params?: Record<string, any>) => {
    const res = await api.get('/masters/teams', { params });
    return extractData(res);
  },
  getDepartments: async (params?: Record<string, any>) => {
    const res = await api.get('/masters/teams', { params });
    return extractData(res);
  },

  // Leave Types
  getLeaveTypes: async (params?: Record<string, any>) => {
    const res = await api.get('/masters/leave-types', { params });
    return extractData(res);
  },

  // Roles
  getRoles: async (params?: Record<string, any>) => {
    const res = await api.get('/masters/roles', { params });
    return extractData(res);
  },

  // Countries
  getCountries: async (params?: Record<string, any>) => {
    const res = await api.get('/masters/countries', { params });
    return extractData(res);
  },

  // Industries
  getIndustries: async (params?: Record<string, any>) => {
    const res = await api.get('/masters/industries', { params });
    return extractData(res);
  },

  // Status
  getStatus: async (moduleId?: number) => {
    const res = await api.get('/masters/status', { params: moduleId ? { module_id: moduleId } : {} });
    return extractData(res);
  },

  // Get statuses for specific module by name
  getStatuses: async (moduleName: string) => {
    const res = await api.get('/masters/status', { params: { module: moduleName } });
    return extractData(res);
  },

  // Document Types
  getDocumentTypes: async () => {
    const res = await api.get('/masters/document-types');
    return extractData(res);
  },

  // Allowance Types
  getAllowanceTypes: async () => {
    const res = await api.get('/masters/allowance-types');
    return extractData(res);
  },

  // Consent Forms
  getConsentForms: async () => {
    const res = await api.get('/masters/consent-forms');
    return extractData(res);
  },

  // Currencies
  getCurrencies: async () => {
    const res = await api.get('/masters/currencies');
    return extractData(res);
  },

  // Vendors (for employee form)
  getVendors: async (params?: Record<string, any>) => {
    const res = await api.get('/vendors', { params });
    return extractData(res);
  },
};

// Reports APIs
export const reportsAPI = {
  getProjectProfitability: async () => {
    const res = await api.get('/reports/project-profitability');
    return extractData(res);
  },
  getEmployeeList: async () => {
    const res = await api.get('/reports/employees');
    return extractData(res);
  },
  getLeaveReport: async () => {
    const res = await api.get('/reports/leave');
    return extractData(res);
  },
  getExpiryReport: async () => {
    const res = await api.get('/reports/expiry');
    return extractData(res);
  },
};

// Settings APIs
export const settingsAPI = {
  getCompanySettings: async () => {
    const res = await api.get('/settings/company');
    return extractData(res);
  },
  saveCompanySettings: async (data: unknown) => {
    const res = await api.post('/settings/company', data);
    return extractData(res);
  },
};

// Admin APIs
export const adminAPI = {
  getRoles: async () => {
    const res = await api.get('/admin/roles');
    return extractData(res);
  },

  getAllPermissions: async () => {
    const res = await api.get('/admin/permissions');
    return extractData(res);
  },

  getRolePermissions: async (roleId: number) => {
    const res = await api.get(`/admin/roles/${roleId}/permissions`);
    return extractData(res);
  },

  updateRolePermissions: async (roleId: number, permissionIds: number[]) => {
    const res = await api.post(`/admin/roles/${roleId}/permissions`, { permissionIds });
    return extractData(res);
  },
};

// File Upload API
export const fileAPI = {
  upload: async (data: FormData) => {
    const res = await api.post('/upload', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return extractData(res);
  },
};

// Legacy exports for backwards compatibility
export const employeeAPI = employeesAPI;
export const clientAPI = clientsAPI;
export const vendorAPI = vendorsAPI;
export const projectAPI = projectsAPI;
export const masterAPI = mastersAPI;
export const reportAPI = reportsAPI;

export default api;
