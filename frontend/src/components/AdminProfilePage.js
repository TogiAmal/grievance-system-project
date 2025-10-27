import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Container, Typography, Box, Paper, Alert, Avatar, CircularProgress } from '@mui/material';

// --- RENAMED COMPONENT ---
const AdminProfilePage = () => {
  const [profileImage, setProfileImage] = useState(null); // File object for upload
  const [previewUrl, setPreviewUrl] = useState(''); // URL for image preview
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Loading state for the submit action
  const [user, setUser] = useState(null); // Initialize as null

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  const token = localStorage.getItem('accessToken'); // Get token for requests

  // --- Fetch User Data (same as ProfilePage, uses /me/) ---
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setError("Authentication required.");
        return;
      }
      try {
        const response = await axios.get(`${apiUrl}/api/users/me/`, { // Fetches the logged-in user's data
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
        if (response.data.profile_image) {
            setPreviewUrl(getFullUrl(response.data.profile_image));
        }
      } catch (err) {
        console.error("Failed to fetch user profile", err);
        setError("Failed to load profile data.");
      }
    };
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl, token]); // Dependencies

  // Generate full image URL helper (same as ProfilePage)
  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    return `${baseUrl}${url}`;
  };


  // Show live preview (same as ProfilePage)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setMessage('');
      setError('');
    }
  };

  // Upload new profile image (same as ProfilePage, uses /me/update/)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (!profileImage) {
      setError('Please select an image to upload.');
      return;
    }
    if (!token) {
        setError('Authentication error. Please log in again.');
        return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('profile_image', profileImage);

    try {
      const response = await axios.patch(
        `${apiUrl}/api/users/me/update/`, // Correct endpoint for updating own profile
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data)); // Update local storage if needed
      setMessage('Profile image updated successfully!');
      setProfileImage(null);
      setPreviewUrl(getFullUrl(response.data.profile_image)); // Update preview with saved image URL
      window.dispatchEvent(new CustomEvent('profileUpdated', { detail: response.data })); // Notify layout
    } catch (err) {
      console.error("Error updating profile image:", err);
      const errorMsg = err.response?.data?.profile_image ? err.response.data.profile_image[0]
                     : err.response?.data?.detail || 'Failed to update profile image. Please ensure it is a valid image file and try again.';
      setError(errorMsg);
    } finally {
        setLoading(false);
    }
  };

  // Loading state (same as ProfilePage)
   if (user === null && !error) {
     return (
       <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
         <CircularProgress />
       </Container>
     );
   }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 2, boxShadow: 3 }}>
        {/* --- UPDATED TITLE --- */}
        <Typography variant="h4" gutterBottom align="center">
          Admin Profile
        </Typography>
        {/* --- END TITLE UPDATE --- */}


        {/* Image Preview (same as ProfilePage) */}
        <Box display="flex" justifyContent="center" mb={3}>
          <Avatar
            src={previewUrl || getFullUrl(user?.profile_image)}
            alt={user?.name || user?.username || 'User'}
            sx={{ width: 120, height: 120, border: '3px solid', borderColor: 'primary.main' }}
          >
           {!previewUrl && !user?.profile_image && (user?.name || user?.username || '?').charAt(0).toUpperCase()}
          </Avatar>
        </Box>

        {/* User Details (same as ProfilePage) */}
        <Typography variant="h6" align="center">{user?.name || '(No Name Provided)'}</Typography>
        <Typography variant="body1" align="center" color="text.secondary" gutterBottom>
          {user?.username} ({user?.role?.replace('_', ' ') || 'Role Unknown'})
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
           {user?.college_email}
         </Typography>

        {/* Form (same as ProfilePage) */}
        <Box component="form" onSubmit={handleSubmit} textAlign="center">
          <Button variant="outlined" component="label" disabled={loading}>
            {profileImage ? 'Change Image' : 'Upload New Profile Image'}
            <input type="file" hidden accept="image/*" onChange={handleImageChange} />
          </Button>

          {profileImage && (
            <Typography sx={{ mt: 1, mb: 2, display: 'block', color: 'text.secondary', fontStyle: 'italic' }}>
              Selected: {profileImage.name}
            </Typography>
          )}

          {message && <Alert severity="success" sx={{ mt: 2, mb: 2 }}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mt: 2, mb: 2 }}>{error}</Alert>}

          {profileImage && (
             <Button
               type="submit"
               variant="contained"
               color="primary"
               disabled={loading}
               sx={{ mt: 2, display: 'block', mx: 'auto' }}
             >
               {loading ? <CircularProgress size={24} color="inherit"/> : 'Save Changes'}
             </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

// --- RENAMED EXPORT ---
export default AdminProfilePage;