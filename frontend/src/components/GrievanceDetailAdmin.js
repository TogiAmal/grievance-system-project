<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
=======
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
>>>>>>> 9c67756f7e253c640790da98c73422049bd66941
import axios from 'axios';
import {
  Container,
  Typography,
  Paper,
  Modal,
  Box,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const GrievanceStatus = () => {
  const [grievances, setGrievances] = useState([]);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

<<<<<<< HEAD
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchGrievances = async () => {
      const token = localStorage.getItem('accessToken');
      try {
        const response = await axios.get(`${apiUrl}/api/grievances/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGrievances(response.data);
      } catch (err) {
        setError('Failed to fetch grievances.');
        console.error(err);
      } finally {
        setLoading(false);
      }
=======
    const fetchGrievance = useCallback(async () => {
        const token = localStorage.getItem('accessToken');
        try {
            const res = await axios.get(`${apiUrl}/api/grievances/${id}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setGrievance(res.data);
            setStatus(res.data.status);
        } catch (error) {
            console.error("Failed to fetch grievance", error);
        }
    }, [id, apiUrl]); 

    useEffect(() => {
        fetchGrievance();
    }, [fetchGrievance]); 

    const handleUpdateStatus = async () => {
        const token = localStorage.getItem('accessToken');
        try {
            await axios.patch(`${apiUrl}/api/grievances/${id}/update_status/`, { status }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert('Status updated successfully!');
            fetchGrievance(); 
        } catch (error) {
            console.error("Failed to update status", error);
            alert('Failed to update status.');
        }
>>>>>>> 9c67756f7e253c640790da98c73422049bd66941
    };
    fetchGrievances();
  }, [apiUrl]);

<<<<<<< HEAD
  const handleOpenModal = (grievance) => {
    setSelectedGrievance(grievance);
    setOpen(true);
  };
=======
    const handleAddComment = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('accessToken');
        try {
            await axios.post(`${apiUrl}/api/grievances/${id}/add_comment/`, { comment_text: comment }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setComment('');
            fetchGrievance(); 
        } catch (error) {
            console.error("Failed to add comment", error);
            alert('Failed to post comment.');
        }
    };
>>>>>>> 9c67756f7e253c640790da98c73422049bd66941

  const handleCloseModal = () => {
    setOpen(false);
    setSelectedGrievance(null);
  };

<<<<<<< HEAD
  // ✅ Ensure valid absolute URLs
  const buildFileUrl = (fileUrl) => {
    if (!fileUrl) return null;
    if (fileUrl.startsWith('http')) return fileUrl;
    if (!fileUrl.startsWith('/')) fileUrl = '/' + fileUrl;
    return `${apiUrl}${fileUrl}`;
  };

  // ✅ View File
  const handleViewFile = (fileUrl) => {
    const finalUrl = buildFileUrl(fileUrl);
    if (!finalUrl) return;
    window.open(finalUrl, '_blank');
  };

  // ✅ Download File
  const handleDownloadFile = async (fileUrl) => {
    const finalUrl = buildFileUrl(fileUrl);
    if (!finalUrl) return;
    try {
      const response = await axios.get(finalUrl, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', finalUrl.split('/').pop());
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file.');
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'title', headerName: 'Title', flex: 1, minWidth: 200 },
    { field: 'status', headerName: 'Status', width: 150 },
    {
      field: 'created_at',
      headerName: 'Submitted',
      width: 180,
      valueGetter: (params) =>
        params.row ? new Date(params.row.created_at).toLocaleString() : '',
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 120,
      renderCell: (params) => (
        <Box
          sx={{
            color:
              params.value === 'HIGH'
                ? 'red'
                : params.value === 'MEDIUM'
                ? 'orange'
                : 'green',
            fontWeight: 'bold',
          }}
        >
          {params.value}
        </Box>
      ),
    },
    {
      field: 'evidence_image',
      headerName: 'File',
      width: 200,
      sortable: false,
      renderCell: (params) =>
        params.value ? (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleViewFile(params.value)}
            >
              View
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => handleDownloadFile(params.value)}
            >
              Download
            </Button>
          </Box>
        ) : (
          'No file'
        ),
    },
    {
      field: 'actions',
      headerName: 'Details',
      sortable: false,
      width: 150,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          onClick={() => handleOpenModal(params.row)}
        >
          View Details
        </Button>
      ),
    },
  ];

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 2, height: 600, width: '100%' }}>
        <Typography variant="h4" gutterBottom>
          Your Grievance Status
        </Typography>
        <DataGrid
          rows={grievances}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          pageSizeOptions={[5, 10, 20]}
        />
      </Paper>

      <Modal open={open} onClose={handleCloseModal}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 500,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
          }}
        >
          {selectedGrievance && (
            <>
              <Typography variant="h5" gutterBottom>
                {selectedGrievance.title}
              </Typography>
              <Typography variant="body1">
                <strong>Status:</strong> {selectedGrievance.status}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Priority:</strong> {selectedGrievance.priority}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  p: 2,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1,
                  mb: 2,
                }}
              >
                {selectedGrievance.description}
              </Typography>

              <Typography variant="h6" gutterBottom>
                Internal Comments
              </Typography>
              <Box
                sx={{
                  maxHeight: 150,
                  overflow: 'auto',
                  mb: 2,
                  p: 1,
                  backgroundColor: '#fafafa',
                  borderRadius: 1,
                }}
              >
                {selectedGrievance.comments &&
                selectedGrievance.comments.length > 0 ? (
                  selectedGrievance.comments.map((comment) => (
                    <Paper key={comment.id} sx={{ p: 1.5, mb: 1 }}>
                      <Typography variant="body2">
                        {comment.comment_text}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        sx={{ display: 'block', textAlign: 'right' }}
                      >
                        - {comment.user.name} on{' '}
                        {new Date(comment.timestamp).toLocaleString()}
                      </Typography>
                    </Paper>
                  ))
                ) : (
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ p: 1 }}
                  >
                    No internal comments yet.
                  </Typography>
=======
    return (
        <Container maxWidth="md">
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h4" gutterBottom>{grievance.title}</Typography>
                <Typography variant="body1"><strong>Submitted by:</strong> {grievance.submitted_by.name}</Typography>
                <Typography variant="body1"><strong>Current Status:</strong> {grievance.status}</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}><strong>Priority:</strong> {grievance.priority}</Typography>
                <Typography variant="body2" sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>{grievance.description}</Typography>
                
                {/* --- THIS IS THE FIXED "DOWNLOAD" BUTTON --- */}
                {grievance.evidence_image && (
                    <Box mt={2}>
                        <Typography variant="subtitle1" gutterBottom>Attached Evidence:</Typography>
                        <Button 
                            variant="outlined" 
                            href={`${apiUrl}${grievance.evidence_image}`} 
                            download
                        >
                            Download Attached File
                        </Button>
                    </Box>
>>>>>>> 9c67756f7e253c640790da98c73422049bd66941
                )}
              </Box>

              {selectedGrievance.evidence_image && (
                <Box mt={2}>
                  <Typography variant="subtitle1" gutterBottom>
                    Evidence File:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      onClick={() => handleViewFile(selectedGrievance.evidence_image)}
                    >
                      View
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => handleDownloadFile(selectedGrievance.evidence_image)}
                    >
                      Download
                    </Button>
                  </Box>
                </Box>
              )}
            </>
          )}
        </Box>
      </Modal>
    </Container>
  );
};

<<<<<<< HEAD
export default GrievanceStatus;
=======
export default GrievanceDetailAdmin;
>>>>>>> 9c67756f7e253c640790da98c73422049bd66941
