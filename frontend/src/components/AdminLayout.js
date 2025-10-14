import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Box, IconButton, Menu, MenuItem, useTheme, useMediaQuery, Badge, Divider, ListItemText } from '@mui/material';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';

const AdminLayout = () => {
    const navigate = useNavigate();
    const userName = localStorage.getItem('userName');
    const isLoggedIn = !!localStorage.getItem('accessToken');
    const [notifications, setNotifications] = useState([]);
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
    const [notificationMenuAnchor, setNotificationMenuAnchor] = useState(null);

    useEffect(() => {
        if (isLoggedIn) {
            const token = localStorage.getItem('accessToken');
            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            const wsHost = process.env.REACT_APP_API_URL ? new URL(process.env.REACT_APP_API_URL).host : 'localhost:8000';
            const wsUrl = `${protocol}://${wsHost}/ws/notifications/?token=${token}`;

            const notificationSocket = new WebSocket(wsUrl);

            notificationSocket.onmessage = (e) => {
                const data = JSON.parse(e.data);
                setNotifications(prev => [data, ...prev]);
            };
            notificationSocket.onclose = () => console.error('Notification socket closed');
            return () => notificationSocket.close();
        }
    }, [isLoggedIn]);

    const handleMobileMenuOpen = (event) => setMobileMenuAnchor(event.currentTarget);
    const handleMobileMenuClose = () => setMobileMenuAnchor(null);
    const handleNotificationMenuOpen = (event) => setNotificationMenuAnchor(event.currentTarget);
    const handleNotificationMenuClose = () => setNotificationMenuAnchor(null);
    
    const handleNavigate = (path) => {
        navigate(path);
        handleMobileMenuClose();
    };

    const handleNotificationClick = (grievanceId) => {
        // Clear notifications when one is clicked for simplicity
        setNotifications([]);
        handleNotificationMenuClose();
        navigate(`/admin/grievance/${grievanceId}`);
    };
    
    const handleLogout = () => {
        localStorage.clear();
        handleMobileMenuClose();
        navigate('/login');
    };

    const renderDesktopMenu = () => (
        <>
            <Typography sx={{ mr: 2 }}>Admin: {userName}</Typography>
            <Button color="inherit" component={Link} to="/admin/dashboard">Dashboard</Button>
            <Button color="inherit" component={Link} to="/admin/inbox">Inbox</Button>
            <Button color="inherit" component={Link} to="/admin/users">Manage Users</Button>
            
            <IconButton color="inherit" onClick={handleNotificationMenuOpen}>
                <Badge badgeContent={notifications.length} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </>
    );

    const renderMobileMenu = () => (
        <>
            <IconButton color="inherit" onClick={handleMobileMenuOpen}>
                <MenuIcon />
            </IconButton>
            <Menu anchorEl={mobileMenuAnchor} open={Boolean(mobileMenuAnchor)} onClose={handleMobileMenuClose}>
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
            
            <Menu
                anchorEl={notificationMenuAnchor}
                open={Boolean(notificationMenuAnchor)}
                onClose={handleNotificationMenuClose}
                MenuListProps={{ 'aria-labelledby': 'notifications-button' }}
            >
                <MenuItem disabled>
                    <Typography variant="subtitle1">Notifications</Typography>
                </MenuItem>
                <Divider />
                {notifications.length > 0 ? notifications.map((notif, index) => (
                    <MenuItem key={index} onClick={() => handleNotificationClick(notif.grievance_id)}>
                        <ListItemText 
                            primary={`New Chat Request`}
                            secondary={notif.message} 
                        />
                    </MenuItem>
                )) : (
                    <MenuItem disabled>No new notifications</MenuItem>
                )}
            </Menu>

            <main>
                <Container sx={{ mt: 4, mb: 4 }}>
                    <Outlet />
                </Container>
            </main>
        </div>
    );
};

export default AdminLayout;