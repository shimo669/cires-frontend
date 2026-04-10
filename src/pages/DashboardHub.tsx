import { useAuth } from '../contexts/AuthContext';
import CitizenDashboard from './citizen/CitizenDashboard';
import LeaderDashboard from './leader/LeaderDashboard';
import AdminDashboard from './admin/AdminDashboard';
import { Navigate } from 'react-router-dom';

const DashboardHub = () => {
    const { user } = useAuth();

    // 1. If no one is logged in, send them back to Login
    if (!user) {
        return <Navigate to="/login" />;
    }

    // 2. If the user is an ADMIN, show the Admin Dashboard
    if (user.role === 'ADMIN') {
        return <AdminDashboard />;
    }

    // 3. If the user is a LEADER, show the Leader Dashboard
    if (user.role === 'LEADER') {
        return <LeaderDashboard />;
    }

    // 4. Default: Show the Citizen Dashboard
    return <CitizenDashboard />;
};

export default DashboardHub;