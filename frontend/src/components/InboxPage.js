import React, { useState, useEffect } from 'react';
import axios from 'axios';
// 'Grid' has been removed from this import line
import { Paper, List, ListItem, ListItemText, Typography, Divider, Box, CircularProgress, Alert } from '@mui/material';
import GrievanceChat from './GrievanceChat';

const InboxPage = () => {
    const [grievances, setGrievances] = useState([]);
    const [selectedGrievance, setSelectedGrievance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchGrievances = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setError('You must be logged in to view messages.');
                setLoading(false);
                return;
            }
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
            try {
                const response = await axios.get(`${apiUrl}/api/grievances/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setGrievances(response.data.filter(g => g.chat_status === 'ACCEPTED'));
            } catch (err) {
                setError('Failed to fetch conversations.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchGrievances();
    }, []);

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Paper sx={{ height: '80vh', display: 'flex' }}>
            <Box sx={{ width: '35%', borderRight: '1px solid #ddd' }}>
                <Typography variant="h6" sx={{ p: 2 }}>Conversations</Typography>
                <Divider />
                <List sx={{ overflowY: 'auto' }}>
                    {grievances.length > 0 ? grievances.map((grievance) => (
                        <ListItem button key={grievance.id} onClick={() => setSelectedGrievance(grievance)} selected={selectedGrievance?.id === grievance.id}>
                            <ListItemText primary={grievance.title} secondary={`ID: ${grievance.id} - Status: ${grievance.status}`} />
                        </ListItem>
                    )) : (
                        <ListItem>
                            <ListItemText primary="No active chats found." />
                        </ListItem>
                    )}
                </List>
            </Box>

            <Box sx={{ flexGrow: 1, p: 2 }}>
                {selectedGrievance ? (
                    <GrievanceChat 
                        grievanceId={selectedGrievance.id} 
                        initialMessages={selectedGrievance.chat_messages} 
                    />
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                        <Typography color="text.secondary">Select a conversation to start chatting</Typography>
                    </Box>
                )}
            </Box>
        </Paper>
    );
};

export default InboxPage;