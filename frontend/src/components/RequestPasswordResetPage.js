import React, { useState } from 'react';
import axios from 'axios';
import { Button, TextField, Container, Typography, Box, Paper, Alert } from '@mui/material';

const RequestPasswordResetPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        try {
            const response = await axios.post(`${apiUrl}/api/password-reset/`, { email });
            setMessage(response.data.message);
        } catch (error) {
            setMessage('An error occurred. Please try again.');
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ mt: 8 }}>
            <Paper elevation={6} sx={{ p: 4 }}>
                <Typography component="h1" variant="h5">Reset Password</Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    <TextField label="Enter your email address" type="email" required fullWidth margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} />
                    {message && <Alert severity="info" sx={{ mt: 2 }}>{message}</Alert>}
                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>Send Reset Link</Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default RequestPasswordResetPage;