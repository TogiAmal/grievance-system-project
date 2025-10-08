// src/components/Chatbot.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Box, Paper, Typography, Fab, TextField, IconButton, useTheme, useMediaQuery, Avatar } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat'; // Corrected Import
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';

// ... (styles and all other functions remain the same)

const styles = {
    fab: { position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 },
    chatWindow: { position: 'fixed', bottom: '100px', right: '24px', width: '350px', height: '500px', display: 'flex', flexDirection: 'column', borderRadius: '8px', zIndex: 1000, backgroundColor: 'white', transition: 'all 0.3s ease-in-out', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' },
    header: { padding: '16px', backgroundColor: '#1976d2', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    messageContainer: { flexGrow: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column' },
    botMessage: { backgroundColor: '#f1f1f1', padding: '8px 12px', borderRadius: '16px', maxWidth: '80%' },
    userMessage: { backgroundColor: '#1976d2', color: 'white', padding: '8px 12px', borderRadius: '16px', maxWidth: '80%' },
    inputArea: { display: 'flex', padding: '8px', borderTop: '1px solid #ddd' },
    typingIndicator: { fontStyle: 'italic', color: '#999', padding: '8px 12px', alignSelf: 'flex-start' },
};


const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [conversationMode, setConversationMode] = useState('idle');
    const [newGrievance, setNewGrievance] = useState({ title: '', description: '' });
    const chatEndRef = useRef(null);

    const userName = localStorage.getItem('userName');
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    const addMessage = (sender, text) => {
        setMessages(prev => [...prev, { sender, text }]);
    };

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            addMessage('bot', `Hi, ${userName || 'there'}! I am your grievance assistant. You can ask to "file a grievance" or "check status".`);
        }
    }, [isOpen, userName, messages.length]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        const userMessage = inputValue.trim();
        if (!userMessage) return;
        
        addMessage('user', userMessage);
        setInputValue('');
        setIsTyping(true);

        setTimeout(() => {
            processUserMessage(userMessage);
        }, 1200);
    };

    const processUserMessage = (message) => {
        setIsTyping(false);
        const lowerCaseMessage = message.toLowerCase();

        if (conversationMode === 'collecting_title') {
            setNewGrievance({ ...newGrievance, title: message });
            addMessage('bot', 'Thank you. Now, please provide a detailed description of your grievance.');
            setConversationMode('collecting_description');
            return;
        }

        if (conversationMode === 'collecting_description') {
            const grievanceData = { ...newGrievance, description: message };
            addMessage('bot', 'Thank you for the details. Submitting your grievance now...');
            submitGrievance(grievanceData);
            return;
        }
        
        if (lowerCaseMessage.includes('hello') || lowerCaseMessage.includes('hi')) {
            addMessage('bot', `Hello, ${userName || 'there'}! How can I assist you?`);
        } else if (lowerCaseMessage.includes('new') || lowerCaseMessage.includes('file') || lowerCaseMessage.includes('submit')) {
            addMessage('bot', 'Okay, let\'s file a new grievance. What is the title or subject of your issue?');
            setConversationMode('collecting_title');
        } else if (lowerCaseMessage.includes('status') || lowerCaseMessage.includes('check')) {
            addMessage('bot', 'You can check your grievance status on the "Grievance Status" page.');
        } else {
            addMessage('bot', "Sorry, I can only help with filing a new grievance or checking the status.");
        }
    };

    const submitGrievance = async (grievanceData) => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            addMessage('bot', 'Error: You must be logged in to submit a grievance.');
            setConversationMode('idle');
            return;
        }
        
        try {
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
            await axios.post(`${apiUrl}/api/grievances/`, grievanceData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            addMessage('bot', 'Your grievance has been submitted successfully!');
        } catch (error) {
            addMessage('bot', 'Sorry, there was an error submitting your grievance. Please try again later.');
        } finally {
            setConversationMode('idle');
            setNewGrievance({ title: '', description: '' });
        }
    };

    const chatWindowStyle = {
        ...styles.chatWindow,
        ...(isMobile && {
            width: '100%',
            height: '100%',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            borderRadius: 0,
        })
    };

    return (
        <>
            <Fab color="primary" sx={styles.fab} onClick={() => setIsOpen(!isOpen)}>
                {/* CORRECTED: Use ChatIcon instead of ChatbotIcon */}
                {isOpen ? <CloseIcon /> : <ChatIcon />}
            </Fab>

            {isOpen && (
                <Paper elevation={isMobile ? 0 : 8} sx={chatWindowStyle}>
                    <Box sx={styles.header}>
                        <Typography variant="h6">Grievance Assistant</Typography>
                         <IconButton color="inherit" onClick={() => setIsOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Box sx={styles.messageContainer}>
                        {messages.map((msg, index) => (
                            <Box 
                                key={index} 
                                sx={{ 
                                    display: 'flex', 
                                    justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                    mb: 1,
                                    alignItems: 'flex-end',
                                }}
                            >
                                {msg.sender === 'bot' && (
                                    <Avatar src="/images/bot.png" sx={{ width: 32, height: 32, mr: 1 }} />
                                )}
                                <Paper sx={msg.sender === 'bot' ? styles.botMessage : styles.userMessage}>
                                    <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{msg.text}</Typography>
                                </Paper>
                            </Box>
                        ))}
                        {isTyping && <Typography sx={styles.typingIndicator}>Assistant is typing...</Typography>}
                        <div ref={chatEndRef} />
                    </Box>
                    <Box component="form" sx={styles.inputArea} onSubmit={handleSendMessage}>
                        <TextField
                            fullWidth variant="outlined" size="small"
                            placeholder="Type a message..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                        <IconButton type="submit" color="primary">
                            <SendIcon />
                        </IconButton>
                    </Box>
                </Paper>
            )}
        </>
    );
};

export default Chatbot;