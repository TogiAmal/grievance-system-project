import React, { useState } from 'react';
import axios from 'axios';
import {
  Container,
  TextField,
  Button,
  Typography,
  Alert,
  Box,
  MenuItem,
  Paper,
} from '@mui/material';

const AddGrievance = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('LOW');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('You must log in first.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('priority', priority);
    if (file) formData.append('evidence_file', file);

    try {
      await axios.post(`${apiUrl}/api/grievances/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage('✅ Grievance submitted successfully!');
      setTitle('');
      setDescription('');
      setPriority('LOW');
      setFile(null);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        setError('Unauthorized: Please log in again.');
      } else if (err.response?.status === 400) {
        setError('Invalid file type or missing fields.');
      } else {
        setError('Failed to submit grievance. Please try again.');
      }
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 5 }}>
      <Paper sx={{ p: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h4" gutterBottom align="center">
          Submit a Grievance
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Title"
            fullWidth
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            label="Description"
            fullWidth
            multiline
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            label="Priority"
            select
            fullWidth
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            sx={{ mb: 2 }}
          >
            <MenuItem value="LOW">Low</MenuItem>
            <MenuItem value="MEDIUM">Medium</MenuItem>
            <MenuItem value="HIGH">High</MenuItem>
          </TextField>

          <Button variant="outlined" component="label" sx={{ mb: 2 }}>
            Upload File (Image or PDF)
            <input
              type="file"
              hidden
              accept="image/*,.pdf"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </Button>

          {file && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              📎 {file.name}
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
            fullWidth
            sx={{ mt: 2 }}
          >
            Submit Grievance
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default AddGrievance;
