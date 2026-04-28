import { Routes, Route } from 'react-router-dom';
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

import LandingPage from '../pages/VelorahLandingPage';
import PatientLayout from '../layouts/PatientLayout';
import PatientDashboard from '../pages/PatientDashboard';
import PatientAppointments from '../pages/PatientAppointments';
import PatientHealthMetrics from '../pages/PatientHealthMetrics';
import PatientMessages from '../pages/PatientMessages';
import PatientPrescriptions from '../pages/PatientPrescriptions';
import PatientProfile from '../pages/PatientProfile';


const AppRoutes = () => {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<LandingPage />} />


      {/* Patient Portal Routes */}
      <Route path="/patient" element={<PatientLayout />}>
        <Route index element={<PatientDashboard />} />
        <Route path="metrics" element={<PatientHealthMetrics />} />
        <Route path="appointments" element={<PatientAppointments />} />
        <Route path="prescriptions" element={<PatientPrescriptions />} />
        <Route path="messages" element={<PatientMessages />} />
        <Route path="profile" element={<PatientProfile />} />
      </Route>
      <Route path={ROUTES.DOCTOR.DASHBOARD} element={<DoctorDashboard />} />
      <Route path={ROUTES.DOCTOR.ANALYTICS} element={<DoctorAnalytics />} />
      <Route path={ROUTES.DOCTOR.APPOINTMENTS} element={<DoctorAppointments />} />
      <Route path={ROUTES.DOCTOR.MESSAGES} element={<DoctorMessages />} />
      <Route path={ROUTES.DOCTOR.PATIENTS} element={<DoctorPatients />} />
      <Route path={ROUTES.DOCTOR.PRESCRIPTIONS} element={<DoctorPrescriptions />} />
      <Route path={ROUTES.CLINIC.DASHBOARD} element={<ClinicDashboard />} />
      <Route path={ROUTES.CLINIC.REPORTS} element={<ClinicReports />} />
      <Route path={ROUTES.CLINIC.ALERTS} element={<ClinicRiskAlerts />} />
      <Route path={ROUTES.CLINIC.PATIENTS} element={<ClinicPatients />} />
      <Route path={ROUTES.CLINIC.DOCTORS} element={<ClinicDoctors />} />
      <Route path={ROUTES.CLINIC.ASSIGNMENT} element={<ClinicAssignment />} />
      <Route path={ROUTES.CLINIC.SETTINGS} element={<ClinicSettings />} />
      <Route path={ROUTES.ADMIN.DASHBOARD} element={<AdminDashboard />} />
      <Route path={ROUTES.ADMIN.CLINICS} element={<AdminClinics />} />
      <Route path={ROUTES.ADMIN.USERS} element={<AdminUsers />} />
      <Route path={ROUTES.ADMIN.SERVICES} element={<AdminServices />} />
      <Route path={ROUTES.ADMIN.REPORTS} element={<AdminReports />} />
      <Route path={ROUTES.ADMIN.AUDIT_LOGS} element={<AdminAuditLogs />} />
      <Route path={ROUTES.ADMIN.SUPPORT} element={<AdminSupport />} />
      <Route path={ROUTES.ADMIN.SETTINGS} element={<AdminSettings />} />
    </Routes>
  );
};

export default AppRoutes;
