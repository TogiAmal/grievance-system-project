import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import GrievanceTable from './GrievanceTable'; // Reuse the table

const InProgressGrievances = () => {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchGrievances = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('You must log in to view this page.');
        setLoading(false);
        return;
      }
      try {
        // --- Fetch ONLY IN_PROGRESS grievances ---
        const response = await axios.get(`${apiUrl}/api/grievances/?status_filter=in_progress`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGrievances(response.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch in-progress grievances.');
      } finally {
        setLoading(false);
      }
    };
    fetchGrievances();
  }, [apiUrl]);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h4" gutterBottom align="center">
          In-Progress Grievances
        </Typography>
        {grievances.length === 0 ? (
          <Alert severity="info">There are no grievances currently in progress.</Alert>
        ) : (
          <GrievanceTable grievances={grievances} />
        )}
      </Paper>
    </Container>
  );
};

export default InProgressGrievances;