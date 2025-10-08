import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, Paper, Modal, Box, Select, MenuItem, Button, FormControl, InputLabel, IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';

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
    const [modalOpen, setModalOpen] = useState(false);

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

    const handleOpenModal = (user) => {
        setSelectedUser(user);
        setNewRole(user.role);
        setModalOpen(true);
    };

    const handleCloseModal = () => setModalOpen(false);

    const handleRoleChange = async () => {
        if (!selectedUser) return;
        const token = localStorage.getItem('accessToken');
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        try {
            await axios.patch(`${apiUrl}/api/users/${selectedUser.id}/change_role/`, { role: newRole }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchUsers();
            handleCloseModal();
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
                fetchUsers(); // Refresh the list after deletion
            } catch (error) {
                console.error("Failed to delete user", error);
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
            width: 150,
            renderCell: (params) => (
                <Box>
                    <Button variant="contained" size="small" onClick={() => handleOpenModal(params.row)} sx={{ mr: 1 }}>
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
            <Typography variant="h4" gutterBottom>User Management</Typography>
            <Paper sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={users}
                    columns={columns}
                    loading={loading}
                    pageSizeOptions={[10, 25]}
                />
            </Paper>
            <Modal open={modalOpen} onClose={handleCloseModal}>
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
        </Container>
    );
};

export default UserManagementPage;