import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, Paper, Modal, Box, Button, CircularProgress, Alert } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const GrievanceStatus = () => {
    const [grievances, setGrievances] = useState([]);
    const [selectedGrievance, setSelectedGrievance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [open, setOpen] = useState(false);
    
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

    useEffect(() => {
        const fetchGrievances = async () => {
            const token = localStorage.getItem('accessToken');
            try {
                const response = await axios.get(`${apiUrl}/api/grievances/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setGrievances(response.data);
            } catch (err) {
                setError('Failed to fetch grievances.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchGrievances();
    }, [apiUrl]);

    const handleOpenModal = (grievance) => {
        setSelectedGrievance(grievance);
        setOpen(true);
    };

    const handleCloseModal = () => {
        setOpen(false);
        setSelectedGrievance(null);
    };

    const columns = [
        { field: 'id', headerName: 'ID', width: 90 },
        { field: 'title', headerName: 'Title', flex: 1, minWidth: 200 },
        { field: 'status', headerName: 'Status', width: 150 },
        {
            field: 'created_at',
            headerName: 'Submitted',
            width: 180,
            // --- THIS IS THE FIX for the 'created_at' error ---
            valueGetter: (params) => params.row ? new Date(params.row.created_at).toLocaleString() : ''
            // --------------------------------------------------
        },
        {
            field: 'priority',
            headerName: 'Priority',
            width: 120,
            renderCell: (params) => (
                <Box
                    sx={{
                        color: params.value === 'HIGH' ? 'red' : params.value === 'MEDIUM' ? 'orange' : 'green',
                        fontWeight: 'bold'
                    }}
                >
                    {params.value}
                </Box>
            )
        },
        {
            field: 'evidence_image', 
            headerName: 'File',
            width: 150,
            sortable: false,
            renderCell: (params) => (
                params.value ? (
                    <Button
                        variant="outlined"
                        size="small"
                        href={`${apiUrl}${params.value}`}
                        download
                    >
                        Download File
                    </Button>
                ) : "No file"
            )
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
                <Typography variant="h4" gutterBottom>Your Grievance Status</Typography>
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
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    bgcolor: 'background.paper',
                    border: '2px solid #000',
                    boxShadow: 24,
                    p: 4,
                }}>
                    {selectedGrievance && (
                        <>
                            <Typography variant="h5" gutterBottom>{selectedGrievance.title}</Typography>
                            <Typography variant="body1"><strong>Status:</strong> {selectedGrievance.status}</Typography>
                            <Typography variant="body1" sx={{ mb: 2 }}><strong>Priority:</strong> {selectedGrievance.priority}</Typography>
                            <Typography variant="body2" sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
                                {selectedGrievance.description}
                            </Typography>
                            
                            {selectedGrievance.evidence_image && (
                                <Button
                                    variant="outlined"
                                    href={`${apiUrl}${selectedGrievance.evidence_image}`}
                                    download
                                >
                                    Download Attached File
                                </Button>
                            )}
                        </>
                    )}
                </Box>
            </Modal>
        </Container>
    );
};

export default GrievanceStatus;