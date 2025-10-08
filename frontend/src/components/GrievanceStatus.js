import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, Paper, List, ListItem, ListItemText, Divider, Button, CircularProgress, Alert } from '@mui/material';

const GrievanceStatus = () => {
    const [grievances, setGrievances] = useState([]);
    const [selectedGrievance, setSelectedGrievance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchGrievances = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setError('You must be logged in to view your grievances.');
                setLoading(false);
                return;
            }
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
            try {
                const response = await axios.get(`${apiUrl}/api/grievances/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setGrievances(response.data);
            } catch (err) {
                setError('Failed to fetch grievances.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchGrievances();
    }, []);

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    // If a grievance is selected, show the detail view
    if (selectedGrievance) {
        return (
            <Container maxWidth="md">
                <Button onClick={() => setSelectedGrievance(null)} sx={{ mb: 2 }}>
                    &larr; Back to List
                </Button>
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h4" gutterBottom>{selectedGrievance.title}</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}><strong>Status:</strong> {selectedGrievance.status}</Typography>
                    <Typography variant="body2" sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>{selectedGrievance.description}</Typography>
                </Paper>
            </Container>
        );
    }

    // Otherwise, show the list of grievances
    return (
        <Container maxWidth="md">
            <Typography variant="h4" gutterBottom>Your Submitted Grievances</Typography>
            <Paper>
                <List>
                    {grievances.length > 0 ? grievances.map((grievance, index) => (
                        <React.Fragment key={grievance.id}>
                            <ListItem button onClick={() => setSelectedGrievance(grievance)}>
                                <ListItemText 
                                    primary={grievance.title} 
                                    secondary={`Status: ${grievance.status} | Submitted: ${new Date(grievance.created_at).toLocaleDateString()}`} 
                                />
                            </ListItem>
                            {index < grievances.length - 1 && <Divider />}
                        </React.Fragment>
                    )) : (
                        <ListItem>
                            <ListItemText primary="You have not submitted any grievances yet." />
                        </ListItem>
                    )}
                </List>
            </Paper>
        </Container>
    );
};

export default GrievanceStatus;