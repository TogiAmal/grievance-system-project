// src/components/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, Typography, Grid, Select, MenuItem, CircularProgress, Box } from '@mui/material';

const AdminDashboard = () => {
    const [grievances, setGrievances] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('accessToken');

    const fetchAllGrievances = async () => {
        if (!token) { setLoading(false); return; }
        try {
            const response = await axios.get('http://127.0.0.1:8000/api/grievances/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGrievances(response.data);
        } catch (error) {
            console.error('Failed to fetch grievances:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllGrievances();
    }, [token]);

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await axios.patch(`http://127.0.0.1:8000/api/grievances/${id}/`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Refresh the list to show the change
            fetchAllGrievances(); 
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return (
        <div>
            <Typography variant="h4" component="h1" gutterBottom>
                Admin Grievance Management
            </Typography>
            <Grid container spacing={3}>
                {grievances.map(g => (
                    <Grid item xs={12} md={6} lg={4} key={g.id}>
                        <Card elevation={3}>
                            <CardContent>
                                <Typography variant="h6" component="div">{g.title}</Typography>
                                <Typography color="text.secondary" gutterBottom>
                                    Submitted by: {g.submitted_by.username} ({g.submitted_by.role})
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 2 }}>{g.description}</Typography>
                                <Typography variant="caption" display="block" sx={{ mt: 2 }}>
                                    Submitted on: {new Date(g.created_at).toLocaleDateString()}
                                </Typography>
                                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                                    <Typography sx={{ mr: 2 }}>Status:</Typography>
                                    <Select
                                        value={g.status}
                                        onChange={(e) => handleStatusUpdate(g.id, e.target.value)}
                                        size="small"
                                    >
                                        <MenuItem value="SUBMITTED">Submitted</MenuItem>
                                        <MenuItem value="IN_REVIEW">In Review</MenuItem>
                                        <MenuItem value="ACTION_TAKEN">Action Taken</MenuItem>
                                        <MenuItem value="RESOLVED">Resolved</MenuItem>
                                    </Select>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </div>
    );
};

export default AdminDashboard;