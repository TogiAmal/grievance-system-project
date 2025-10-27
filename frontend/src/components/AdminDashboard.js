import React from 'react';
import { Container, Typography, Grid, Paper, Card, CardActionArea, CardContent } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

// Ensure ALL icons are imported
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import MarkChatReadOutlinedIcon from '@mui/icons-material/MarkChatReadOutlined';
//import DashboardIcon from '@mui/icons-material/Dashboard'; // For the 'Home' link

const adminCards = [
    {
        title: 'Pending Grievances',
        description: 'View and respond to all PENDING grievances.',
        link: '/admin/review',
        icon: <RateReviewOutlinedIcon sx={{ fontSize: 50, color: 'warning.main' }} />
    },
    {
        title: 'In-Progress Grievances',
        description: 'View grievances currently being worked on.',
        link: '/admin/in-progress',
        icon: <HourglassTopIcon sx={{ fontSize: 50, color: 'info.main' }} />
    },
    {
        title: 'Resolved Grievances',
        description: 'Browse the archive of all RESOLVED grievances.',
        link: '/admin/resolved',
        icon: <CheckCircleOutlineIcon sx={{ fontSize: 50, color: 'success.main' }} />
    },
    {
        title: 'User Management',
        description: 'Manage user roles and permissions for the portal.',
        link: '/admin/users',
        icon: <PeopleAltOutlinedIcon sx={{ fontSize: 50, color: 'primary.main' }} />
    },
    {
        title: 'View Statistics',
        description: 'See dashboard statistics for grievance resolution rates.',
        link: '/admin/stats',
        icon: <BarChartOutlinedIcon sx={{ fontSize: 50, color: 'primary.main' }} />
    },
    {
        title: 'Live Chat Inbox',
        description: 'Respond to live chat requests from students.',
        link: '/admin/inbox',
        icon: <MarkChatReadOutlinedIcon sx={{ fontSize: 50, color: 'primary.main' }} />
    }
];


const AdminDashboard = () => {
    const userName = localStorage.getItem('userName');

    return (
        <Container maxWidth="lg">
            {/* Hero Section */}
            <Paper
                sx={{
                    p: { xs: 2, sm: 3, md: 4 }, // Responsive padding
                    mb: 5,
                    backgroundColor: 'primary.dark',
                    color: 'white',
                    textAlign: 'center',
                    borderRadius: 2
                }}
                elevation={4}
            >
                <Typography variant="h4" component="h1" gutterBottom>
                    Admin Dashboard
                </Typography>
                <Typography variant="h6">
                    Welcome, {userName || 'Admin'}. Manage the portal from here.
                </Typography>
            </Paper>

            {/* Action Cards Section */}
            {/* Grid container ensures proper spacing and wrapping */}
            <Grid container spacing={3} alignItems="stretch"> {/* Added alignItems="stretch" */}
                {adminCards.map((card) => (
                    // Grid item defines the size for different screen widths
                    <Grid item xs={12} sm={6} md={4} key={card.title}>
                        {/* --- Card Styling for Alignment --- */}
                        <Card sx={{
                            height: '100%', // Make card fill the grid item height
                            display: 'flex',
                            flexDirection: 'column', // Stack content vertically
                            justifyContent: 'space-between' // Push content apart if needed
                        }}>
                            <CardActionArea
                                component={RouterLink}
                                to={card.link}
                                sx={{
                                    flexGrow: 1, // Allow action area to grow
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center', // Center icon/text horizontally
                                    justifyContent: 'flex-start', // Align content to the top
                                    p: 2 // Add padding to action area
                                }}
                            >
                                <CardContent sx={{
                                     textAlign: 'center',
                                     flexGrow: 1, // Allow content to grow
                                     display: 'flex',
                                     flexDirection: 'column',
                                     justifyContent: 'center' // Center content vertically within its space
                                     }}>
                                    {card.icon}
                                    <Typography variant="h6" component="div" sx={{ mt: 2, mb: 1 }}>
                                        {card.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {card.description}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                        {/* --- End Card Styling --- */}
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};

export default AdminDashboard;