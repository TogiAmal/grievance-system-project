import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom"; 
import axios from "axios"; 
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Grid,
  Paper,
  Avatar,
  Card,
  CardContent,
  CircularProgress,
  Divider,
} from "@mui/material"; 
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// --- FIX: Moved API instance OUTSIDE the component to be created only once ---
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
});
// ---------------------------------------------------------------------------

// Your working token decoder
const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return null;
  }
};

const Login = () => {
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cellMembers, setCellMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);

  const navigate = useNavigate();

  // Fetch grievance cell members (Dynamic)
  useEffect(() => {
    const fetchCellMembers = async () => {
      try {
        setMembersLoading(true);
        const response = await api.get("/api/users/grievance-cell-members/");
        setCellMembers(response.data);
      } catch (err) {
        console.error("Failed to fetch grievance cell members", err);
      } finally {
        setMembersLoading(false);
      }
    };
    fetchCellMembers();
    // FIX: Dependency array is now empty because 'api' is stable and no longer needs to trigger re-run.
  }, []); 

  // This is your working handleSubmit logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
      
      const response = await axios.post(`${apiUrl}/api/token/`, { 
        username: admissionNumber, 
        password: password 
      });

      const { access, refresh } = response.data;
      
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      
      axios.defaults.headers.common["Authorization"] = `Bearer ${access}`;


      const tokenData = decodeToken(access);
      if (tokenData) {
        const userDetailsResponse = await axios.get(`${apiUrl}/api/users/${tokenData.user_id}/`, {
            headers: { 'Authorization': `Bearer ${access}` }
        });
        
        const user = userDetailsResponse.data;
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('userName', user.name);
        sessionStorage.setItem('justLoggedIn', 'true');
        
        if (user.role === 'admin' || user.role === 'grievance_cell') { 
            navigate('/admin/dashboard'); 
        } else { 
            navigate('/dashboard'); 
        }
      } else { 
        setError('Invalid login token received.'); 
      }
    } catch (err) { 
      setError('Invalid Admission Number or Password.'); 
    } finally {
      setLoading(false);
    }
  };

  // Carousel settings (with arrows for scroll-like control)
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3500,
    arrows: true,
    swipeToSlide: true,
    draggable: true,
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ py: 8 }}>
      <Paper
        elevation={6}
        sx={{
          p: 4,
          borderRadius: 3,
          textAlign: "center",
          bgcolor: "background.paper",
        }}
      >
        {/* Title */}
        <Typography
          component="h1"
          variant="h5"
          sx={{ mb: 2, fontWeight: 600, color: "primary.main" }}
        >
           Login
        </Typography>

        {/* Login Form */}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            margin="normal"
            required
            fullWidth
            id="admission_number"
            label="Admission Number"
            name="admission_number"
            autoComplete="off"
            value={admissionNumber}
            onChange={(e) => setAdmissionNumber(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              mb: 2,
              py: 1.3,
              fontWeight: 600,
              fontSize: "1rem",
              borderRadius: 2,
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Login"}
          </Button>

          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link
                to="/request-password-reset"
                style={{
                  textDecoration: "none",
                  color: "#3949ab",
                  fontWeight: 500,
                }}
              >
                Forgot password?
              </Link>
            </Grid>
          </Grid>
        </Box>

        {/* View Grievance Cell Button */}
        <Button
          variant="outlined"
          color="primary"
          sx={{ mt: 4, borderRadius: 2 }}
          onClick={() => setShowMembers(!showMembers)}
        >
          {showMembers ? "Hide Grievance Cell" : "View Grievance Cell"}
        </Button>

        {/* Grievance Cell Members Section */}
        {showMembers && (
          <Box sx={{ mt: 5 }}>
            <Typography
              component="h2"
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 600,
                color: "text.primary",
              }}
            >
              Grievance Cell Members
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {membersLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
                <CircularProgress />
              </Box>
            ) : cellMembers.length > 0 ? (
              <Slider {...sliderSettings}>
                {cellMembers.map((member) => (
                  <Box key={member.id} sx={{ px: 2 }}>
                    <Card
                      sx={{
                        textAlign: "center",
                        p: 2,
                        borderRadius: 3,
                        boxShadow: 2,
                      }}
                    >
                      <Avatar
                        src={member.profile_image}
                        sx={{
                          width: 90,
                          height: 90,
                          margin: "auto",
                          mb: 1.5,
                        }}
                      />
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {member.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {member.designation}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          {member.phone_number}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                ))}
              </Slider>
            ) : (
              <Typography>No grievance cell members available.</Typography>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Login;