import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, Paper, Modal, Box, Select, MenuItem, Button, FormControl, InputLabel, IconButton, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const UserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newRole, setNewRole] = useState('');
    const [editModalOpen, setEditModalOpen] = useState(false);
    
    const [addUserModalOpen, setAddUserModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        name: '',
        admission_number: '',
        college_email: '',
        role: 'student',
        password: ''
    });

    const fetchUsers = async () => {
        const token = localStorage.getItem('accessToken');
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        try {
            const response = await axios.get(`${apiUrl}/api/users/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenEditModal = (user) => {
        setSelectedUser(user);
        setNewRole(user.role);
        setEditModalOpen(true);
    };

    const handleCloseEditModal = () => setEditModalOpen(false);

    // --- ADD THIS FUNCTION ---
    const handleAddUserModalClose = () => {
        setAddUserModalOpen(false);
        // Reset form when modal is closed
        setNewUser({ name: '', admission_number: '', college_email: '', role: 'student', password: '' });
    };
    // -------------------------

    const handleRoleChange = async () => {
        if (!selectedUser) return;
        const token = localStorage.getItem('accessToken');
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        try {
            await axios.patch(`${apiUrl}/api/users/${selectedUser.id}/change_role/`, { role: newRole }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchUsers();
            handleCloseEditModal();
        } catch (error) {
            console.error("Failed to change role", error);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            const token = localStorage.getItem('accessToken');
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
            try {
                await axios.delete(`${apiUrl}/api/users/${userId}/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                fetchUsers();
            } catch (error) {
                console.error("Failed to delete user", error);
            }
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('accessToken');
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        try {
            await axios.post(`${apiUrl}/api/users/`, newUser, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchUsers();
            handleAddUserModalClose();
        } catch (error) {
            console.error("Failed to add user", error);
            if (error.response && error.response.data) {
                const errorData = error.response.data;
                const errorMessages = Object.entries(errorData).map(([key, value]) => `${key}: ${value.join(', ')}`).join('\n');
                alert(`Failed to add user:\n${errorMessages}`);
            } else {
                alert('Failed to add user. An unknown error occurred.');
            }
        }
    };
    
    const columns = [
        { field: 'id', headerName: 'ID', width: 90 },
        { field: 'name', headerName: 'Name', flex: 1 },
        { field: 'username', headerName: 'Admission No / Username', flex: 1 },
        { field: 'role', headerName: 'Role', width: 150 },
        {
            field: 'actions',
            headerName: 'Actions',
            sortable: false,
            width: 200,
            renderCell: (params) => (
                <Box>
                    <Button variant="contained" size="small" onClick={() => handleOpenEditModal(params.row)} sx={{ mr: 1 }}>
                        Edit Role
                    </Button>
                    <IconButton color="error" onClick={() => handleDeleteUser(params.row.id)}>
                        <DeleteIcon />
                    </IconButton>
                </Box>
            ),
        },
    ];

    return (
        <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" gutterBottom>User Management</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddUserModalOpen(true)}>
                    Add New User
                </Button>
            </Box>
            <Paper sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={users}
                    columns={columns}
                    loading={loading}
                    pageSizeOptions={[10, 25]}
                />
            </Paper>

            {/* Modal for Editing Role */}
            <Modal open={editModalOpen} onClose={handleCloseEditModal}>
                <Box sx={style}>
                    <Typography variant="h6" component="h2">Change Role for {selectedUser?.name}</Typography>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Role</InputLabel>
                        <Select value={newRole} label="Role" onChange={(e) => setNewRole(e.target.value)}>
                            <MenuItem value="student">Student</MenuItem>
                            <MenuItem value="teacher">Teacher</MenuItem>
                            <MenuItem value="staff">Non-Teaching Staff</MenuItem>
                            <MenuItem value="grievance_cell">Grievance Cell</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                        </Select>
                    </FormControl>
                    <Button onClick={handleRoleChange} variant="contained" sx={{ mt: 2 }}>Save Changes</Button>
                </Box>
            </Modal>

            {/* Modal for Adding a New User */}
            <Modal open={addUserModalOpen} onClose={handleAddUserModalClose}>
                <Box sx={style}>
                    <Typography variant="h6" component="h2">Create a New User</Typography>
                    <Box component="form" onSubmit={handleAddUser}>
                        <TextField fullWidth margin="normal" label="Full Name" name="name" onChange={(e) => setNewUser({...newUser, name: e.target.value})} required />
                        <TextField fullWidth margin="normal" label="Admission / Employee ID" name="admission_number" onChange={(e) => setNewUser({...newUser, admission_number: e.target.value})} required />
                        <TextField fullWidth margin="normal" label="College Email" name="college_email" type="email" onChange={(e) => setNewUser({...newUser, college_email: e.target.value})} required />
                        <TextField fullWidth margin="normal" label="Initial Password" name="password" type="password" onChange={(e) => setNewUser({...newUser, password: e.target.value})} required />
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Role</InputLabel>
                            <Select name="role" value={newUser.role} label="Role" onChange={(e) => setNewUser({...newUser, role: e.target.value})}>
                                <MenuItem value="student">Student</MenuItem>
                                <MenuItem value="teacher">Teacher</MenuItem>
                                <MenuItem value="staff">Non-Teaching Staff</MenuItem>
                                <MenuItem value="grievance_cell">Grievance Cell</MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                            </Select>
                        </FormControl>
                        <Button type="submit" variant="contained" sx={{ mt: 2 }}>Create User</Button>
                    </Box>
                </Box>
            </Modal>
        </Container>
    );
};

export default UserManagementPage;