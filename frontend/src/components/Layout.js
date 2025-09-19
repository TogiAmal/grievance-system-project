// src/components/Layout.js
import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Box, IconButton, Menu, MenuItem, useTheme, useMediaQuery } from '@mui/material';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import Chatbot from './Chatbot';

const Layout = () => {
    const navigate = useNavigate();
    const userName = localStorage.getItem('userName');
    const isLoggedIn = !!localStorage.getItem('accessToken');
    
    // Hooks to detect screen size
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // State to manage the mobile menu anchor
    const [anchorEl, setAnchorEl] = useState(null);
    const menuOpen = Boolean(anchorEl);

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleNavigate = (path) => {
        navigate(path);
        handleMenuClose();
    };

    const handleLogout = () => {
        localStorage.clear();
        window.dispatchEvent(new CustomEvent('userLoggedOut'));
        handleMenuClose(); // Close menu before navigating
        navigate('/login');
    };

    const renderDesktopMenu = () => (
        <>
            <Typography sx={{ mr: 2 }}>Welcome, {userName}</Typography>
            <Button color="inherit" component={Link} to="/dashboard">Home</Button>
            <Button color="inherit" component={Link} to="/status">Grievance Status</Button>
            <Button color="inherit" component={Link} to="/faq">FAQ</Button>
            <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </>
    );

    const renderMobileMenu = () => (
        <>
            <IconButton color="inherit" onClick={handleMenuOpen}>
                <MenuIcon />
            </IconButton>
            <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleMenuClose}>
                <MenuItem disabled>Welcome, {userName}</MenuItem>
                <MenuItem onClick={() => handleNavigate('/dashboard')}>Home</MenuItem>
                <MenuItem onClick={() => handleNavigate('/status')}>Grievance Status</MenuItem>
                <MenuItem onClick={() => handleNavigate('/faq')}>FAQ</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
        </>
    );

    return (
        <div>
            <AppBar position="static">
                <Toolbar>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="div">
                             <Link to={isLoggedIn ? "/dashboard" : "/login"} style={{ textDecoration: 'none', color: 'inherit' }}>
                                {isMobile ? "SJCET" : "St. Joseph's College of Engineering and Technology, Palai"}
                            </Link>
                        </Typography>
                        {!isMobile && (
                            <Typography variant="body2">
                                Online Grievance Redressal System
                            </Typography>
                        )}
                    </Box>
                    
                    {isLoggedIn && (isMobile ? renderMobileMenu() : renderDesktopMenu())}
                </Toolbar>
            </AppBar>
            
            <main>
                <Container sx={{ mt: 4, mb: 4 }}>
                    <Outlet />
                </Container>
            </main>

            {isLoggedIn && <Chatbot />}
        </div>
    );
};

export default Layout;