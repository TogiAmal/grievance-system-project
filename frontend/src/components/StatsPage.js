// src/components/StatsPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, Grid, Paper, Box } from '@mui/material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const StatsPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setError('You must be logged in to view statistics.');
                setLoading(false);
                return;
            }
            
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

            try {
                const response = await axios.get(`${apiUrl}/api/grievances/stats/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setStats(response.data);
            } catch (err) {
                setError('Failed to fetch statistics.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <Typography>Loading statistics...</Typography>;
    if (error) return <Typography color="error">{error}</Typography>;

    const chartData = {
        labels: ['Pending', 'Resolved'],
        datasets: [
            {
                label: 'Grievances',
                data: [stats?.pending_grievances || 0, stats?.resolved_grievances || 0],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)', // Red for Pending
                    'rgba(54, 162, 235, 0.7)', // Blue for Resolved
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    return (
        <Container maxWidth="lg">
            <Typography variant="h4" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
                Grievance Statistics
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 5 }} justifyContent="center">
                <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }} elevation={3}>
                        <Typography variant="h6">Total</Typography>
                        <Typography variant="h3">{stats?.total_grievances}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }} elevation={3}>
                        <Typography variant="h6">Pending</Typography>
                        <Typography variant="h3" color="error">{stats?.pending_grievances}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }} elevation={3}>
                        <Typography variant="h6">Resolved</Typography>
                        <Typography variant="h3" color="primary">{stats?.resolved_grievances}</Typography>
                    </Paper>
                </Grid>
            </Grid>

            <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center' }} elevation={3}>
                <Box sx={{ width: '100%', maxWidth: '400px' }}>
                     <Typography variant="h5" textAlign="center" gutterBottom>Status Overview</Typography>
                    <Pie data={chartData} />
                </Box>
            </Paper>
        </Container>
    );
};

export default StatsPage;