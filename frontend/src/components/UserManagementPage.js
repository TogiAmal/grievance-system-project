import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Container,
    Typography,
    Paper,
    Box,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Avatar,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    Snackbar, // For feedback
    Button,   // Added Button import
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add'; // Import Add icon
import AddUserModal from './AddUserModal'; // Import the modal component

const UserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true); // Loading for initial fetch
    const [error, setError] = useState('');
    const [editingUserId, setEditingUserId] = useState(null);
    const [selectedRole, setSelectedRole] = useState('');
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [actionLoading, setActionLoading] = useState(false); // Loading for actions (save role)
    const [actionError, setActionError] = useState('');   // Error specific to actions
    const [isAddModalOpen, setIsAddModalOpen] = useState(false); // State for Add User modal

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    const token = localStorage.getItem('accessToken');

    // Function to fetch users
    const fetchUsers = async () => {
        // Don't set main loading to true here, only on initial mount
        setError(''); // Clear previous errors on refetch
        if (!token) {
            setError('Authentication required.');
            setLoading(false); // Ensure initial loading stops
            return;
        }
        try {
            const response = await axios.get(`${apiUrl}/api/users/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(response.data);
        } catch (err) {
            console.error("Error fetching users:", err);
            // Check if the error is 403 Forbidden
            if (err.response?.status === 403) {
                 setError(`Permission Denied: ${err.response?.data?.detail || 'You do not have permission to view users.'}`);
            } else {
                 setError(`Failed to fetch users. ${err.response?.data?.detail || err.message}`);
            }
        } finally {
            // Only set initial loading to false
            if (loading) setLoading(false);
        }
    };

    // Fetch users on component mount
    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty array ensures this runs only once initially

    // Handle starting the edit mode for a user's role
    const handleEditRole = (user) => {
        setEditingUserId(user.id);
        setSelectedRole(user.role);
        setActionError(''); // Clear action errors when starting edit
    };

    // Handle canceling the edit mode
    const handleCancelEdit = () => {
        setEditingUserId(null);
        setActionError('');
    };


    // Handle saving the role change
    const handleSaveRole = async (userId) => {
        setActionError('');
        if (!selectedRole) {
            setActionError('Please select a role.'); // Show error locally
            return;
        }
        setActionLoading(true);

        try {
            await axios.patch(
                `${apiUrl}/api/users/${userId}/change_role/`,
                { role: selectedRole },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSnackbarMessage('Role updated successfully!');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            setEditingUserId(null); // Exit edit mode
            await fetchUsers(); // Refresh the user list
        } catch (err) {
            console.error("Error updating role:", err);
            const errorMessage = err.response?.data?.error || err.response?.data?.detail || 'Failed to update role.';
            // Use snackbar for feedback instead of actionError state
            setSnackbarMessage(`Error: ${errorMessage}`);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            // Keep editing mode open on error to allow correction
        } finally {
            setActionLoading(false);
        }
    };

    // Modal Handlers
    const handleOpenAddModal = () => setIsAddModalOpen(true);
    const handleCloseAddModal = () => setIsAddModalOpen(false);

    // Callback for when a user is successfully added via the modal
    const handleUserAdded = () => {
        fetchUsers(); // Re-fetch the user list
        setSnackbarMessage('User added successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
    };

    // Handle closing the snackbar
    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    // Initial loading state
    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                <CircularProgress />
            </Container>
        );
    }

    // Display error if fetching failed initially
    if (error && users.length === 0) { // Only show full page error if list is empty
        return (
            <Container>
                <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            {/* Title and Add Button */}
             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, mt: 4 }}>
                <Typography variant="h4" component="h1">
                    User Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddModal}
                >
                    Add New User
                </Button>
            </Box>

            {/* Display general fetch error here if list might still be partially shown */}
             {error && users.length > 0 && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}


            <Paper sx={{ p: { xs: 1, sm: 2, md: 3 }, borderRadius: 2, boxShadow: 3 }}>
                {users.length === 0 && !loading ? ( // Check loading state here too
                    <Alert severity="info">No users found.</Alert>
                ) : (
                    <TableContainer>
                        <Table sx={{ minWidth: 650 }} aria-label="user table" size="small">
                            <TableHead>
                                <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
                                    <TableCell>Avatar</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Username / ID</TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow
                                        key={user.id}
                                        hover // Add hover effect
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell sx={{ p: 1}}> {/* Reduced padding */}
                                            <Avatar src={user.profile_image || undefined} sx={{ width: 32, height: 32 }}>
                                                {!user.profile_image ? user.name?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() : null}
                                            </Avatar>
                                        </TableCell>
                                        <TableCell component="th" scope="row" sx={{ p: 1}}>
                                            {user.name || '(No Name Provided)'}
                                        </TableCell>
                                        <TableCell sx={{ p: 1}}>{user.username}</TableCell>
                                        <TableCell sx={{ textTransform: 'capitalize', p: 1 }}>
                                            {editingUserId === user.id ? (
                                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                                    <Select
                                                        value={selectedRole}
                                                        onChange={(e) => setSelectedRole(e.target.value)}
                                                        displayEmpty
                                                        autoFocus // Focus the select when edit starts
                                                    >
                                                        {/* Ensure these values match backend ROLE_CHOICES */}
                                                        <MenuItem value="student">Student</MenuItem>
                                                        <MenuItem value="teacher">Teacher</MenuItem>
                                                        <MenuItem value="staff">Non-Teaching Staff</MenuItem>
                                                        <MenuItem value="grievance_cell">Grievance Cell</MenuItem>
                                                        <MenuItem value="admin">Admin</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            ) : (
                                                user.role?.replace('_', ' ') || 'N/A'
                                            )}
                                        </TableCell>
                                        <TableCell align="center" sx={{ p: 1}}>
                                            {editingUserId === user.id ? (
                                                 <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="primary"
                                                        onClick={() => handleSaveRole(user.id)}
                                                        disabled={actionLoading}
                                                    >
                                                        {actionLoading ? <CircularProgress size={20} color="inherit"/> : 'Save'}
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={handleCancelEdit} // Use cancel handler
                                                        disabled={actionLoading}
                                                     >
                                                         Cancel
                                                     </Button>
                                                 </Box>

                                            ) : (
                                                <IconButton
                                                    aria-label="edit role"
                                                    onClick={() => handleEditRole(user)}
                                                    color="primary"
                                                    disabled={actionLoading} // Disable edit if another action is in progress
                                                    size="small"
                                                >
                                                    <EditIcon fontSize='small'/>
                                                </IconButton>
                                            )}
                                            {/* Add Delete Button/Logic Here if needed */}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
                 {/* Display action-specific errors below table */}
                 {actionError && editingUserId && <Alert severity="error" sx={{ mt: 2 }}>{actionError}</Alert>}
            </Paper>

            {/* Add User Modal */}
            <AddUserModal
                open={isAddModalOpen}
                handleClose={handleCloseAddModal}
                onUserAdded={handleUserAdded}
            />

             {/* Snackbar for feedback */}
             <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }} variant="filled">
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default UserManagementPage;