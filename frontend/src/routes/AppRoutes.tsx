import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import DoctorDashboard from '../pages/DoctorDashboard';
import DoctorAppointments from '../pages/DoctorAppointments';
import DoctorMessages from '../pages/DoctorMessages';
import ClinicDashboard from '../pages/ClinicDashboard';
import DoctorAnalytics from '../pages/DoctorAnalytics';
import DoctorPatients from '../pages/DoctorPatients';
import DoctorPrescriptions from '../pages/DoctorPrescriptions';
import { ROUTES } from '../constants/routes';
import AdminDashboard from '../pages/AdminDashboard';
import AdminClinics from '../pages/AdminClinics';
import AdminUsers from '../pages/AdminUsers';
import AdminServices from '../pages/AdminServices';
import AdminReports from '../pages/AdminReports';
import AdminSettings from '../pages/AdminSettings';
import AdminAuditLogs from '../pages/AdminAuditLogs';
import AdminSupport from '../pages/AdminSupport';
import ClinicReports from '../pages/ClinicReports';
import ClinicRiskAlerts from '../pages/ClinicRiskAlerts';
import ClinicPatients from '../pages/ClinicPatients';
import ClinicDoctors from '../pages/ClinicDoctors';
import ClinicAssignment from '../pages/ClinicAssignment';
import ClinicSettings from '../pages/ClinicSettings';
import ClinicAppointments from '../pages/ClinicAppointments';
import ClinicServices from '../pages/ClinicServices';
import ClinicSupport from '../pages/ClinicSupport';

import LandingPage from '../pages/VelorahLandingPage';
import PatientLayout from '../layouts/PatientLayout';
import PatientDashboard from '../pages/PatientDashboard';
import PatientAppointments from '../pages/PatientAppointments';
import PatientHealthMetrics from '../pages/PatientHealthMetrics';
import PatientMessages from '../pages/PatientMessages';
import PatientPrescriptions from '../pages/PatientPrescriptions';
import PatientProfile from '../pages/PatientProfile';
import PatientServices from '../pages/PatientServices';


const AppRoutes = () => {
  return (
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
    </Routes>
  );
};

export default AppRoutes;
