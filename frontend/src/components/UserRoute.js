// src/components/UserRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const UserRoute = () => {
    const isLoggedIn = !!localStorage.getItem('accessToken');

    return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
};

export default UserRoute;