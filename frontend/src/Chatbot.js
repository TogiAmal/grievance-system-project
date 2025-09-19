// src/components/Chatbot.js
import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, Button, Fab, TextField } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';

// Simple styling for the chatbot
const styles = {
    fab: {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1000,
    },
    chatWindow: {
        position: 'fixed',
        bottom: '100px',
        right: '24px',
        width: '350px',
        height: '500px',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #ddd',
        borderRadius: '8px',
        zIndex: 1000,
        backgroundColor: 'white',
    },
    header: {
        padding: '16px',
        backgroundColor: '#1976d2', // A nice blue header
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    messageContainer: {
        flexGrow: 1,
        padding: '16px',
        overflowY: 'auto',
    },
    botMessage: {
        backgroundColor: '#f1f1f1',
        padding: '8px 12px',
        borderRadius: '16px',
        marginBottom: '8px',
        maxWidth: '80%',
        alignSelf: 'flex-start',
    },
    userMessage: {
        backgroundColor: '#1976d2',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '16px',
        marginBottom: '8px',
        maxWidth: '80%',
        alignSelf: 'flex-end',
    },
    optionsContainer: {
        padding: '8px',
        borderTop: '1px solid #ddd',
        textAlign: 'center',
    }
};

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const chatEndRef = useRef(null);

    // This effect runs when the chat window is opened
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            // Initial messages from the bot
            setTimeout(() => {
                setMessages([
                    { sender: 'bot', text: 'Hi there!' },
                    { sender: 'bot', text: 'I am your grievance assistant. How can I help you today?' }
                ]);
            }, 500);
        }
    }, [isOpen]); // Dependency on isOpen

    // Automatically scroll to the latest message
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleUserResponse = (response) => {
        // Add user's message to the chat
        const newMessages = [...messages, { sender: 'user', text: response }];
        
        // Add bot's next message based on user response
        if (response === 'File a new grievance') {
            setTimeout(() => {
                setMessages([...newMessages, { sender: 'bot', text: 'Okay, please go to your dashboard to submit a detailed grievance form.' }]);
            }, 1000);
        } else if (response === 'Check grievance status') {
            setTimeout(() => {
                setMessages([...newMessages, { sender: 'bot', text: 'You can check the status of all your grievances on the "Grievance Status" page.' }]);
            }, 1000);
        }
    };

    const toggleChat = () => setIsOpen(!isOpen);

    return (
        <>
            <Fab color="primary" sx={styles.fab} onClick={toggleChat}>
                {isOpen ? <CloseIcon /> : <ChatIcon />}
            </Fab>

            {isOpen && (
                <Paper elevation={8} sx={styles.chatWindow}>
                    <Box sx={styles.header}>
                        <Typography variant="h6">Grievance Assistant</Typography>
                    </Box>

                    <Box sx={styles.messageContainer}>
                        {messages.map((msg, index) => (
                            <Box key={index} sx={msg.sender === 'bot' ? styles.botMessage : styles.userMessage}>
                                <Typography variant="body2">{msg.text}</Typography>
                            </Box>
                        ))}
                        <div ref={chatEndRef} />
                    </Box>

                    <Box sx={styles.optionsContainer}>
                        <Button variant="outlined" sx={{ m: 0.5 }} onClick={() => handleUserResponse('File a new grievance')}>
                            File a new grievance
                        </Button>
                        <Button variant="outlined" sx={{ m: 0.5 }} onClick={() => handleUserResponse('Check grievance status')}>
                            Check grievance status
                        </Button>
                    </Box>
                </Paper>
            )}
        </>
    );
};

export default Chatbot;