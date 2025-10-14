// src/components/ChangePasswordPage.js
import React, { useState } from 'react';
import axios from 'axios';
import { Button, TextField, Container, Typography, Box, Paper, Alert } from '@mui/material';

const ChangePasswordPage = () => {
    const [formData, setFormData] = useState({ old_password: '', new_password: '' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        const token = localStorage.getItem('accessToken');
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        try {
            const response = await axios.put(`${apiUrl}/api/change-password/`, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMessage(response.data.message);
        } catch (err) {
            setError(err.response?.data?.old_password?.[0] || 'An error occurred.');
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ mt: 8 }}>
            <Paper elevation={6} sx={{ p: 4 }}>
                <Typography component="h1" variant="h5">Change Password</Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    <TextField label="Current Password" type="password" name="old_password" required fullWidth margin="normal" onChange={(e) => setFormData({...formData, old_password: e.target.value})} />
                    <TextField label="New Password (min. 8 characters)" type="password" name="new_password" required fullWidth margin="normal" onChange={(e) => setFormData({...formData, new_password: e.target.value})} />
                    {message && <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>}
                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>Update Password</Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default ChangePasswordPage;