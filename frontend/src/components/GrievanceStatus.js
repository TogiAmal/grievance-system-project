// src/components/GrievanceStatus.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, Typography, Box, CircularProgress, Chip } from '@mui/material';

const GrievanceStatus = () => {
    const [grievances, setGrievances] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGrievances = async () => {
            const token = localStorage.getItem('accessToken');
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
        fetchGrievances();
    }, []);
    
    const getStatusColor = (status) => {
        switch (status) {
            case 'SUBMITTED': return 'primary';
            case 'IN_REVIEW': return 'warning';
            case 'ACTION_TAKEN': return 'info';
            case 'RESOLVED': return 'success';
            default: return 'default';
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return (
        <div>
            <Typography variant="h4" component="h1" gutterBottom>
                Your Grievance Status
            </Typography>
            {grievances.length === 0 ? (
                <Typography>You have no submitted grievances.</Typography>
            ) : (
                grievances.map(g => (
                    <Card key={g.id} sx={{ mb: 2 }} elevation={2}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6">{g.title}</Typography>
                                <Chip label={g.status} color={getStatusColor(g.status)} />
                            </Box>
                            <Typography variant="body2" sx={{ mt: 2 }}>{g.description}</Typography>
                            <Typography variant="caption" display="block" sx={{ mt: 2 }}>
                                Submitted on: {new Date(g.created_at).toLocaleDateString()}
                            </Typography>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );
};

export default GrievanceStatus;