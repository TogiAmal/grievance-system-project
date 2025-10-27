import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Container, Typography, Paper, Box, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Avatar, IconButton, Button, TextField, Snackbar // Add Button, TextField, Snackbar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'; // For image upload trigger

const AdminCellMembersPage = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingMemberId, setEditingMemberId] = useState(null); // Track which member is being edited
    const [editFormData, setEditFormData] = useState({}); // Store changes for the member being edited
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [actionLoading, setActionLoading] = useState(false); // Loading for save/upload actions

    const fileInputRef = useRef(null); // Ref for hidden file input
    const [uploadingImageForUser, setUploadingImageForUser] = useState(null); // Track image upload target


    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    const token = localStorage.getItem('accessToken');

    // --- Helper to get full image URL ---
    const getFullUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
        return `${baseUrl}${url}`;
    };

    // --- Fetch Members ---
    const fetchMembers = async () => {
        setLoading(true); // Indicate loading when fetching/refreshing
        setError('');
        if (!token) {
            setError('Authentication required.');
            setLoading(false);
            return;
        }
        try {
            // Fetch ONLY grievance_cell members using the new endpoint or filter if needed
            const response = await axios.get(`${apiUrl}/api/users/grievance-cell-members/`, {
                // No token needed if endpoint is AllowAny, but good practice to send if available
                 headers: { Authorization: `Bearer ${token}` },
            });
            // Filter again client-side just to be sure (if backend endpoint wasn't specific)
            // setMembers(response.data.filter(user => user.role === 'grievance_cell'));
            setMembers(response.data); // Assuming backend endpoint returns only cell members
        } catch (err) {
            console.error("Error fetching cell members:", err);
            setError(`Failed to fetch members. ${err.response?.data?.detail || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Edit Handlers ---
    const handleEditClick = (member) => {
        setEditingMemberId(member.id);
        // Pre-fill form data with current member details
        setEditFormData({
            name: member.name || '',
            designation: member.designation || '',
            phone_number: member.phone_number || ''
        });
    };

    const handleCancelEdit = () => {
        setEditingMemberId(null);
        setEditFormData({});
    };

    const handleEditFormChange = (e) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };

    const handleSaveEdit = async (memberId) => {
        setActionLoading(true);
        try {
            // Send only changed data using PATCH
            await axios.patch(`${apiUrl}/api/users/${memberId}/`, editFormData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            setSnackbarMessage('Member details updated successfully!');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            setEditingMemberId(null); // Exit edit mode
            await fetchMembers(); // Refresh list
        } catch (err) {
            console.error("Error updating member:", err);
            const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : 'Failed to update details.';
            setSnackbarMessage(`Error: ${errorMsg}`);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            // Keep edit mode open on error
        } finally {
            setActionLoading(false);
        }
    };

    // --- Image Upload Handlers ---
     const handleImageUploadClick = (userId) => {
        setUploadingImageForUser(userId);
        fileInputRef.current.click(); // Trigger hidden file input
    };

     const handleFileSelected = async (event) => {
        const file = event.target.files[0];
        const userId = uploadingImageForUser; // Get the user ID we stored
        if (file && userId) {
            setActionLoading(true); // Use general action loading
            const formData = new FormData();
            formData.append('profile_image', file);
            try {
                // Use the same PATCH endpoint, sending only the image
                await axios.patch(`${apiUrl}/api/users/${userId}/`, formData, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data', // Important for files
                    },
                });
                setSnackbarMessage('Profile image updated!');
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
                await fetchMembers(); // Refresh list to show new image
            } catch (err) {
                 console.error("Error updating profile image:", err);
                 const errorMsg = err.response?.data?.profile_image ? err.response.data.profile_image[0]
                                : err.response?.data?.detail || 'Failed to update image.';
                 setSnackbarMessage(`Error: ${errorMsg}`);
                 setSnackbarSeverity('error');
                 setSnackbarOpen(true);
            } finally {
                setActionLoading(false);
                 setUploadingImageForUser(null); // Reset target user
                if(fileInputRef.current) fileInputRef.current.value = ''; // Reset file input
            }
        } else {
             setUploadingImageForUser(null); // Reset if no file or user
        }
    };


    // --- Snackbar Close Handler ---
    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbarOpen(false);
    };

    // --- Render Logic ---
    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
    if (error) return <Container><Alert severity="error" sx={{ mt: 4 }}>{error}</Alert></Container>;

    return (
        <Container maxWidth="lg">
             {/* Hidden File Input for uploads */}
             <input
                 type="file"
                 ref={fileInputRef}
                 onChange={handleFileSelected}
                 style={{ display: 'none' }}
                 accept="image/*"
             />

            <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, boxShadow: 3, mt: 4 }}>
                <Typography variant="h4" gutterBottom align="center" sx={{ mb: 3 }}>
                    Manage Grievance Cell Members
                </Typography>
                {members.length === 0 ? (
                    <Alert severity="info">No users found with the 'grievance_cell' role.</Alert>
                ) : (
                    <TableContainer>
                        <Table sx={{ minWidth: 750 }} size="small">
                            <TableHead>
                                <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
                                    <TableCell>Avatar</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Designation</TableCell>
                                    <TableCell>Phone Number</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {members.map((member) => (
                                    <TableRow hover key={member.id}>
                                        <TableCell sx={{ p: 1 }}>
                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1}}>
                                                <Avatar
                                                    src={getFullUrl(member.profile_image)}
                                                    sx={{ width: 40, height: 40 }}
                                                 >
                                                    {!member.profile_image && (member.name || '?').charAt(0).toUpperCase()}
                                                 </Avatar>
                                                 {/* Button to trigger image upload */}
                                                 <IconButton
                                                    size="small"
                                                    onClick={() => handleImageUploadClick(member.id)}
                                                    disabled={actionLoading || editingMemberId === member.id} // Disable while editing/uploading
                                                    color="secondary"
                                                    title="Change Profile Image"
                                                >
                                                    <PhotoCameraIcon fontSize="small"/>
                                                 </IconButton>
                                             </Box>
                                        </TableCell>
                                        <TableCell sx={{ p: 1 }}>
                                            {editingMemberId === member.id ? (
                                                <TextField
                                                    size="small" name="name" variant="outlined"
                                                    value={editFormData.name} onChange={handleEditFormChange}
                                                />
                                            ) : (
                                                member.name || member.username
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ p: 1 }}>
                                             {editingMemberId === member.id ? (
                                                <TextField
                                                    size="small" name="designation" variant="outlined"
                                                    value={editFormData.designation} onChange={handleEditFormChange}
                                                />
                                            ) : (
                                                member.designation || '-'
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ p: 1 }}>
                                            {editingMemberId === member.id ? (
                                                <TextField
                                                    size="small" name="phone_number" variant="outlined"
                                                    value={editFormData.phone_number} onChange={handleEditFormChange}
                                                />
                                            ) : (
                                                member.phone_number || '-'
                                            )}
                                        </TableCell>
                                         <TableCell sx={{ p: 1 }}>{member.college_email || '-'}</TableCell>
                                        <TableCell align="center" sx={{ p: 1 }}>
                                            {editingMemberId === member.id ? (
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <IconButton size="small" color="primary" onClick={() => handleSaveEdit(member.id)} disabled={actionLoading}>
                                                         {actionLoading ? <CircularProgress size={20}/> : <SaveIcon fontSize="small"/>}
                                                    </IconButton>
                                                    <IconButton size="small" onClick={handleCancelEdit} disabled={actionLoading}>
                                                        <CancelIcon fontSize="small"/>
                                                    </IconButton>
                                                </Box>
                                            ) : (
                                                <IconButton size="small" color="primary" onClick={() => handleEditClick(member)} disabled={actionLoading}>
                                                    <EditIcon fontSize="small"/>
                                                </IconButton>
                                            )}
                                            {/* Add Role Change button here if needed, linking to UserManagementPage logic */}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Snackbar for feedback */}
            <Snackbar
                open={snackbarOpen} autoHideDuration={4000} onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }} variant="filled">
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default AdminCellMembersPage;