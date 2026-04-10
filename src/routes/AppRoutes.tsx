import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/public/Login';
import Register from '../pages/public/Register';
import DashboardHub from '../pages/DashboardHub'; // Import the new file
import SubmitReport from '../pages/citizen/SubmitReport';
import ProtectedRoute from './ProtectedRoute'; // Import the ProtectedRoute component
import EscalationQueue from '../pages/leader/EscalationQueue'; // Import Leader specific page
import SLAConfig from '../pages/admin/SLAConfig'; // Import Admin specific page
import UserManagement from '../pages/admin/UserManagement';

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Both roles go to /dashboard, but DashboardHub decides what they see */}
            <Route path="/dashboard" element={<DashboardHub />} />

            <Route path="/report/new" element={<ProtectedRoute roles={['CITIZEN']}><SubmitReport /></ProtectedRoute>} />

            {/* Leader specific routes */}
            <Route path="/escalations" element={<ProtectedRoute roles={['LEADER']}><EscalationQueue /></ProtectedRoute>} />

            {/* Admin specific routes */}
            <Route path="/admin/sla-config" element={<ProtectedRoute roles={['ADMIN']}><SLAConfig /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><UserManagement /></ProtectedRoute>} />

            {/* Backward-compatible aliases for role-based login redirects */}
            <Route path="/citizen/dashboard" element={<Navigate to="/dashboard" replace />} />
            <Route path="/leader/dashboard" element={<Navigate to="/dashboard" replace />} />
            <Route path="/reports" element={<Navigate to="/dashboard" replace />} />

            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="*" element={<div>Page Not Found</div>} />
        </Routes>
    );
};

export default AppRoutes;
