import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
    Box, CssBaseline, AppBar, Toolbar, Typography, Drawer, List, ListItem,
    ListItemButton, ListItemIcon, ListItemText, Divider, IconButton, Badge,
    CircularProgress, Avatar, Menu, MenuItem
} from '@mui/material';
import {
    Dashboard as DashboardIcon, RateReviewOutlined as RateReviewOutlinedIcon,
    HourglassTop as HourglassTopIcon, CheckCircleOutline as CheckCircleOutlineIcon,
    PeopleAltOutlined as PeopleAltOutlinedIcon, BarChartOutlined as BarChartOutlinedIcon,
    MarkChatReadOutlined as MarkChatReadOutlinedIcon, Notifications as NotificationsIcon,
    AccountCircle, Logout as LogoutIcon, Password as PasswordIcon, ManageAccounts as ManageAccountsIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import GroupIcon from '@mui/icons-material/Group';
const drawerWidth = 240;

const AdminLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const token = localStorage.getItem('accessToken');
    const ws = useRef(null);
    const [notificationCount, setNotificationCount] = useState(0);
    const [anchorEl, setAnchorEl] = useState(null);
    const [profileAnchorEl, setProfileAnchorEl] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

    // Navigation items for the sidebar
    const navItems = [
        { text: 'Home', icon: <DashboardIcon />, link: '/admin/dashboard' },
        { text: 'Pending', icon: <RateReviewOutlinedIcon />, link: '/admin/review' },
        { text: 'In Progress', icon: <HourglassTopIcon />, link: '/admin/in-progress' },
        { text: 'Resolved', icon: <CheckCircleOutlineIcon />, link: '/admin/resolved' },
        { text: 'User Management', icon: <PeopleAltOutlinedIcon />, link: '/admin/users' },
        { text: 'Cell Members', icon: <GroupIcon />, link: '/admin/cell-members' },
        { text: 'Statistics', icon: <BarChartOutlinedIcon />, link: '/admin/stats' },
        { text: 'Chat Inbox', icon: <MarkChatReadOutlinedIcon />, link: '/admin/inbox' },
    ];

    useEffect(() => {
        let isMounted = true;
        if (token) {
            setLoadingProfile(true);
            axios.get(`${apiUrl}/api/users/me/`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(response => {
                if (isMounted) setProfileImage(response.data.profile_image);
            })
            .catch(error => console.error("Failed to fetch profile", error))
            .finally(() => {
                if (isMounted) setLoadingProfile(false);
            });

            const wsPath = `${wsUrl}/ws/notifications/admin/?token=${token}`;
            ws.current = new WebSocket(wsPath);

            ws.current.onopen = () => console.log('Admin Notification WebSocket connected');
            ws.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('Admin WebSocket message received:', data);
                if (data.type === 'new_grievance' || data.type === 'grievance_status_update' || data.type === 'new_comment') {
                   if (isMounted) setNotificationCount(prev => prev + 1);
                    toast.info(data.payload?.message || 'New activity!');
                }
            };
            ws.current.onclose = (event) => {
                console.log('Admin Notification WebSocket disconnected:', event.reason);
            };
            ws.current.onerror = (error) => {
                 console.error('Admin WebSocket error:', error);
            };

            return () => {
                isMounted = false;
                if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                    ws.current.close();
                }
            };
        } else {
             if (isMounted) setLoadingProfile(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, apiUrl, wsUrl]);

    const handleLogout = () => {
        localStorage.clear();
        if (ws.current) ws.current.close();
        navigate('/login');
    };

    const handleMenu = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);
    const handleProfileMenu = (event) => setProfileAnchorEl(event.currentTarget);
    const handleProfileClose = () => setProfileAnchorEl(null);

    const handleProfile = () => { navigate('/admin/profile'); handleProfileClose(); };
    const handleChangePassword = () => { navigate('/admin/change-password'); handleProfileClose(); };
    const handleViewNotifications = () => {
         navigate('/admin/review');
         setNotificationCount(0);
         handleClose();
    };


    const drawer = (
        <div>
            <Toolbar />
            <Divider />
            <List>
                {navItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton
                            component={RouterLink}
                            to={item.link}
                            selected={location.pathname === item.link}
                            sx={{
                                '&:hover': { backgroundColor: 'action.hover' },
                                '&.Mui-selected': {
                                   backgroundColor: 'action.selected',
                                   fontWeight: 'fontWeightBold',
                                 },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: '40px' }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </div>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    {/* --- UPDATED TITLE --- */}
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        St. Joseph's College of Engineering and Technology, Palai (Autonomous) Grievance Admin Portal
                    </Typography>
                    {/* --- END UPDATED TITLE --- */}

                    <IconButton color="inherit" onClick={handleMenu} aria-label="show notifications">
                        <Badge badgeContent={notificationCount} color="error">
                            <NotificationsIcon />
                        </Badge>
                    </IconButton>
                    <Menu
                        id="menu-notifications"
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleClose}
                        MenuListProps={{'aria-labelledby': 'button-notifications'}}
                    >
                        <MenuItem onClick={handleViewNotifications} disabled={notificationCount === 0}>
                             View New Activity ({notificationCount})
                         </MenuItem>
                    </Menu>

                     <IconButton
                        color="inherit"
                        onClick={handleProfileMenu}
                        aria-label="account of current user"
                        aria-controls="menu-profile"
                        aria-haspopup="true"
                        sx={{ ml: 1 }}
                     >
                         {loadingProfile ? <CircularProgress size={24} color="inherit" /> :
                          (profileImage ? <Avatar src={profileImage} sx={{ width: 32, height: 32 }} /> : <AccountCircle />)}
                     </IconButton>
                     <Menu
                         id="menu-profile"
                         anchorEl={profileAnchorEl}
                         open={Boolean(profileAnchorEl)}
                         onClose={handleProfileClose}
                         MenuListProps={{'aria-labelledby': 'button-profile'}}
                         anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                         transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                     >
                         <MenuItem onClick={handleProfile}><ManageAccountsIcon fontSize="small" sx={{ mr: 1 }}/> Profile</MenuItem>
                         <MenuItem onClick={handleChangePassword}><PasswordIcon fontSize="small" sx={{ mr: 1 }}/> Change Password</MenuItem>
                         <Divider />
                         <MenuItem onClick={handleLogout}><LogoutIcon fontSize="small" sx={{ mr: 1 }}/> Logout</MenuItem>
                     </Menu>
                </Toolbar>
            </AppBar>
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
                }}
            >
                {drawer}
            </Drawer>
            <Box
                component="main"
                sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}
            >
                <Toolbar /> {/* Spacer for AppBar */}
                <Outlet /> {/* Child routes will render here */}
            </Box>
        </Box>
    );
};

export default AdminLayout;