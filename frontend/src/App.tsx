import { Routes, Route, Navigate } from 'react-router-dom';
import PatientListView from './views/PatientListView';
import PatientDashboardView from './views/PatientDashboardView';
import PatientRegistrationView from './views/PatientRegistrationView';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/patients" replace />} />
      <Route path="/patients" element={<PatientListView />} />
      <Route path="/patients/new" element={<PatientRegistrationView />} />
      <Route path="/patients/:id" element={<PatientDashboardView />} />
    </Routes>
  );
}
