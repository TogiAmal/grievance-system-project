import React, { useState } from 'react';
import axios from 'axios';
import { Button, Container, Typography, Box, Paper, Alert } from '@mui/material';

const ProfilePage = () => {
    const [profileImage, setProfileImage] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const user = JSON.parse(localStorage.getItem('user'));

    const handleImageChange = (e) => {
        setProfileImage(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        if (!profileImage) { setError('Please select an image to upload.'); return; }

        const token = localStorage.getItem('accessToken');
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        const formData = new FormData();
        formData.append('profile_image', profileImage);

        try {
            const response = await axios.patch(`${apiUrl}/api/users/${user.id}/`, formData, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
            });
            localStorage.setItem('user', JSON.stringify(response.data));
            window.dispatchEvent(new CustomEvent('profileUpdated'));
            setMessage('Profile image updated successfully!');
            setProfileImage(null);
        } catch (err) { setError('Failed to update profile image. Please try again.'); }
    };

    return (
        <Container maxWidth="sm">
            <Paper sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="h4" gutterBottom>Your Profile</Typography>
                <Box component="form" onSubmit={handleSubmit}>
                    <Button variant="contained" component="label">
                        Upload New Profile Image
                        <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                    </Button>
                    {profileImage && <Typography sx={{ mt: 1, display: 'inline', ml: 2, color: 'text.secondary' }}>{profileImage.name}</Typography>}
                    {message && <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>}
                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                    <Button type="submit" variant="contained" sx={{ mt: 2, display: 'block' }}>Save Changes</Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default ProfilePage;