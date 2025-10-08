import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, TextField, Container, Typography, Box, Paper, Alert } from '@mui/material';

const PasswordResetConfirmPage = () => {
    const { uidb64, token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== password2) {
            setError('Passwords do not match.');
            return;
        }
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        try {
            const response = await axios.post(`${apiUrl}/api/password-reset-confirm/${uidb64}/${token}/`, { password });
            setMessage(response.data.message);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password. The link may be invalid or expired.');
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ mt: 8 }}>
            <Paper elevation={6} sx={{ p: 4 }}>
                <Typography component="h1" variant="h5">Set New Password</Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    <TextField label="New Password" type="password" required fullWidth margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <TextField label="Confirm New Password" type="password" required fullWidth margin="normal" value={password2} onChange={(e) => setPassword2(e.target.value)} />
                    {message && <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>}
                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>Reset Password</Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default PasswordResetConfirmPage;