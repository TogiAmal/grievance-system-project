import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, TextField, IconButton, Typography, List, ListItem, ListItemText, Avatar, ListItemAvatar } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const GrievanceChat = ({ grievanceId, initialMessages }) => {
    const [messages, setMessages] = useState(initialMessages || []);
    const [input, setInput] = useState('');
    const chatSocket = useRef(null);
    const messagesEndRef = useRef(null);
    
    // Get user details from localStorage to identify self-messages
    const currentUserId = localStorage.getItem('userId'); // You need to save userId to localStorage on login
    const currentUserName = localStorage.getItem('userName');

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const wsHost = process.env.REACT_APP_API_URL ? new URL(process.env.REACT_APP_API_URL).host : 'localhost:8000';
        
        const wsUrl = `${protocol}://${wsHost}/ws/chat/${grievanceId}/?token=${token}`;
        
        chatSocket.current = new WebSocket(wsUrl);

        chatSocket.current.onmessage = (e) => {
            const data = JSON.parse(e.data);
            setMessages(prev => [...prev, { user: { id: data.user_id, name: data.username }, message: data.message }]);
        };

        chatSocket.current.onclose = (e) => {
            console.error('Chat socket closed.');
        };

        return () => {
            if (chatSocket.current) {
                chatSocket.current.close();
            }
        };
    }, [grievanceId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (input.trim() && chatSocket.current.readyState === WebSocket.OPEN) {
            chatSocket.current.send(JSON.stringify({
                'message': input
            }));
            setInput('');
        }
    };

    return (
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '60vh' }}>
            <Typography variant="h6" gutterBottom>Live Chat</Typography>
            <List sx={{ flexGrow: 1, overflow: 'auto', bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                {messages.map((msg, index) => (
                    <ListItem 
                        key={index} 
                        sx={{ 
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: msg.user.id == currentUserId ? 'flex-end' : 'flex-start' 
                        }}
                    >
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{msg.user.name}</Typography>
                        <Box sx={{ 
                            bgcolor: msg.user.id == currentUserId ? 'primary.main' : 'background.paper',
                            color: msg.user.id == currentUserId ? 'white' : 'black',
                            p: 1.5, borderRadius: 2, maxWidth: '70%',
                            boxShadow: 1
                        }}>
                           <ListItemText primary={msg.message} sx={{ wordBreak: 'break-word' }} />
                        </Box>
                    </ListItem>
                ))}
                <div ref={messagesEndRef} />
            </List>
            <Box component="form" onSubmit={handleSendMessage} sx={{ display: 'flex', mt: 1 }}>
                <TextField fullWidth size="small" placeholder="Type your message..." value={input} onChange={e => setInput(e.target.value)} />
                <IconButton type="submit" color="primary"><SendIcon /></IconButton>
            </Box>
        </Paper>
    );
};

export default GrievanceChat;