// src/components/Dashboard.js
import React from 'react';
import { Container, Typography, Box, Grid, Paper, Card, CardActionArea, CardContent } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PlagiarismOutlinedIcon from '@mui/icons-material/PlagiarismOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const actionCards = [
    {
        title: 'File a New Grievance',
        description: 'Submit a new complaint or issue to the portal for review.',
        link: '/add-grievance',
        icon: <AddCircleOutlineIcon sx={{ fontSize: 50, color: 'primary.main' }} />
    },
    {
        title: 'Check Grievance Status',
        description: 'View the current status and history of all your submitted grievances.',
        link: '/status',
        icon: <PlagiarismOutlinedIcon sx={{ fontSize: 50, color: 'primary.main' }} />
    },
    {
        title: 'View FAQ',
        description: 'Find answers to common questions about the grievance process.',
        link: '/faq',
        icon: <HelpOutlineIcon sx={{ fontSize: 50, color: 'primary.main' }} />
    }
];

const Dashboard = () => {
    const userName = localStorage.getItem('userName');

    return (
        <Container maxWidth="lg">
            {/* Hero Section */}
            <Paper 
                sx={{ 
                    p: 4, 
                    mb: 5, 
                    backgroundColor: 'primary.main', 
                    color: 'white', 
                    textAlign: 'center',
                    borderRadius: 2 
                }}
                elevation={4}
            >
                <Typography variant="h4" component="h1" gutterBottom>
                    Welcome, {userName || 'Student'}
                </Typography>
                <Typography variant="h6">
                    This is your central hub for managing grievances.
                </Typography>
            </Paper>
            
            {/* Action Cards Section */}
            <Grid container spacing={4}>
                {actionCards.map((card) => (
                    <Grid item xs={12} sm={6} md={4} key={card.title}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardActionArea component={RouterLink} to={card.link} sx={{ flexGrow: 1 }}>
                                <CardContent sx={{ textAlign: 'center', p: 3 }}>
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
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};

export default Dashboard;