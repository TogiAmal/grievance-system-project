// src/components/AdminChangePasswordPage.js
import React, { useState } from 'react';
import axios from 'axios';
import { Button, TextField, Container, Typography, Box, Paper, Alert, CircularProgress } from '@mui/material'; // Added CircularProgress

// --- Renamed Component ---
const AdminChangePasswordPage = () => {
    const [formData, setFormData] = useState({ old_password: '', new_password: '', confirm_new_password: '' }); // Added confirmation field
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); // Loading state

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        // --- Frontend Validation ---
        if (formData.new_password !== formData.confirm_new_password) {
            setError("New passwords do not match.");
            return;
        }
        if (formData.new_password.length < 8) {
            setError("New password must be at least 8 characters long.");
            return;
        }
        // --- End Validation ---

        setLoading(true); // Start loading

        const token = localStorage.getItem('accessToken');
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

        try {
            // Send only old and new password as expected by backend
            const payload = {
                 old_password: formData.old_password,
                 new_password: formData.new_password
            };
            // Use PUT as defined in the backend view (UpdateAPIView)
            const response = await axios.put(`${apiUrl}/api/change-password/`, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' // Ensure correct content type
                }
            });
            setMessage(response.data.message || 'Password updated successfully!'); // Use response message or default
            // Clear form on success
            setFormData({ old_password: '', new_password: '', confirm_new_password: '' });
        } catch (err) {
            console.error("Change Password Error:", err.response);
            // Handle different error structures from backend validation
            let errorMsg = 'An error occurred while updating the password.';
            if (err.response?.data) {
                if (err.response.data.old_password) {
                    errorMsg = `Current Password: ${err.response.data.old_password[0]}`;
                } else if (err.response.data.new_password) {
                    errorMsg = `New Password: ${err.response.data.new_password[0]}`;
                } else if (typeof err.response.data === 'string') {
                    errorMsg = err.response.data;
                } else if (err.response.data.detail) {
                     errorMsg = err.response.data.detail;
                }
            }
            setError(errorMsg);
        } finally {
            setLoading(false); // Stop loading
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ mt: 8 }}>
            <Paper elevation={6} sx={{ p: { xs: 2, sm: 3, md: 4 } }}> {/* Responsive padding */}
                {/* --- Updated Title --- */}
                <Typography component="h1" variant="h5" align="center" gutterBottom>
                    Admin: Change Password
                </Typography>
                {/* --- End Title Update --- */}

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    <TextField
                        label="Current Password"
                        type="password"
                        name="old_password" // Name attribute for handleChange
                        required
                        fullWidth
                        margin="normal"
                        value={formData.old_password} // Control component value
                        onChange={handleChange}
                        disabled={loading} // Disable while loading
                        autoComplete="current-password"
                    />
                    <TextField
                        label="New Password"
                        type="password"
                        name="new_password" // Name attribute for handleChange
                        required
                        fullWidth
                        margin="normal"
                        value={formData.new_password} // Control component value
                        onChange={handleChange}
                        helperText="Minimum 8 characters"
                        disabled={loading} // Disable while loading
                        autoComplete="new-password"
                    />
                     {/* --- Added Confirmation Field --- */}
                     <TextField
                        label="Confirm New Password"
                        type="password"
                        name="confirm_new_password" // Name attribute for handleChange
                        required
                        fullWidth
                        margin="normal"
                        value={formData.confirm_new_password} // Control component value
                        onChange={handleChange}
                        disabled={loading} // Disable while loading
                        autoComplete="new-password"
                     />
                     {/* --- End Confirmation Field --- */}

                    {/* Feedback Alerts */}
                    {message && <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>}
                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={loading} // Disable button while loading
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Update Password'}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

// --- Renamed Export ---
export default AdminChangePasswordPage;