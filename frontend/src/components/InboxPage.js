import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import GrievanceChat from './GrievanceChat';

const InboxPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  const token = localStorage.getItem('accessToken');

  // Helper: Get full URL
  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    return `${base}${url}`;
  };

  useEffect(() => {
    const fetchConversations = async () => {
      if (!token) {
        setError('Authentication error. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${apiUrl}/api/conversations/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setConversations(res.data);
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError('Failed to fetch conversations.');
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, [apiUrl, token]);

  const handleConversationClick = (convo) => {
    setSelectedConversation(convo);
  };

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );

  return (
    <Paper
      sx={{
        height: 'calc(100vh - 112px)',
        display: 'flex',
        overflow: 'hidden',
        borderRadius: '4px',
        mt: 2,
        boxShadow: 3,
      }}
    >
      {/* Left panel: conversation list */}
      <Box
        sx={{
          width: { xs: '100%', sm: '35%' },
          borderRight: { sm: '1px solid #ddd' },
          display: selectedConversation ? { xs: 'none', sm: 'flex' } : 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography variant="h6" sx={{ p: 2, bgcolor: 'grey.100', borderBottom: '1px solid #ddd' }}>
          Chats
        </Typography>

        <List sx={{ overflowY: 'auto', flexGrow: 1, p: 0 }}>
          {conversations.length > 0 ? (
            conversations.map((convo) => (
              <ListItem
                component={ListItemButton}
                key={convo.id}
                onClick={() => handleConversationClick(convo)}
                selected={selectedConversation?.id === convo.id}
                sx={{ borderBottom: '1px solid #eee' }}
              >
                <ListItemAvatar>
                  <Avatar
                    alt={convo.user.name || '?'}
                    src={getFullUrl(convo.user.profile_image)}
                  >
                    {!convo.user.profile_image &&
                      (convo.user.name || '?').charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={convo.user.name || 'Unknown User'}
                  secondary={convo.user.role?.replace('_', ' ') || 'User'}
                  primaryTypographyProps={{ noWrap: true }}
                  secondaryTypographyProps={{ noWrap: true }}
                />
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText
                primary="No active chats found."
                sx={{ textAlign: 'center', color: 'text.secondary', mt: 4 }}
              />
            </ListItem>
          )}
        </List>
      </Box>

      {/* Right panel: chat */}
      <Box
        sx={{
          flexGrow: 1,
          display: !selectedConversation ? { xs: 'none', sm: 'flex' } : 'flex',
          flexDirection: 'column',
        }}
      >
        {selectedConversation ? (
          <GrievanceChat
            key={selectedConversation.id}
            conversation={selectedConversation}
            onBack={() => setSelectedConversation(null)}
          />
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              bgcolor: 'grey.50',
            }}
          >
            <Typography color="text.secondary">
              Select a conversation to start chatting.
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default InboxPage;
