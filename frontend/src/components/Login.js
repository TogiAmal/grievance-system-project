// src/components/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Button, TextField, Container, Typography, Box, Paper, Alert, Grid, Avatar } from '@mui/material';

const grievanceCellMembers = [
    {
        name: 'Dr. John Doe',
        designation: 'Principal',
        phone: '+91 98765 43210',
        imageUrl: '/images/g3.jpeg'
    },
    {
        name: 'Prof. Jane Smith',
        designation: 'Dean of Student Affairs',
        phone: '+91 98765 43211',
        imageUrl: '/images/g1.webp'
    },
    {
        name: 'Dr. Alex Ray',
        designation: 'Head of Grievance Cell',
        phone: '+91 98765 43212',
        imageUrl: '/images/g2.jpeg'
    }
];

const decodeToken = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
};

const Login = () => {
    const [admissionNumber, setAdmissionNumber] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await axios.post('http://127.0.0.1:8000/api/token/', {
                username: admissionNumber,
                password: password,
            });

            localStorage.setItem('accessToken', response.data.access);
            localStorage.setItem('refreshToken', response.data.refresh);
            
            const userData = decodeToken(response.data.access);
            if (userData) {
                localStorage.setItem('userRole', userData.role);
                localStorage.setItem('username', userData.username);
                // --- ADD THIS LINE TO SAVE THE USER'S FULL NAME ---
                localStorage.setItem('userName', userData.name);
            }
            
            window.dispatchEvent(new CustomEvent('userLoggedIn'));

            if (userData && userData.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError('Invalid Admission Number or Password.');
        }
    };

    return (
        <>
            <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
                <Paper elevation={6} sx={{ padding: 4, width: '100%', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
                            Sign In
                        </Typography>
                        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="admission_number"
                                label="Admission Number"
                                name="admission_number"
                                autoComplete="username"
                                autoFocus
                                value={admissionNumber}
                                onChange={(e) => setAdmissionNumber(e.target.value)}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                type="password"
                                id="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            
                            {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
                            
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2, py: 1.5 }}
                            >
                                Sign In
                            </Button>
                            <Typography variant="body2" align="center">
                                <Link to="/register" style={{ textDecoration: 'none' }}>
                                    {"Don't have an account? Register"}
                                </Link>
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Container>

            <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
                <Typography variant="h4" component="h2" align="center" gutterBottom>
                    Grievance Cell Information
                </Typography>
                <Grid container spacing={4} justifyContent="center">
                    {grievanceCellMembers.map((member) => (
                        <Grid item xs={12} sm={6} md={4} key={member.name}>
                            <Paper elevation={3} sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                                <Avatar
                                    alt={member.name}
                                    src={member.imageUrl}
                                    sx={{ width: 120, height: 120, margin: '0 auto 16px' }}
                                />
                                <Typography variant="h6" component="div">
                                    {member.name}
                                </Typography>
                                <Typography color="text.secondary">
                                    {member.designation}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    {member.phone}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </>
    );
};

export default Login;