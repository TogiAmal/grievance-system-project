import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Paper,
  Box,
  CircularProgress,
  Alert,
  Grid,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
  Chip,
} from '@mui/material';
import { format } from 'date-fns';
// Import toastify for better temporary messages (optional but recommended)
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import CSS for toastify

const GrievanceDetailAdmin = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [grievance, setGrievance] = useState(null);
  const [loading, setLoading] = useState(true); // For initial load
  const [actionLoading, setActionLoading] = useState(false); // For button actions
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [actionError, setActionError] = useState('');
  // State specifically for the redirect message
  const [redirectMessage, setRedirectMessage] = useState(''); 

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  const token = localStorage.getItem('accessToken');

  const getStatusColor = (status) => {
    // ... (getStatusColor function remains the same)
    switch (status) {
      case 'SUBMITTED':
      case 'PENDING':
        return 'warning';
      case 'IN_PROGRESS':
        return 'info';
      case 'ACTION_TAKEN':
        return 'secondary';
      case 'RESOLVED':
        return 'success';
      default:
        return 'default';
    }
  };

  const fetchGrievance = useCallback(async () => {
    setActionError('');
    setRedirectMessage(''); // Clear redirect message on fetch
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/api/grievances/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGrievance(response.data);
      setError('');
    } catch (err) {
      console.error("Error fetching grievance:", err);
      setError('Failed to fetch grievance details. It might have been deleted or an error occurred.');
      setGrievance(null);
    } finally {
      setLoading(false);
    }
  }, [id, apiUrl, token]);

  useEffect(() => {
    fetchGrievance();
  }, [fetchGrievance]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    setRedirectMessage('');
    if (!newComment.trim()) {
      setActionError('Comment cannot be empty.');
      return;
    }
    setActionLoading(true); // Use action loading state
    try {
      await axios.post(
        `${apiUrl}/api/grievances/${id}/add_comment/`,
        { comment_text: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewComment('');
      await fetchGrievance(); // Refresh grievance data
    } catch (err) {
      console.error("Error posting comment:", err);
      setActionError('Failed to post comment.');
    } finally {
      setActionLoading(false); // Use action loading state
    }
  };

  const handleStatusUpdate = async (targetStatus) => {
    setActionError('');
    setRedirectMessage('');
    if (!targetStatus) return;
    setActionLoading(true); // Use action loading state
    try {
      await axios.patch(
        `${apiUrl}/api/grievances/${id}/update_status/`,
        { status: targetStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // --- Updated Redirect Logic with Messages ---
      if (targetStatus === 'IN_PROGRESS') {
         setRedirectMessage("Status updated! Redirecting to Pending page..."); 
         setTimeout(() => {
            navigate('/admin/review'); 
         }, 1500); // Redirect after 1.5 seconds
      } else if (targetStatus === 'RESOLVED') {
         setRedirectMessage("Status updated! Redirecting to In Progress page...");
          setTimeout(() => {
             // Redirect to the In Progress page now
             navigate('/admin/in-progress'); 
          }, 1500); // Redirect after 1.5 seconds
      } else {
         // For other statuses (like ACTION_TAKEN), just refresh
         toast.success(`Status updated to ${targetStatus.replace('_', ' ')}!`); // Give feedback
         await fetchGrievance();
         setActionLoading(false); // Stop loading if not redirecting
      }
      // --- End Updated Redirect ---

    } catch (err) {
      console.error("Error updating status:", err);
      setActionError(`Failed to update status: ${err.response?.data?.status ? err.response.data.status[0] : err.message}`);
      setActionLoading(false); // Stop loading on error
    }
    // No setActionLoading(false) here on success if redirecting, as the component will unmount
  };

  // Initial loading state
  if (loading) { 
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Container>
    );
  }

  // Error fetching state
  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button component={Link} to="/admin/review" sx={{ mt: 2 }}>
            &larr; Back to Pending Grievances
        </Button>
      </Container>
    );
  }

  // Grievance not found or became null
   if (!grievance) {
     return (
       <Container sx={{ mt: 4 }}>
        <Alert severity="warning">Grievance data not available.</Alert>
         <Button component={Link} to="/admin/review" sx={{ mt: 2 }}>
            &larr; Back to Pending Grievances
         </Button>
       </Container>
    );
  }

  // --- Render Status Controls Function ---
  const renderStatusUpdateControls = () => {
    // If we are about to redirect, show the message instead of buttons
    if (redirectMessage) {
        return <Alert severity="info" sx={{ mt: 3 }}>{redirectMessage}</Alert>;
    }

    switch (grievance.status) {
      case 'SUBMITTED':
      case 'PENDING':
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6">Update Status</Typography>
            <Button
              variant="contained"
              color="info"
              onClick={() => handleStatusUpdate('IN_PROGRESS')}
              disabled={actionLoading} // Use action loading state
              fullWidth
            >
              Mark as In Progress
            </Button>
          </Box>
        );
      case 'IN_PROGRESS':
      case 'ACTION_TAKEN':
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6">Update Status</Typography>
            <Button
              variant="contained"
              color="success"
              onClick={() => handleStatusUpdate('RESOLVED')}
              disabled={actionLoading} // Use action loading state
              fullWidth
            >
              Mark as Resolved
            </Button>
          </Box>
        );
      case 'RESOLVED':
        return (
           <Typography variant="body2" color="textSecondary" sx={{ mt: 3 }}>
             This grievance is resolved.
           </Typography>
        );
      default:
        return null;
    }
  };
  // --- End Render Status Controls ---

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Include ToastContainer for optional toast messages */}
      <ToastContainer position="bottom-right" autoClose={3000} /> 
      
      <Button component={Link} to="/admin/review" sx={{ mb: 2 }}>
        &larr; Back to Grievances
      </Button>
      <Paper sx={{ p: 4, borderRadius: 2, position: 'relative' }}>
        {/* Spinner only shows during button actions now */}
        {actionLoading && <CircularProgress size={24} sx={{ position: 'absolute', top: 16, right: 16 }} />}
        
        <Grid container spacing={4}>
          {/* Left Column: Details */}
          <Grid item xs={12} md={7}>
             {/* ... (Details remain the same) ... */}
            <Typography variant="h4" gutterBottom>Grievance #{grievance.id}</Typography>
            <Chip
              label={grievance.status.replace('_', ' ')}
              color={getStatusColor(grievance.status)}
              sx={{ mb: 2, fontWeight: 'bold', textTransform: 'capitalize' }}
            />
            <Typography variant="h5" sx={{ mb: 1 }}>{grievance.title}</Typography>
            <Box sx={{ mb: 3 }}><Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{grievance.description}</Typography></Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="textSecondary">Submitted by: <strong>{grievance.submitted_by?.name || 'N/A'}</strong> ({grievance.submitted_by?.username || 'N/A'})</Typography>
            <Typography variant="body2" color="textSecondary">Submitted on: {format(new Date(grievance.created_at), 'dd MMM yyyy, h:mm a')}</Typography>
            <Typography variant="body2" color="textSecondary">Last Updated: {format(new Date(grievance.updated_at), 'dd MMM yyyy, h:mm a')}</Typography>
            <Typography variant="body2" color="textSecondary">Priority: <strong>{grievance.priority}</strong></Typography>
            {grievance.evidence_image && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>Evidence:</Typography>
                <Button variant="outlined" href={grievance.evidence_image} target="_blank" rel="noopener noreferrer" size="small">View Attached File</Button>
              </Box>
            )}
          </Grid>

          {/* Right Column: Actions & Comments */}
          <Grid item xs={12} md={5}>
             {/* Comments History */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Conversation History</Typography>
              {/* ... (Comments List remains the same) ... */}
               <List sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #ddd', borderRadius: 1, p: 1 }}>
                {grievance.comments && grievance.comments.length > 0 ? (
                  grievance.comments.map((comment, index) => (
                    <React.Fragment key={comment.id}>
                      <ListItem alignItems="flex-start" sx={{ pt: 1, pb: 1 }}>
                        <Avatar sx={{ bgcolor: comment.user?.role === 'student' ? 'secondary.main' : 'primary.main', mr: 2, width: 32, height: 32, fontSize: '0.875rem' }}>
                          {comment.user?.name ? comment.user.name.charAt(0).toUpperCase() : '?'}
                        </Avatar>
                        <ListItemText
                          primary={<strong>{comment.user?.name || 'Unknown User'} ({comment.user?.role?.replace('_', ' ') || 'Unknown Role'})</strong>}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-wrap', display: 'block' }}>
                                {comment.comment_text}
                              </Typography>
                              <Typography component="span" variant="caption" color="text.secondary">
                                {format(new Date(comment.timestamp),'dd MMM yyyy, h:mm a')}
                              </Typography>
                            </>
                          }
                          sx={{ m: 0 }}
                        />
                      </ListItem>
                      {index < grievance.comments.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))
                ) : (
                  <ListItem><ListItemText primary="No comments yet." /></ListItem>
                )}
              </List>
            </Box>

             {/* Add Comment Form (if not resolved) */}
            {!redirectMessage && grievance.status !== 'RESOLVED' && ( // Hide if redirecting
              <Box component="form" onSubmit={handleCommentSubmit} sx={{ mb: 3 }}>
                <Typography variant="h6">Add Your Reply</Typography>
                <TextField
                  label="Type your comment here..."
                  fullWidth multiline rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  sx={{ mb: 1 }}
                  disabled={actionLoading} // Use action loading
                />
                <Button type="submit" variant="contained" fullWidth disabled={actionLoading}>
                  Post Reply
                </Button>
              </Box>
            )}

             {/* Action Error Display */}
            {actionError && (
              <Alert severity="error" sx={{ mb: 3 }}>{actionError}</Alert>
            )}

            {/* Status Update Controls/Message */}
            {renderStatusUpdateControls()}

          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default GrievanceDetailAdmin;