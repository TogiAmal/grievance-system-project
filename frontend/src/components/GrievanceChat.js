import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, TextField, IconButton, Typography, useMediaQuery, useTheme, Avatar } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const GrievanceChat = ({ conversation, onBack }) => {
    // All hooks must be called at the top level, before any returns.
    const [messages, setMessages] = useState(conversation ? conversation.messages || [] : []);
    const [input, setInput] = useState('');
    const chatSocket = useRef(null);
    const messagesEndRef = useRef(null);
    const currentUser = JSON.parse(localStorage.getItem('user'));
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        // Don't try to connect if there's no conversation object
        if (!conversation) return;

        const token = localStorage.getItem('accessToken');
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        let wsHost = process.env.REACT_APP_API_URL ? new URL(process.env.REACT_APP_API_URL).host : 'localhost:8000';
        const wsUrl = `${protocol}://${wsHost}/ws/chat/${conversation.id}/?token=${token}`;
        
        chatSocket.current = new WebSocket(wsUrl);

        chatSocket.current.onmessage = (e) => {
            const data = JSON.parse(e.data);
            setMessages(prev => [...prev, { user: data.user, message: data.message }]);
        };

        chatSocket.current.onclose = () => {
            console.error('Chat socket closed');
        };
        
        // Cleanup function to close the socket when the component unmounts
        return () => {
            if (chatSocket.current) {
                chatSocket.current.close();
            }
        };
    }, [conversation]); // Rerun the effect if the conversation object changes

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (input.trim() && chatSocket.current && chatSocket.current.readyState === WebSocket.OPEN) {
            chatSocket.current.send(JSON.stringify({ 'message': input }));
            setInput('');
        }
    };

    // The safety check is now here, after all hooks have been called.
    if (!conversation) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                <Typography color="error">Could not load conversation.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
            {/* Chat Header */}
            <Paper sx={{ p: 1, display: 'flex', alignItems: 'center', borderBottom: '1px solid #ddd' }} elevation={2}>
                {isMobile && <IconButton onClick={onBack} sx={{ mr: 1 }}><ArrowBackIcon /></IconButton>}
                <Avatar 
                    alt={conversation.user.name} 
                    src={conversation.user.profile_image ? `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${conversation.user.profile_image}` : '/default-avatar.png'}
                    sx={{ mr: 2 }} 
                />
                <Typography variant="h6">{conversation.user.name}</Typography>
            </Paper>

            {/* Message Area */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}>
                {messages.map((msg, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: msg.user.id === currentUser.id ? 'flex-end' : 'flex-start', mb: 2 }}>
                        <Paper sx={{ 
                            bgcolor: msg.user.id === currentUser.id ? '#dcf8c6' : 'white',
                            p: 1.5, borderRadius: '10px', maxWidth: '70%',
                            boxShadow: 1
                        }}>
                           <Typography variant="caption" sx={{ color: msg.user.id === currentUser.id ? 'text.secondary' : 'primary.main', display: 'block', mb: 0.5, fontWeight: 'bold' }}>{msg.user.name}</Typography>
                           <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{msg.message}</Typography>
                        </Paper>
                    </Box>
                ))}
                <div ref={messagesEndRef} />
            </Box>

            {/* Input Area */}
            <Box component="form" onSubmit={handleSendMessage} sx={{ display: 'flex', p: 1, borderTop: '1px solid #ddd', bgcolor: 'grey.200' }}>
                <TextField 
                    fullWidth 
                    size="small" 
                    placeholder="Type a message..." 
                    value={input} 
                    onChange={e => setInput(e.target.value)} 
                    sx={{ bgcolor: 'white', borderRadius: '20px', '& .MuiOutlinedInput-root': {'& fieldset': { borderRadius: '20px' }} }}
                />
                <IconButton type="submit" color="primary"><SendIcon /></IconButton>
            </Box>
        </Box>
    );
};

export default GrievanceChat;