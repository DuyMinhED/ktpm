import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { ROUTES } from '../constants/routes';

// Landing page - load ngay vì là entry point
import LandingPage from '../pages/VelorahLandingPage';
import NotFoundPage from '../pages/NotFoundPage';

// Layouts
import PatientLayout from '../layouts/PatientLayout';

// === LAZY LOADED PAGES ===
// Patient
const PatientDashboard = lazy(() => import('../pages/PatientDashboard'));
const PatientAppointments = lazy(() => import('../pages/PatientAppointments'));
const PatientHealthMetrics = lazy(() => import('../pages/PatientHealthMetrics'));
const PatientMessages = lazy(() => import('../pages/PatientMessages'));
const PatientPrescriptions = lazy(() => import('../pages/PatientPrescriptions'));
const PatientProfile = lazy(() => import('../pages/PatientProfile'));
const PatientServices = lazy(() => import('../pages/PatientServices'));

// Doctor
const DoctorDashboard = lazy(() => import('../pages/DoctorDashboard'));
const DoctorAnalytics = lazy(() => import('../pages/DoctorAnalytics'));
const DoctorAppointments = lazy(() => import('../pages/DoctorAppointments'));
const DoctorMessages = lazy(() => import('../pages/DoctorMessages'));
const DoctorPatients = lazy(() => import('../pages/DoctorPatients'));
const DoctorPrescriptions = lazy(() => import('../pages/DoctorPrescriptions'));

// Clinic Manager
const ClinicDashboard = lazy(() => import('../pages/ClinicDashboard'));
const ClinicReports = lazy(() => import('../pages/ClinicReports'));
const ClinicRiskAlerts = lazy(() => import('../pages/ClinicRiskAlerts'));
const ClinicPatients = lazy(() => import('../pages/ClinicPatients'));
const ClinicDoctors = lazy(() => import('../pages/ClinicDoctors'));
const ClinicAssignment = lazy(() => import('../pages/ClinicAssignment'));
const ClinicAppointments = lazy(() => import('../pages/ClinicAppointments'));
const ClinicServices = lazy(() => import('../pages/ClinicServices'));
const ClinicSettings = lazy(() => import('../pages/ClinicSettings'));
const ClinicSupport = lazy(() => import('../pages/ClinicSupport'));

// Admin
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
const AdminClinics = lazy(() => import('../pages/AdminClinics'));
const AdminUsers = lazy(() => import('../pages/AdminUsers'));
const AdminServices = lazy(() => import('../pages/AdminServices'));
const AdminReports = lazy(() => import('../pages/AdminReports'));
const AdminSettings = lazy(() => import('../pages/AdminSettings'));
const AdminAuditLogs = lazy(() => import('../pages/AdminAuditLogs'));
const AdminSupport = lazy(() => import('../pages/AdminSupport'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
    <div className="flex flex-col items-center gap-5">
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-xl shadow-primary/20 animate-pulse">
          <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            favorite
          </span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Đang tải trang...</p>
        <p className="text-xs text-slate-400 mt-0.5">DamDiep Healthcare</p>
      </div>
    </div>
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path={ROUTES.HOME} element={<LandingPage />} />

        {/* Patient Portal Routes — Only PATIENT role */}
        <Route path="/patient" element={
          <ProtectedRoute allowedRoles={['PATIENT']}>
            <PatientLayout />
          </ProtectedRoute>
        }>
          <Route index element={<PatientDashboard />} />
          <Route path="metrics" element={<PatientHealthMetrics />} />
          <Route path="appointments" element={<PatientAppointments />} />
          <Route path="prescriptions" element={<PatientPrescriptions />} />
          <Route path="messages" element={<PatientMessages />} />
          <Route path="profile" element={<PatientProfile />} />
          <Route path="services" element={<PatientServices />} />
        </Route>

        {/* Doctor Routes — Only DOCTOR role */}
        <Route path={ROUTES.DOCTOR.DASHBOARD} element={<ProtectedRoute allowedRoles={['DOCTOR']}><DoctorDashboard /></ProtectedRoute>} />
        <Route path={ROUTES.DOCTOR.ANALYTICS} element={<ProtectedRoute allowedRoles={['DOCTOR']}><DoctorAnalytics /></ProtectedRoute>} />
        <Route path={ROUTES.DOCTOR.APPOINTMENTS} element={<ProtectedRoute allowedRoles={['DOCTOR']}><DoctorAppointments /></ProtectedRoute>} />
        <Route path={ROUTES.DOCTOR.MESSAGES} element={<ProtectedRoute allowedRoles={['DOCTOR']}><DoctorMessages /></ProtectedRoute>} />
        <Route path={ROUTES.DOCTOR.PATIENTS} element={<ProtectedRoute allowedRoles={['DOCTOR']}><DoctorPatients /></ProtectedRoute>} />
        <Route path={ROUTES.DOCTOR.PRESCRIPTIONS} element={<ProtectedRoute allowedRoles={['DOCTOR']}><DoctorPrescriptions /></ProtectedRoute>} />

        {/* Clinic Manager Routes — Only CLINIC_MANAGER or ADMIN */}
        <Route path={ROUTES.CLINIC.DASHBOARD} element={<ProtectedRoute allowedRoles={['CLINIC_MANAGER', 'ADMIN']}><ClinicDashboard /></ProtectedRoute>} />
        <Route path={ROUTES.CLINIC.REPORTS} element={<ProtectedRoute allowedRoles={['CLINIC_MANAGER', 'ADMIN']}><ClinicReports /></ProtectedRoute>} />
        <Route path={ROUTES.CLINIC.ALERTS} element={<ProtectedRoute allowedRoles={['CLINIC_MANAGER', 'ADMIN']}><ClinicRiskAlerts /></ProtectedRoute>} />
        <Route path={ROUTES.CLINIC.PATIENTS} element={<ProtectedRoute allowedRoles={['CLINIC_MANAGER', 'ADMIN']}><ClinicPatients /></ProtectedRoute>} />
        <Route path={ROUTES.CLINIC.DOCTORS} element={<ProtectedRoute allowedRoles={['CLINIC_MANAGER', 'ADMIN']}><ClinicDoctors /></ProtectedRoute>} />
        <Route path={ROUTES.CLINIC.ASSIGNMENT} element={<ProtectedRoute allowedRoles={['CLINIC_MANAGER', 'ADMIN']}><ClinicAssignment /></ProtectedRoute>} />
        <Route path={ROUTES.CLINIC.APPOINTMENTS} element={<ProtectedRoute allowedRoles={['CLINIC_MANAGER', 'ADMIN']}><ClinicAppointments /></ProtectedRoute>} />
        <Route path={ROUTES.CLINIC.SERVICES} element={<ProtectedRoute allowedRoles={['CLINIC_MANAGER', 'ADMIN']}><ClinicServices /></ProtectedRoute>} />
        <Route path={ROUTES.CLINIC.SETTINGS} element={<ProtectedRoute allowedRoles={['CLINIC_MANAGER', 'ADMIN']}><ClinicSettings /></ProtectedRoute>} />
        <Route path={ROUTES.CLINIC.SUPPORT} element={<ProtectedRoute allowedRoles={['CLINIC_MANAGER', 'ADMIN']}><ClinicSupport /></ProtectedRoute>} />

        {/* Admin Routes — Only ADMIN */}
        <Route path={ROUTES.ADMIN.DASHBOARD} element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
        <Route path={ROUTES.ADMIN.CLINICS} element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminClinics /></ProtectedRoute>} />
        <Route path={ROUTES.ADMIN.USERS} element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminUsers /></ProtectedRoute>} />
        <Route path={ROUTES.ADMIN.SERVICES} element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminServices /></ProtectedRoute>} />
        <Route path={ROUTES.ADMIN.REPORTS} element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminReports /></ProtectedRoute>} />
        <Route path={ROUTES.ADMIN.AUDIT_LOGS} element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminAuditLogs /></ProtectedRoute>} />
        <Route path={ROUTES.ADMIN.SUPPORT} element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminSupport /></ProtectedRoute>} />
        <Route path={ROUTES.ADMIN.SETTINGS} element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminSettings /></ProtectedRoute>} />

        {/* 404 Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
