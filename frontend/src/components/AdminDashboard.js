import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, Grid, Paper } from '@mui/material';
import GrievanceTable from './GrievanceTable';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [grievances, setGrievances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setError('Authentication token not found. Please log in.');
                setLoading(false);
                return;
            }
            
            const headers = { 'Authorization': `Bearer ${token}` };
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

            try {
                const [statsRes, grievancesRes] = await Promise.all([
                    axios.get(`${apiUrl}/api/grievances/stats/`, { headers }),
                    axios.get(`${apiUrl}/api/grievances/`, { headers })
                ]);
                
                setStats(statsRes.data);
                setGrievances(grievancesRes.data);
            } catch (err) {
                setError('Failed to fetch admin data. You may not have permission.');
                console.error("Failed to fetch admin data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <Typography>Loading dashboard...</Typography>;
    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <Container maxWidth="lg">
            <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>Admin Dashboard</Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* 'item' prop removed from the Grid components below */}
                <Grid xs={12} sm={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">Total Grievances</Typography>
                        <Typography variant="h4">{stats?.total_grievances}</Typography>
                    </Paper>
                </Grid>
                <Grid xs={12} sm={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">Pending</Typography>
                        <Typography variant="h4" color="error">{stats?.pending_grievances}</Typography>
                    </Paper>
                </Grid>
                <Grid xs={12} sm={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">Resolved</Typography>
                        <Typography variant="h4" color="primary">{stats?.resolved_grievances}</Typography>
                    </Paper>
                </Grid>
            </Grid>

            <Paper sx={{ p: 2, height: 600, width: '100%' }}>
                <Typography variant="h5" gutterBottom>All Submitted Grievances</Typography>
                <GrievanceTable grievances={grievances} />
            </Paper>
        </Container>
    );
};

export default AdminDashboard;