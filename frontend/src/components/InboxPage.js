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
    Avatar,
    TextField,
    IconButton
} from '@mui/material';
import { Send as SendIcon, MoreVert as MoreVertIcon, Search as SearchIcon } from '@mui/icons-material';

// --- This is the new, more functional GrievanceChat component ---
const GrievanceChat = ({ grievance, token }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    // This effect will run when the selected grievance changes.
    useEffect(() => {
        // Set the initial messages from the grievance prop when the component loads.
        setMessages(grievance.chat_messages || []);

        // --- WebSocket Connection for Live Chat ---
        // In a real application, you would establish a WebSocket connection here.
        // The URL would look something like: `ws://localhost:8000/ws/chat/${grievance.id}/?token=${token}`
        
        // This is a simulation to demonstrate live message updates.
        const interval = setInterval(() => {
            const simulatedReply = {
                id: Date.now(),
                sender: { name: grievance.user.name }, // Simulating a reply from the user
                text: "This is an automated live reply.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prevMessages => [...prevMessages, simulatedReply]);
        }, 15000); // Add a new message every 15 seconds

        // Cleanup function to close the connection when the component unmounts
        return () => {
            clearInterval(interval);
            // In a real app: socket.close();
        };

    }, [grievance, token]);

    const handleSendMessage = () => {
        if (newMessage.trim() === '') return;

        const messageToSend = {
            id: Date.now(),
            sender: { name: 'Admin' }, // Assuming the person using this UI is an admin
            text: newMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        // In a real app, you would send this message over the WebSocket connection:
        // socket.send(JSON.stringify({ message: newMessage }));

        setMessages([...messages, messageToSend]);
        setNewMessage('');
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Chat Messages Area */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
                {messages.map((msg, index) => (
                    <Box 
                        key={index}
                        sx={{
                            display: 'flex',
                            justifyContent: msg.sender.name === 'Admin' ? 'flex-end' : 'flex-start',
                            mb: 1
                        }}
                    >
                        <Paper
                            elevation={1}
                            sx={{
                                p: '8px 12px',
                                borderRadius: '10px',
                                maxWidth: '70%',
                                backgroundColor: msg.sender.name === 'Admin' ? '#dcf8c6' : '#fff',
                            }}
                        >
                            <Typography variant="body2">{msg.text}</Typography>
                            <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', color: 'text.secondary', mt: 0.5 }}>
                                {msg.timestamp}
                            </Typography>
                        </Paper>
                    </Box>
                ))}
            </Box>
            
            {/* Message Input Field */}
            <Box sx={{ p: '10px 16px', backgroundColor: '#f0f2f5', display: 'flex', alignItems: 'center', borderTop: '1px solid #ddd' }}>
                <TextField 
                    fullWidth
                    variant="outlined"
                    placeholder="Type a message"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '20px',
                            backgroundColor: '#fff',
                        }
                    }}
                />
                <IconButton color="primary" sx={{ ml: 1 }} onClick={handleSendMessage}>
                    <SendIcon />
                </IconButton>
            </Box>
        </Box>
    );
};
// --- End of GrievanceChat component ---


const InboxPage = () => {
    const [grievances, setGrievances] = useState([]);
    const [selectedGrievance, setSelectedGrievance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [token, setToken] = useState(null);

    useEffect(() => {
        const fetchGrievances = async () => {
            try {
                const storedToken = localStorage.getItem('accessToken');
                if (!storedToken) {
                    setError('You must be logged in to view messages.');
                    setLoading(false);
                    return;
                }
                setToken(storedToken);

                const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
                const response = await axios.get(`${apiUrl}/api/grievances/`, {
                    headers: { 'Authorization': `Bearer ${storedToken}` }
                });
                
                // IMPORTANT: Ensure your API response provides data in this structure.
                // It must include `user` and `lastMessage` objects for the UI to work.
                const acceptedGrievances = response.data.filter(g => g.chat_status === 'ACCEPTED');
                setGrievances(acceptedGrievances);

            } catch (err) {
                // If API fails, we show an error. For development, you could fallback to mock data here.
                setError('Failed to fetch conversations. Please try again later.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchGrievances();
    }, []);
    
    // Filter conversations based on search term
    const filteredGrievances = grievances.filter(g => 
        g.user && g.user.name && g.user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

    return (
        <Paper sx={{ height: 'calc(100vh - 40px)', display: 'flex', margin: '20px', backgroundColor: '#f0f2f5', boxShadow: 'lg' }}>
            
            {/* Left Panel: Conversations List */}
            <Box sx={{ width: '35%', minWidth: '300px', borderRight: '1px solid #ddd', display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
                {/* Conversations Header */}
                <Box sx={{ p: '10px 16px', display: 'flex', alignItems: 'center', backgroundColor: '#f0f2f5', borderBottom: '1px solid #ddd' }}>
                    <Avatar sx={{ width: 40, height: 40 }} />
                    <Typography variant="h6" sx={{ ml: 2, flexGrow: 1 }}>Chats</Typography>
                </Box>
                 {/* Search Bar */}
                 <Box sx={{ p: '8px 16px', backgroundColor: '#f6f6f6', borderBottom: '1px solid #ddd' }}>
                     <TextField
                         fullWidth
                         variant="outlined"
                         placeholder="Search or start new chat"
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         InputProps={{
                             startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                             sx: { borderRadius: '20px', backgroundColor: '#fff', fontSize: '0.9rem', height: '40px' }
                         }}
                     />
                 </Box>

                {/* Conversation Items */}
                <List sx={{ overflowY: 'auto', flexGrow: 1, p: 0 }}>
                    {filteredGrievances.length > 0 ? filteredGrievances.map((grievance) => (
                        <React.Fragment key={grievance.id}>
                            <ListItem 
                                button 
                                onClick={() => setSelectedGrievance(grievance)} 
                                selected={selectedGrievance?.id === grievance.id}
                                sx={{ p: '12px 16px' }}
                            >
                                <Avatar src={grievance.user.profilePicUrl} sx={{ mr: 2 }}>
                                    {grievance.user.profilePicUrl ? null : grievance.user.name.charAt(0)}
                                </Avatar>
                                <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="subtitle1" noWrap>{grievance.user.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">{grievance.lastMessage.timestamp}</Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" noWrap>
                                        {grievance.lastMessage.text}
                                    </Typography>
                                </Box>
                            </ListItem>
                            <Divider variant="inset" component="li" />
                        </React.Fragment>
                    )) : (
                        <ListItem>
                            <ListItemText primary="No active chats found." />
                        </ListItem>
                    )}
                </List>
            </Box>

            {/* Right Panel: Chat Window */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', background: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}>
                {selectedGrievance ? (
                    <>
                        {/* Chat Header */}
                        <Box sx={{ p: '10px 16px', display: 'flex', alignItems: 'center', backgroundColor: '#f0f2f5', borderBottom: '1px solid #ddd' }}>
                            <Avatar src={selectedGrievance.user.profilePicUrl} sx={{ mr: 2 }}>
                                {selectedGrievance.user.profilePicUrl ? null : selectedGrievance.user.name.charAt(0)}
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle1">{selectedGrievance.user.name}</Typography>
                                <Typography variant="caption" color="text.secondary">Grievance: {selectedGrievance.title}</Typography>
                            </Box>
                            <Box sx={{ flexGrow: 1 }} />
                            <IconButton><MoreVertIcon /></IconButton>
                        </Box>

                        {/* Live Chat Component */}
                        <GrievanceChat 
                            grievance={selectedGrievance} 
                            token={token} 
                        />
                    </>
                ) : (
                    // Placeholder when no chat is selected
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', color: 'text.secondary', backgroundColor: '#f8f9fa' }}>
                        <Typography variant="h5" gutterBottom>Grievance Chat System</Typography>
                        <Typography>Select a conversation from the left to start chatting.</Typography>
                    </Box>
                )}
            </Box>
        </Paper>
    );
};

export default InboxPage;

