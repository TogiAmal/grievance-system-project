import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Button, TextField, Container, Typography, Box, Paper, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const Registration = () => {
    const [formData, setFormData] = useState({
        name: '',
        admission_number: '',
        college_email: '',
        phone_number: '',
        role: 'student', // Default role
        password: '',
        password2: '',
    });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

   // In src/components/Registration.js

const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

    try {
        await axios.post(`${apiUrl}/api/register/`, formData);
        setSuccessMessage('Registration successful! Redirecting to login...');
        
        // Redirect to the login page after a 2-second delay
        setTimeout(() => {
            navigate('/login');
        }, 2000);

    } catch (err) {
        if (err.response && err.response.data) {
            const errorData = err.response.data;
            const errorMessages = Object.values(errorData).flat().join(' ');
            setError(errorMessages || 'Registration failed. Please try again.');
        } else {
            setError('Registration failed. An unknown error occurred.');
        }
    }
};

    return (
        <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
            <Paper elevation={6} sx={{ padding: 4, width: '100%', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
                        Register
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                        <TextField margin="normal" required fullWidth autoFocus id="name" label="Full Name" name="name" value={formData.name} onChange={handleChange} />
                        <TextField margin="normal" required fullWidth id="admission_number" label="Admission / Employee ID" name="admission_number" value={formData.admission_number} onChange={handleChange} />
                        <TextField margin="normal" required fullWidth id="college_email" label="College Email Address" name="college_email" type="email" value={formData.college_email} onChange={handleChange} />
                        <TextField margin="normal" required fullWidth id="phone_number" label="Phone Number" name="phone_number" value={formData.phone_number} onChange={handleChange} />
                        
                        <FormControl fullWidth margin="normal" required>
                            <InputLabel id="role-select-label">I am a</InputLabel>
                            <Select
                                labelId="role-select-label"
                                id="role"
                                name="role"
                                value={formData.role}
                                label="I am a"
                                onChange={handleChange}
                            >
                                <MenuItem value="student">Student</MenuItem>
                                <MenuItem value="teacher">Teacher</MenuItem>
                                <MenuItem value="staff">Non-Teaching Staff</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField margin="normal" required fullWidth name="password" label="Password (min. 8 characters)" type="password" id="password" value={formData.password} onChange={handleChange} />
                        <TextField margin="normal" required fullWidth name="password2" label="Confirm Password" type="password" id="password2" value={formData.password2} onChange={handleChange} />
                        
                        {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
                        {successMessage && <Alert severity="success" sx={{ mt: 2, width: '100%' }}>{successMessage}</Alert>}

                        <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, py: 1.5 }}>
                            Register
                        </Button>
                        <Typography variant="body2" align="center">
                            <Link to="/login" style={{ textDecoration: 'none' }}>
                                {"Already have an account? Sign In"}
                            </Link>
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default Registration;