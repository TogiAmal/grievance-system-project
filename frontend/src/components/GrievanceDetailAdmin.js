import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Container, Typography, Paper, Box, TextField, Button, Select, MenuItem, FormControl, InputLabel, List, ListItem, ListItemText, Divider } from '@mui/material';

const GrievanceDetailAdmin = () => {
    const { id } = useParams();
    const [grievance, setGrievance] = useState(null);
    const [comment, setComment] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        const fetchGrievance = async () => {
            const token = localStorage.getItem('accessToken');
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
            try {
                const res = await axios.get(`${apiUrl}/api/grievances/${id}/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setGrievance(res.data);
                setStatus(res.data.status);
            } catch (error) {
                console.error("Failed to fetch grievance", error);
            }
        };
        fetchGrievance();
    }, [id]);

    const handleUpdateStatus = async () => {
        const token = localStorage.getItem('accessToken');
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        try {
            await axios.patch(`${apiUrl}/api/grievances/${id}/update_status/`, { status }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert('Status updated!');
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('accessToken');
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        try {
            await axios.post(`${apiUrl}/api/grievances/${id}/add_comment/`, { comment_text: comment }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setComment('');
            // Refresh data after adding comment
            const res = await axios.get(`${apiUrl}/api/grievances/${id}/`, { headers: { 'Authorization': `Bearer ${token}` } });
            setGrievance(res.data);
        } catch (error) {
            console.error("Failed to add comment", error);
        }
    };

    if (!grievance) return <Typography>Loading...</Typography>;

    return (
        <Container maxWidth="md">
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h4" gutterBottom>{grievance.title}</Typography>
                <Typography variant="body1"><strong>Submitted by:</strong> {grievance.submitted_by.name}</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}><strong>Current Status:</strong> {grievance.status}</Typography>
                <Typography variant="body2" sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>{grievance.description}</Typography>
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" gutterBottom>Conversation History (Internal Comments)</Typography>
                <List>
                    {grievance.comments.map((c, index) => (
                        <React.Fragment key={c.id}>
                            <ListItem alignItems="flex-start">
                                <ListItemText
                                    primary={c.user.name}
                                    secondary={<>{c.comment_text} — {new Date(c.timestamp).toLocaleString()}</>}
                                />
                            </ListItem>
                            {index < grievance.comments.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </List>
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Box component="form" onSubmit={handleAddComment} sx={{ mb: 4 }}>
                    <Typography variant="h5" gutterBottom>Add an Internal Reply</Typography>
                    <TextField label="Your Reply" fullWidth multiline rows={4} value={comment} onChange={(e) => setComment(e.target.value)} required />
                    <Button type="submit" variant="contained" sx={{ mt: 2 }}>Post Reply</Button>
                </Box>
                
                <Box>
                    <Typography variant="h5" gutterBottom>Update Grievance Status</Typography>
                    <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
                            <MenuItem value={'SUBMITTED'}>Submitted</MenuItem>
                            <MenuItem value={'IN_REVIEW'}>In Review</MenuItem>
                            <MenuItem value={'ACTION_TAKEN'}>Action Taken</MenuItem>
                            <MenuItem value={'RESOLVED'}>Resolved</MenuItem>
                        </Select>
                    </FormControl>
                    <Button onClick={handleUpdateStatus} variant="contained" sx={{ mt: 2 }}>Update Status</Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default GrievanceDetailAdmin;