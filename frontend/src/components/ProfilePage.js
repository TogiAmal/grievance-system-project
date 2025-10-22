import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Container, Typography, Box, Paper, Alert, Avatar } from '@mui/material';

const ProfilePage = () => {
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  // ✅ Generate full image URL
  const getFullUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${apiUrl}${url}`;
  };

  // ✅ Show live preview when a new image is selected
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setProfileImage(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // ✅ Upload new profile image
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!profileImage) {
      setError('Please select an image to upload.');
      return;
    }

    const token = localStorage.getItem('accessToken');
    const formData = new FormData();
    formData.append('profile_image', profileImage);

    try {
      const response = await axios.patch(
        `${apiUrl}/api/users/${user.id}/`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // ✅ Update user in localStorage and refresh UI
      localStorage.setItem('user', JSON.stringify(response.data));
      setUser(response.data);
      setMessage('Profile image updated successfully!');
      setProfileImage(null);
      setPreviewUrl('');

      // ✅ Notify Navbar (or any other listener)
      window.dispatchEvent(new CustomEvent('profileUpdated'));
    } catch (err) {
      console.error(err);
      setError('Failed to update profile image. Please try again.');
    }
  };

  // ✅ Update user state if profile was updated elsewhere
  useEffect(() => {
    const handleProfileUpdated = () => {
      const updatedUser = JSON.parse(localStorage.getItem('user'));
      setUser(updatedUser);
    };
    window.addEventListener('profileUpdated', handleProfileUpdated);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdated);
  }, []);

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom align="center">
          Your Profile
        </Typography>

        {/* ✅ Current or new profile image preview */}
        <Box display="flex" justifyContent="center" mb={2}>
          <Avatar
            src={previewUrl || getFullUrl(user?.profile_image)}
            alt={user?.name || 'User'}
            sx={{
              width: 120,
              height: 120,
              border: '3px solid #1976d2',
            }}
          />
        </Box>

        <Box component="form" onSubmit={handleSubmit} textAlign="center">
          <Button variant="contained" component="label">
            Upload New Profile Image
            <input type="file" hidden accept="image/*" onChange={handleImageChange} />
          </Button>

          {profileImage && (
            <Typography
              sx={{ mt: 1, display: 'block', color: 'text.secondary' }}
            >
              Selected: {profileImage.name}
            </Typography>
          )}

          {message && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {message}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mt: 3, display: 'block', mx: 'auto' }}
          >
            Save Changes
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ProfilePage;
