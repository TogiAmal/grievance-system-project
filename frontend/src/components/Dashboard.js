// src/components/Dashboard.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Paper, TextField, Button, Stack, Alert } from '@mui/material';

const Dashboard = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Get the auth token from localStorage to make an authenticated request
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('Authentication error. Please log in again.');
            return;
        }

        try {
            // Send the new grievance to the backend
            await axios.post('http://127.0.0.1:8000/api/grievances/', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setSuccess('Grievance submitted successfully! You will be redirected to the status page.');
            setFormData({ title: '', description: '' }); // Clear the form after submission

            // Redirect to the status page after a short delay
            setTimeout(() => {
                navigate('/status');
            }, 2000);

        } catch (err) {
            setError('Failed to submit grievance. Please ensure all fields are filled correctly.');
            console.error(err);
        }
    };

    return (
        <Container component="main" maxWidth="md">
            <Stack spacing={4}>
                {/* Welcome Section */}
                <Box sx={{ textAlign: 'center' }}>
                    <Typography component="h1" variant="h4" gutterBottom>
                        Welcome to Your Dashboard
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                        Submit a new grievance using the form below or check the status of existing ones in the navigation bar.
                    </Typography>
                </Box>

                {/* Grievance Submission Form */}
                <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
                    <Typography component="h2" variant="h5" sx={{ mb: 2 }}>
                        Submit a New Grievance
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            label="Grievance Title / Subject"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            fullWidth
                            required
                            margin="normal"
                        />
                        <TextField
                            label="Detailed Description of the Grievance"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            fullWidth
                            required
                            multiline
                            rows={6}
                            margin="normal"
                        />
                        
                        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}

                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            sx={{ mt: 3, py: 1.5 }}
                        >
                            Submit Grievance
                        </Button>
                    </Box>
                </Paper>
            </Stack>
        </Container>
    );
};

export default Dashboard;