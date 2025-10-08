import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
    const userRole = localStorage.getItem('userRole');
    const isAdmin = userRole === 'admin' || userRole === 'grievance_cell';

    return isAdmin ? <Outlet /> : <Navigate to="/dashboard" />;
};

export default AdminRoute;