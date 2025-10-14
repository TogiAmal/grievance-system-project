import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Paper, Box, List, ListItem, ListItemText, Typography, Divider, CircularProgress, Alert, ListItemAvatar, Avatar } from '@mui/material';
import GrievanceChat from './GrievanceChat';

const InboxPage = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchConversations = async () => {
            // 1. Get the token from local storage.
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setError('Authentication error. Please log in again.');
                setLoading(false);
                return;
            }

            // 2. Prepare the authorization header.
            const headers = { 'Authorization': `Bearer ${token}` };
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

            try {
                // 3. Send the request with the headers.
                const response = await axios.get(`${apiUrl}/api/conversations/`, { headers });
                setConversations(response.data);
            } catch (err) {
                setError('Failed to fetch conversations. Your session may have expired.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchConversations();
    }, []);

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Paper sx={{ height: '80vh', display: 'flex', overflow: 'hidden', borderRadius: '4px' }}>
            <Box sx={{ 
                width: { xs: '100%', sm: '35%' }, 
                borderRight: { sm: '1px solid #ddd' },
                display: selectedConversation && { xs: 'none', sm: 'block' }
            }}>
                <Typography variant="h6" sx={{ p: 2, bgcolor: 'grey.100' }}>Chats</Typography>
                <Divider />
                <List sx={{ overflowY: 'auto', height: 'calc(100% - 60px)', p: 0 }}>
                    {conversations.length > 0 ? conversations.map((convo) => (
                        <ListItem 
                            button 
                            key={convo.id} 
                            onClick={() => setSelectedConversation(convo)}
                            sx={{
                                borderBottom: '1px solid #eee',
                                bgcolor: selectedConversation?.id === convo.id ? 'action.selected' : 'transparent'
                            }}
                        >
                            <ListItemAvatar>
                                <Avatar 
                                    alt={convo.user.name} 
                                    src={convo.user.profile_image ? `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${convo.user.profile_image}` : '/default-avatar.png'}
                                />
                            </ListItemAvatar>
                            <ListItemText primary={convo.user.name} secondary={convo.user.role} />
                        </ListItem>
                    )) : (
                        <ListItem>
                            <ListItemText primary="No active chats found." />
                        </ListItem>
                    )}
                </List>
            </Box>

            <Box sx={{ flexGrow: 1, display: !selectedConversation && { xs: 'none', sm: 'flex' } }}>
                {selectedConversation ? (
                    <GrievanceChat 
                        conversation={selectedConversation} 
                        onBack={() => setSelectedConversation(null)} 
                    />
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', bgcolor: 'grey.50' }}>
                        <Typography color="text.secondary">Select a conversation from the left to start chatting.</Typography>
                    </Box>
                )}
            </Box>
        </Paper>
    );
};

export default InboxPage;