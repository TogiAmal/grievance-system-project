import React, { useState } from 'react';
import axios from 'axios';
import {
    Modal, Box, Typography, TextField, Button, Select, MenuItem,
    FormControl, InputLabel, CircularProgress, Alert
} from '@mui/material';

// Define the style for the modal content
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
    display: 'flex',
    flexDirection: 'column',
    gap: 2, // Spacing between form elements
};

// Roles should match the choices in your backend CustomUser model
const roleChoices = [
    { value: 'student', label: 'Student' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'staff', label: 'Non-Teaching Staff' },
    { value: 'grievance_cell', label: 'Grievance Cell' },
    { value: 'admin', label: 'Admin' },
];

const AddUserModal = ({ open, handleClose, onUserAdded }) => {
    const [name, setName] = useState('');
    const [admissionNumber, setAdmissionNumber] = useState('');
    const [collegeEmail, setCollegeEmail] = useState('');
    const [role, setRole] = useState('student'); // Default role
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    const token = localStorage.getItem('accessToken');

    const resetForm = () => {
        setName('');
        setAdmissionNumber('');
        setCollegeEmail('');
        setRole('student');
        setPassword('');
        setConfirmPassword('');
        setError('');
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }
        // Add more validation if needed (e.g., email format)

        setLoading(true);

        const userData = {
            name,
            admission_number: admissionNumber, // Ensure key matches backend serializer
            college_email: collegeEmail,     // Ensure key matches backend serializer
            role,
            password,
            // username is set automatically from admission_number on the backend
        };

        try {
            await axios.post(`${apiUrl}/api/users/`, userData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            resetForm();    // Clear the form fields
            handleClose();  // Close the modal
            onUserAdded();  // Trigger refresh in parent component
            // Optionally show a success toast/snackbar here
        } catch (err) {
            console.error("Error adding user:", err);
            const backendErrors = err.response?.data;
            let errorMsg = 'Failed to add user. Please check the details and try again.';
            if (backendErrors) {
                // Try to format backend validation errors nicely
                errorMsg = Object.entries(backendErrors)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join(' | ');
            }
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleModalClose = () => {
        if (!loading) { // Prevent closing while loading
           resetForm();
           handleClose();
        }
    };


    return (
        <Modal
            open={open}
            onClose={handleModalClose}
            aria-labelledby="add-user-modal-title"
            aria-describedby="add-user-modal-description"
        >
            <Box sx={style} component="form" onSubmit={handleSubmit}>
                <Typography id="add-user-modal-title" variant="h6" component="h2">
                    Add New User
                </Typography>

                {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}

                <TextField
                    label="Full Name"
                    variant="outlined"
                    fullWidth
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                />
                <TextField
                    label="Admission Number / ID"
                    variant="outlined"
                    fullWidth
                    required
                    value={admissionNumber}
                    onChange={(e) => setAdmissionNumber(e.target.value)}
                    helperText="This will also be the username."
                    disabled={loading}
                />
                <TextField
                    label="College Email"
                    variant="outlined"
                    type="email"
                    fullWidth
                    required
                    value={collegeEmail}
                    onChange={(e) => setCollegeEmail(e.target.value)}
                    disabled={loading}
                />
                <FormControl fullWidth required disabled={loading}>
                    <InputLabel id="role-select-label">Role</InputLabel>
                    <Select
                        labelId="role-select-label"
                        id="role-select"
                        value={role}
                        label="Role"
                        onChange={(e) => setRole(e.target.value)}
                    >
                        {roleChoices.map((choice) => (
                            <MenuItem key={choice.value} value={choice.value}>
                                {choice.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField
                    label="Password"
                    variant="outlined"
                    type="password"
                    fullWidth
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                     helperText="Minimum 8 characters."
                />
                <TextField
                    label="Confirm Password"
                    variant="outlined"
                    type="password"
                    fullWidth
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                    <Button onClick={handleModalClose} disabled={loading} color="secondary">
                        Cancel
                    </Button>
                    <Button type="submit" variant="contained" disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : 'Add User'}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default AddUserModal;