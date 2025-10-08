import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Paper, 
    List, 
    ListItem, 
    ListItemText, 
    Typography, 
    Divider, 
    Box, 
    CircularProgress, 
    Alert,
    Button,
    Chip
} from '@mui/material';

const AdminReviewPage = () => {
    const [pendingGrievances, setPendingGrievances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [token, setToken] = useState(null);

    // Fetch grievances that need review (i.e., not yet accepted)
    useEffect(() => {
        const fetchPendingGrievances = async () => {
            try {
                const storedToken = localStorage.getItem('accessToken');
                if (!storedToken) {
                    setError('You must be logged in to review grievances.');
                    setLoading(false);
                    return;
                }
                setToken(storedToken);

                const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
                const response = await axios.get(`${apiUrl}/api/grievances/`, {
                    headers: { 'Authorization': `Bearer ${storedToken}` }
                });
                
                // Filter for grievances that are NOT yet accepted to show them in the review list
                const grievancesToReview = response.data.filter(g => g.chat_status !== 'ACCEPTED');
                setPendingGrievances(grievancesToReview);

            } catch (err) {
                setError('Failed to fetch grievances for review.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchPendingGrievances();
    }, []);

    // Function to handle accepting a chat
    const handleAcceptChat = async (grievanceId) => {
        try {
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
            // This API endpoint would be responsible for changing the status on the backend.
            // It's a PATCH request because we are updating an existing resource.
            await axios.patch(`${apiUrl}/api/grievances/${grievanceId}/accept/`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // After successfully accepting, remove it from the list on the frontend
            setPendingGrievances(prevGrievances => 
                prevGrievances.filter(g => g.id !== grievanceId)
            );

        } catch (err) {
            setError(`Failed to accept grievance #${grievanceId}. Please try again.`);
            console.error(err);
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

    return (
        <Paper sx={{ margin: '20px', padding: '16px' }}>
            <Typography variant="h5" gutterBottom>Grievance Review Panel</Typography>
            <Divider sx={{ mb: 2 }} />
            
            {pendingGrievances.length > 0 ? (
                <List>
                    {pendingGrievances.map((grievance) => (
                        <React.Fragment key={grievance.id}>
                            <ListItem
                                secondaryAction={
                                    <Button 
                                        variant="contained" 
                                        color="primary"
                                        onClick={() => handleAcceptChat(grievance.id)}
                                    >
                                        Accept Chat
                                    </Button>
                                }
                            >
                                <ListItemText 
                                    primary={grievance.title} 
                                    secondary={`Submitted by: ${grievance.user.name} | Status: ${grievance.status}`} 
                                />
                                <Chip label={grievance.chat_status || 'PENDING'} color="warning" sx={{ mr: 4 }}/>
                            </ListItem>
                            <Divider />
                        </React.Fragment>
                    ))}
                </List>
            ) : (
                <Typography sx={{ p: 2, color: 'text.secondary' }}>
                    No pending grievances to review.
                </Typography>
            )}
        </Paper>
    );
};

export default AdminReviewPage;
