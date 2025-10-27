import React, { useState, useEffect, useRef } from 'react';
// Removed unused imports: useCallback, useParams, Link, axios, Container, Button, List, ListItemAvatar, ListItemText, CircularProgress, Divider
import { Paper, Box, TextField, ListItem, Avatar, Typography, Alert, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Helper function to get full image URL (keep this)
const getFullUrl = (url) => {
    if (!url) return '';
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    return `${baseUrl}${url}`;
};

const GrievanceChat = ({ conversation, onBack }) => { // Accept conversation and onBack as props
    const [messages, setMessages] = useState(conversation ? conversation.messages || [] : []);
    const [input, setInput] = useState('');
    const chatSocket = useRef(null);
    const messagesEndRef = useRef(null);
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const conversationUser = conversation ? conversation.user : null;
    const conversationId = conversation ? conversation.id : null;
    const [wsError, setWsError] = useState(''); // Keep state for potential *other* errors

    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
    const token = localStorage.getItem('accessToken');

    // Scroll to bottom helper
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Setup WebSocket connection
    useEffect(() => {
        if (!token || !conversationId) {
            console.error("Token or Conversation ID missing for WebSocket.");
            // setWsError("Cannot establish chat connection."); // Keep error state for config issues
            return;
        }

        // --- Clear error state BEFORE connecting ---
        setWsError(''); // Clear previous errors

        const wsPath = `${wsUrl}/ws/chat/${conversationId}/?token=${token}`;
        console.log("Attempting to connect WebSocket:", wsPath);
        chatSocket.current = new WebSocket(wsPath);

        chatSocket.current.onopen = () => {
            console.log(`Chat WebSocket connected for conversation ${conversationId}`);
        };

        chatSocket.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('Chat message received:', data);
                if (data.type === 'chat_message' && data.payload) {
                    setMessages((prevMessages) => [...prevMessages, data.payload]);
                } else if (data.type === 'error') {
                    console.error("WebSocket error message:", data.message);
                    // Optionally display other types of errors if needed
                    // setWsError(`WebSocket error: ${data.message}`);
                } else {
                    console.warn("Received unknown WebSocket message type:", data.type);
                }
            } catch (e) {
                console.error("Failed to parse WebSocket message:", e);
                // setWsError("Received invalid message from server."); // Optionally show parsing errors
            }
        };

        chatSocket.current.onclose = (event) => {
            console.log(`Chat WebSocket disconnected: Code=${event.code}, Reason=${event.reason}`);
            // --- REMOVED setting error on abnormal close ---
            // if (event.code !== 1000) {
            //    console.warn("Chat connection closed unexpectedly.");
            //    setWsError("Chat connection closed unexpectedly."); // REMOVED THIS LINE
            // }
            // --- End Removal ---
        };

        chatSocket.current.onerror = (error) => {
            console.error('Chat WebSocket error:', error);
            // --- REMOVED setting error on generic WS error ---
            // setWsError("Chat connection failed."); // REMOVED THIS LINE
            // --- End Removal ---
        };

        return () => {
             if (chatSocket.current) {
                 console.log(`Closing WebSocket for conversation ${conversationId}`);
                 chatSocket.current.close();
             }
        };
    }, [conversationId, token, wsUrl]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle sending a message
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        if (chatSocket.current && chatSocket.current.readyState === WebSocket.OPEN) {
            const messageData = {
                type: 'chat_message',
                message: input.trim(),
            };
            try {
               chatSocket.current.send(JSON.stringify(messageData));
               setInput('');
               // --- Clear send-related errors on successful send attempt ---
               // setWsError(''); // Keep this if you want send errors cleared
            } catch (error) {
               console.error("Failed to send message via WebSocket:", error);
               setWsError("Failed to send message."); // Keep showing send errors
            }
        } else {
            console.error("Cannot send message: WebSocket is not open.");
            setWsError("Cannot send message. Connection not available."); // Keep showing send errors
        }
    };

    const handleInputChange = (e) => setInput(e.target.value);
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    // Render logic
    if (!conversation || !conversationUser) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', p: 2 }}>
                <Typography color="text.secondary">Select a conversation to view messages.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', bgcolor: 'grey.100' }}>
            {/* Chat Header */}
            <Paper sx={{ p: 1, display: 'flex', alignItems: 'center', borderBottom: '1px solid #ddd', flexShrink: 0 }} elevation={1}>
                {onBack && (
                     <IconButton onClick={onBack} sx={{ mr: 1 }} aria-label="Back to conversations">
                         <ArrowBackIcon />
                     </IconButton>
                )}
                 <Avatar
                     alt={conversationUser.name || '?'}
                     src={getFullUrl(conversationUser.profile_image)}
                     sx={{ mr: 1.5, width: 40, height: 40 }}
                 >
                    {!conversationUser.profile_image && (conversationUser.name || '?').charAt(0).toUpperCase()}
                 </Avatar>
                <Typography variant="h6" noWrap>{conversationUser.name || 'Unknown User'}</Typography>
            </Paper>

            {/* Message Area */}
            <Box sx={{
                 flexGrow: 1, overflowY: 'auto', p: 2,
                 backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                 backgroundSize: 'contain', backgroundRepeat: 'repeat'
                 }}>

                 {/* --- REMOVED the Alert displaying wsError for connection issues --- */}
                 {/* {wsError && <Alert severity="error" sx={{ mb: 1 }}>{wsError}</Alert>} */}
                 {/* You might keep it if you only want to show SEND errors */}
                 {wsError && wsError.startsWith("Failed to send") && <Alert severity="error" sx={{ mb: 1 }}>{wsError}</Alert>}
                 {wsError && wsError.startsWith("Cannot send") && <Alert severity="error" sx={{ mb: 1 }}>{wsError}</Alert>}
                 {/* --- End Removal --- */}

                {messages.map((msg, index) => {
                    if (!msg || !msg.user) return null;
                    const isCurrentUser = msg.user.id === currentUser?.id;
                    return (
                        <ListItem key={msg.id || index} sx={{
                            display: 'flex', justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                            mb: 1, p: 0, alignItems: 'flex-end'
                        }}>
                            <Paper sx={{
                                p: 1, py: 0.5, borderRadius: '10px', maxWidth: '75%',
                                bgcolor: isCurrentUser ? '#dcf8c6' : 'white',
                                boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
                                ml: isCurrentUser ? 'auto' : 0, mr: isCurrentUser ? 0 : 'auto',
                            }}>
                                {!isCurrentUser && (
                                     <Typography variant="caption" sx={{ color: 'primary.main', display: 'block', mb: 0.2, fontWeight: 'bold' }}>
                                         {msg.user.name || 'Unknown'}
                                     </Typography>
                                )}
                                <Typography variant="body2" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                                    {msg.message}
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', color: 'text.secondary', fontSize: '0.65rem', mt: 0.5 }}>
                                     {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                 </Typography>
                            </Paper>
                        </ListItem>
                    );
                })}
                <div ref={messagesEndRef} />
            </Box>

            {/* Input Area */}
            <Box component="form" onSubmit={handleSendMessage} sx={{ display: 'flex', p: 1, borderTop: '1px solid #ddd', bgcolor: 'grey.100', flexShrink: 0 }}>
                <TextField
                    fullWidth size="small" placeholder="Type a message..."
                    value={input} onChange={handleInputChange} onKeyPress={handleKeyPress}
                    sx={{ bgcolor: 'white', borderRadius: '20px', mr: 1, '& .MuiOutlinedInput-root': { borderRadius: '20px', '& fieldset': { borderColor: 'transparent', }, '&:hover fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)', }, '&.Mui-focused fieldset': { borderColor: 'primary.main', }, } }}
                    autoComplete="off" multiline maxRows={4}
                />
                <IconButton type="submit" color="primary" disabled={!input.trim()} aria-label="Send message">
                    <SendIcon />
                </IconButton>
            </Box>
        </Box>
    );
};

export default GrievanceChat;