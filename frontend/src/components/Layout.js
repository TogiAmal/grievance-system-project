import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Box, IconButton, Menu, MenuItem, useTheme, useMediaQuery, Badge, Avatar, Divider } from '@mui/material';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import Chatbot from './Chatbot';

const Layout = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const isLoggedIn = !!localStorage.getItem('accessToken');
    const [notificationCount, setNotificationCount] = useState(0);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
    const [userMenuAnchor, setUserMenuAnchor] = useState(null);

    useEffect(() => {
        const loadUser = () => {
            const userDataString = localStorage.getItem('user');
            if (userDataString) { setUser(JSON.parse(userDataString)); }
        };
        loadUser();

        // This listener will reload user data when 'profileUpdated' is dispatched
        const handleProfileUpdate = () => loadUser();
        window.addEventListener('profileUpdated', handleProfileUpdate);
        
        if (isLoggedIn) {
            const token = localStorage.getItem('accessToken');
            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            const wsHost = process.env.REACT_APP_API_URL ? new URL(process.env.REACT_APP_API_URL).host : 'localhost:8000';
            const wsUrl = `${protocol}://${wsHost}/ws/notifications/?token=${token}`;
            const notificationSocket = new WebSocket(wsUrl);

            notificationSocket.onmessage = (e) => {
                const data = JSON.parse(e.data);
                if (data.type === 'profile_updated') {
                    // This handles the real-time update from the database signal
                    loadUser();
                } else {
                    setNotificationCount(prev => prev + 1);
                }
            };
            notificationSocket.onclose = () => console.error('Notification socket closed');
            
            return () => {
                window.removeEventListener('profileUpdated', handleProfileUpdate);
                notificationSocket.close();
            };
        }

        return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
    }, [isLoggedIn]);

    const handleMobileMenuOpen = (e) => setMobileMenuAnchor(e.currentTarget);
    const handleMobileMenuClose = () => setMobileMenuAnchor(null);
    const handleUserMenuOpen = (e) => setUserMenuAnchor(e.currentTarget);
    const handleUserMenuClose = () => setUserMenuAnchor(null);
    const handleNavigate = (path) => {
        if (path === '/inbox') setNotificationCount(0);
        navigate(path);
        handleMobileMenuClose();
        handleUserMenuClose();
    };
    const handleLogout = () => {
        localStorage.clear();
        setUser(null);
        navigate('/login');
    };

    const renderDesktopMenu = () => (
        <>
            <Button color="inherit" component={Link} to="/dashboard">Home</Button>
            <Button color="inherit" component={Link} to="/add-grievance">Add Grievance</Button>
            <Button color="inherit" component={Link} to="/status">Grievance Status</Button>
            <Button color="inherit" onClick={() => handleNavigate('/inbox')}><Badge badgeContent={notificationCount} color="error">Inbox</Badge></Button>
            <Button color="inherit" component={Link} to="/faq">FAQ</Button>
            <IconButton onClick={handleUserMenuOpen} sx={{ p: 0, ml: 2 }}>
                <Avatar alt={user?.name} src={user?.profile_image ? `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${user.profile_image}` : '/default-avatar.png'} />
            </IconButton>
            <Menu anchorEl={userMenuAnchor} open={Boolean(userMenuAnchor)} onClose={handleUserMenuClose}>
                <MenuItem disabled>Signed in as {user?.name}</MenuItem>
                <Divider />
                <MenuItem onClick={() => handleNavigate('/profile')}>Profile</MenuItem>
                <MenuItem onClick={() => handleNavigate('/change-password')}>Change Password</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
        </>
    );

    const renderMobileMenu = () => (
        <>
            <IconButton color="inherit" onClick={handleMobileMenuOpen}><Badge badgeContent={notificationCount} color="error"><MenuIcon /></Badge></IconButton>
            <Menu anchorEl={mobileMenuAnchor} open={Boolean(mobileMenuAnchor)} onClose={handleMobileMenuClose}>
                <MenuItem onClick={() => handleNavigate('/profile')}><Avatar alt={user?.name} src={user?.profile_image ? `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${user.profile_image}` : '/default-avatar.png'} sx={{ mr: 2 }} /> Profile</MenuItem>
                <Divider />
                <MenuItem onClick={() => handleNavigate('/dashboard')}>Home</MenuItem>
                <MenuItem onClick={() => handleNavigate('/add-grievance')}>Add Grievance</MenuItem>
                <MenuItem onClick={() => handleNavigate('/status')}>Grievance Status</MenuItem>
                <MenuItem onClick={() => handleNavigate('/inbox')}>Inbox</MenuItem>
                <MenuItem onClick={() => handleNavigate('/faq')}>FAQ</MenuItem>
                <MenuItem onClick={() => handleNavigate('/change-password')}>Change Password</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
        </>
    );

    return (
        <div>
            <AppBar position="static">
                <Toolbar>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6"><Link to={isLoggedIn ? "/dashboard" : "/login"} style={{ textDecoration: 'none', color: 'inherit' }}>{isMobile ? "SJCET" : "St. Joseph's College of Engineering and Technology, Palai"}</Link></Typography>
                        {!isMobile && <Typography variant="body2">Online Grievance Redressal System</Typography>}
                    </Box>
                    {isLoggedIn && (isMobile ? renderMobileMenu() : renderDesktopMenu())}
                </Toolbar>
            </AppBar>
            <main><Container sx={{ mt: 4, mb: 4 }}><Outlet /></Container></main>
            {isLoggedIn && <Chatbot />}
        </div>
    );
};

export default Layout;