// src/components/UserDashboard.js

import React from 'react';
import { Link } from 'react-router-dom';

const UserDashboard = () => (
    <div>
        <h2>Welcome to Your Dashboard</h2>
        <p>From here you can submit a new grievance using the chat icon at the bottom-right, or check the status of your existing ones.</p>
        <Link to="/status">Click here to view your grievance status</Link>
    </div>
);

export default UserDashboard;