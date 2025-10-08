import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Box, IconButton, Menu, MenuItem, useTheme, useMediaQuery, Badge } from '@mui/material';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';

const AdminLayout = () => {
    const navigate = useNavigate();
    const userName = localStorage.getItem('userName');
    const isLoggedIn = !!localStorage.getItem('accessToken');
    const [notificationCount, setNotificationCount] = useState(0);
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [anchorEl, setAnchorEl] = useState(null);
    const menuOpen = Boolean(anchorEl);
    
    // This useEffect sets up the global notification listener for the admin
    useEffect(() => {
        if (isLoggedIn) {
            const token = localStorage.getItem('accessToken');
            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            const wsHost = process.env.REACT_APP_API_URL ? new URL(process.env.REACT_APP_API_URL).host : 'localhost:8000';
            const wsUrl = `${protocol}://${wsHost}/ws/notifications/?token=${token}`;

            const notificationSocket = new WebSocket(wsUrl);

            notificationSocket.onmessage = (e) => {
                setNotificationCount(prev => prev + 1);
            };

            notificationSocket.onclose = () => {
                console.error('Notification socket closed');
            };

            return () => notificationSocket.close();
        }
    }, [isLoggedIn]);

    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);
    const handleNavigate = (path) => {
        if (path === '/admin/inbox') setNotificationCount(0); // Reset count on navigation
        navigate(path);
        handleMenuClose();
    };

    const handleLogout = () => {
        localStorage.clear();
        window.dispatchEvent(new CustomEvent('userLoggedOut'));
        handleMenuClose();
        navigate('/login');
    };

    const renderDesktopMenu = () => (
        <>
            <Typography sx={{ mr: 2 }}>Admin: {userName}</Typography>
            <Button color="inherit" component={Link} to="/admin/dashboard">Dashboard</Button>
            <Button color="inherit" onClick={() => handleNavigate('/admin/inbox')}>
                <Badge badgeContent={notificationCount} color="error">
                    Inbox
                </Badge>
            </Button>
            <Button color="inherit" component={Link} to="/admin/users">Manage Users</Button>
            <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </>
    );

    const renderMobileMenu = () => (
        <>
            <IconButton color="inherit" onClick={handleMenuOpen}>
                <Badge badgeContent={notificationCount} color="error">
                    <MenuIcon />
                </Badge>
            </IconButton>
            <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleMenuClose}>
                <MenuItem disabled>Admin: {userName}</MenuItem>
                <MenuItem onClick={() => handleNavigate('/admin/dashboard')}>Dashboard</MenuItem>
                <MenuItem onClick={() => handleNavigate('/admin/inbox')}>Inbox</MenuItem>
                <MenuItem onClick={() => handleNavigate('/admin/users')}>Manage Users</MenuItem>
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
                             <Link to="/admin/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
                                SJCET Admin Portal
                            </Link>
                        </Typography>
                    </Box>
                    {isLoggedIn && (isMobile ? renderMobileMenu() : renderDesktopMenu())}
                </Toolbar>
            </AppBar>
            
            <main>
                <Container sx={{ mt: 4, mb: 4 }}>
                    <Outlet />
                </Container>
            </main>
        </div>
    );
};

export default AdminLayout;