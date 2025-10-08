import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Paper, TextField, Button, Alert } from '@mui/material';

const AddGrievance = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [evidenceImage, setEvidenceImage] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleImageChange = (e) => {
        setEvidenceImage(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('Authentication error. Please log in again.');
            return;
        }

        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

        // Create a FormData object to send the file
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        if (evidenceImage) {
            formData.append('evidence_image', evidenceImage);
        }

        try {
            await axios.post(`${apiUrl}/api/grievances/`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data', // Important for file uploads
                }
            });

            setSuccess('Grievance submitted successfully! You will be redirected to the status page.');
            setTitle('');
            setDescription('');
            setEvidenceImage(null);

            setTimeout(() => {
                navigate('/status');
            }, 2000);

        } catch (err) {
            setError('Failed to submit grievance. Please ensure all fields are filled correctly.');
            console.error(err);
        }
    };

    return (
        <Container component="main" maxWidth="md">
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
                <Typography component="h1" variant="h4" sx={{ mb: 2 }}>
                    Submit a New Grievance
                </Typography>
                <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                        label="Grievance Title / Subject"
                        name="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        fullWidth
                        required
                        margin="normal"
                    />
                    <TextField
                        label="Detailed Description of the Grievance"
                        name="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        fullWidth
                        required
                        multiline
                        rows={6}
                        margin="normal"
                    />
                    
                    <Button variant="outlined" component="label" sx={{ mt: 2 }}>
                        Upload Evidence Image (Optional)
                        <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                    </Button>
                    {evidenceImage && <Typography sx={{ mt: 1, color: 'text.secondary', display: 'inline', ml: 2 }}>{evidenceImage.name}</Typography>}
                    
                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}

                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        sx={{ mt: 3, py: 1.5, display: 'block' }}
                    >
                        Submit Grievance
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default AddGrievance;