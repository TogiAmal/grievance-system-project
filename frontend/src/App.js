import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import GrievanceStatus from './components/GrievanceStatus';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import FAQ from './components/FAQ';
import AddGrievance from './components/AddGrievance';
import InboxPage from './components/InboxPage';
import ProfilePage from './components/ProfilePage';
import StatsPage from './components/StatsPage';
import UserRoute from './components/UserRoute';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './components/AdminDashboard';
import GrievanceDetailAdmin from './components/GrievanceDetailAdmin';
import UserManagementPage from './components/UserManagementPage';
import AdminRoute from './components/AdminRoute';
import RequestPasswordResetPage from './components/RequestPasswordResetPage';
import PasswordResetConfirmPage from './components/PasswordResetConfirmPage';
import ChangePasswordPage from './components/ChangePasswordPage';
import ResolvedGrievances from './components/ResolvedGrievances';
import AdminReviewPage from './components/AdminReviewPage'; // <-- Make sure this is imported
import InProgressGrievances from './components/InProgressGrievances';
import AdminProfilePage from './components/AdminProfilePage';
import AdminChangePasswordPage from './components/AdminChangePasswordPage';
import AdminCellMembersPage from './components/AdminCellMembersPage';
function App() {
    return (
        <Router>
            <Routes>
                {/* Public routes wrapped in Layout */}
                <Route element={<Layout />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/request-password-reset" element={<RequestPasswordResetPage />} />
                    <Route path="/reset-password/:uidb64/:token" element={<PasswordResetConfirmPage />} />
                    <Route path="/" element={<Login />} /> 
                </Route>

                {/* User specific routes wrapped in UserRoute and Layout */}
                <Route element={<UserRoute />}>
                    <Route element={<Layout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/status" element={<GrievanceStatus />} />
                        <Route path="/faq" element={<FAQ />} />
                        <Route path="/add-grievance" element={<AddGrievance />} />
                        <Route path="/inbox" element={<InboxPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/change-password" element={<ChangePasswordPage />} />
                    </Route>
                </Route>

                {/* Admin specific routes wrapped in AdminRoute and AdminLayout */}
                <Route element={<AdminRoute />}>
                    <Route element={<AdminLayout />}>
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                        
                        {/* --- ADD THIS LINE --- */}
                        <Route path="/admin/review" element={<AdminReviewPage />} /> 
                        {/* --------------------- */}
                        <Route path="/admin/in-progress" element={<InProgressGrievances />} />
                        <Route path="/admin/grievance/:id" element={<GrievanceDetailAdmin />} />
                        <Route path="/admin/users" element={<UserManagementPage />} />
                        <Route path="/admin/inbox" element={<InboxPage />} />
                        <Route path="/admin/stats" element={<StatsPage />} />
                        <Route path="/admin/resolved" element={<ResolvedGrievances />} />
                        <Route path="/admin/cell-members" element={<AdminCellMembersPage />} />
                         {/* Consider adding profile/change-password routes for admin if needed */}
                         <Route path="/admin/profile" element={<AdminProfilePage />} />
                         <Route path="/admin/change-password" element={<AdminChangePasswordPage />} />
                    </Route>
                </Route>
            </Routes>
        </Router>
    );
}

export default App;