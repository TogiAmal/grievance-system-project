// src/components/VerifyEmail.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { Container, Typography, Box, Paper, Button, CircularProgress, Alert } from '@mui/material';

const VerifyEmail = () => {
    // Get uid and token from the URL
    const { uidb64, token } = useParams();

    // State to manage loading and messages
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const verifyUserEmail = async () => {
            setIsLoading(true);
            setError('');
            setMessage('');
            try {
                // Make the API call to your Django backend
                const response = await axios.get(`http://127.0.0.1:8000/api/verify-email/${uidb64}/${token}/`);
                setMessage(response.data.message || 'Your account has been successfully verified!');
            } catch (err) {
                setError(err.response?.data?.error || 'Verification failed. The link may be invalid or expired.');
            } finally {
                setIsLoading(false);
            }
        };

        // Call the function when the component loads
        verifyUserEmail();
    }, [uidb64, token]); // Effect runs when uidb64 or token changes

    return (
        <Container component="main" maxWidth="sm" sx={{ mt: 8 }}>
            <Paper elevation={6} sx={{ padding: 4, textAlign: 'center' }}>
                <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
                    Account Verification
                </Typography>
                <Box sx={{ mt: 3 }}>
                    {isLoading ? (
                        <>
                            <CircularProgress sx={{ mb: 2 }} />
                            <Typography>Verifying your account, please wait...</Typography>
                        </>
                    ) : (
                        <>
                            {message && <Alert severity="success">{message}</Alert>}
                            {error && <Alert severity="error">{error}</Alert>}
                            <Button
                                component={Link}
                                to="/login"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2, py: 1.5 }}
                            >
                                Proceed to Login
                            </Button>
                        </>
                    )}
                </Box>
            </Paper>
        </Container>
    );
};

export default VerifyEmail;