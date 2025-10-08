import React, { useState } from 'react';
import axios from 'axios';
// 'Avatar' has been removed from this import line
import { Button, Container, Typography, Box } from '@mui/material';

const ProfilePage = () => {
    const [profileImage, setProfileImage] = useState(null);
    const userId = JSON.parse(localStorage.getItem('user'))?.id;

    const handleImageChange = (e) => {
        setProfileImage(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('accessToken');
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

        const formData = new FormData();
        formData.append('profile_image', profileImage);

        try {
            await axios.patch(`${apiUrl}/api/users/${userId}/`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            alert('Profile image updated successfully! Please log out and log in again to see the change.');
        } catch (error) {
            console.error('Failed to update profile image', error);
        }
    };

    return (
        <Container maxWidth="sm">
            <Typography variant="h4" gutterBottom>Your Profile</Typography>
            <Box component="form" onSubmit={handleSubmit}>
                <Button variant="contained" component="label">
                    Upload Profile Image
                    <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                </Button>
                {profileImage && <Typography sx={{ mt: 1, display: 'inline', ml: 2 }}>{profileImage.name}</Typography>}
                <Button type="submit" variant="contained" sx={{ mt: 2, display: 'block' }}>Save Changes</Button>
            </Box>
        </Container>
    );
};

export default ProfilePage;