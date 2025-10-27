import React from 'react';
import { Container, Typography, Box, Grid } from '@mui/material';
import AdminReviewPage from './AdminReviewPage'; // Use the main grievance review component

const GrievanceCellHomePage = () => {
    // You can add custom stats here later, but for now, it shows the review table.
    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
                Grievance Cell Dashboard
            </Typography>
            <Box sx={{ mt: 3 }}>
                <AdminReviewPage />
            </Box>
        </Container>
    );
};

export default GrievanceCellHomePage;