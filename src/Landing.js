import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';


function Landing() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/signin');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      }}
    >
      
      <Typography variant="h2" gutterBottom>
        환영합니다!
      </Typography>
      <Typography variant="h6" gutterBottom>
        로그인하기 버튼을 눌러 로그인하세요.
      </Typography>
      <Button variant="contained" color="primary" onClick={handleLogin}>
        로그인하기
      </Button>
    </Box>
    
  );
}

export default Landing;
