// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Registration from './components/Registration';
import GrievanceStatus from './components/GrievanceStatus';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import VerifyEmail from './components/VerifyEmail';
import FAQ from './components/FAQ'; // <-- 1. Import the new FAQ component

function App() {
    return (
        <Router>
            <Routes>
                {/* The Layout component is the parent of all other routes */}
                <Route element={<Layout />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Registration />} />
                    <Route path="/verify-email/:uidb64/:token" element={<VerifyEmail />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/status" element={<GrievanceStatus />} />
                    
                    {/* 2. Add the new route for the FAQ page */}
                    <Route path="/faq" element={<FAQ />} />
                    
                    <Route path="/" element={<Login />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;