import * as React from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import CssBaseline from '@mui/material/CssBaseline';
import AppTheme from './shared-theme/AppTheme';
import { useState, useEffect} from 'react';

const api_url=process.env.REACT_APP_LOCAL_URL;

Chart.register(...registerables);

export default function Dashboard(props) {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null); 

  useEffect(() => {

    const user = localStorage.getItem('user');
    if (user) {
      setUserData(JSON.parse(user));
    } else {
      navigate('/signin');
    }
  }, [navigate]);

  const handleLogout = async () => {
    if (!userData) {
      console.error('로그아웃 시도 중 사용자 데이터가 존재하지 않습니다.');
      return;
    }
    try {
      console.log('로그아웃 요청 데이터:', userData);

      const response = await axios.post(`${api_url}/api/logout`, {
        record_no: userData.record_no
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        console.log('로그아웃 성공, 응답:', response.data);
        alert('로그아웃 성공');
     
        localStorage.removeItem('user');
        setUserData(null); 

        
        setTimeout(() => {
          navigate('/');
          console.log('초기 페이지로 이동 중...');
        }, 100);
      } else {
        console.error('로그아웃 실패, 상태 코드:', response.status);
      }
    } catch (error) {
      console.error('로그아웃 로그 저장 중 오류 발생:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };

  // 차트 데이터
  const data = {
    labels: ['로그인 성공', '로그인 실패'],
    datasets: [
      {
        label: '로그인 횟수',
        data: [userData?.CountLoginSuccess || 0, userData?.CountLoginFail || 0],
        backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)'],
        borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
        borderWidth: 1,
      },
    ],
  };

  // 차트 옵션
  const options = {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (!userData) {
    return null; 
  }

  return (
    <AppTheme {...props}>
    <CssBaseline enableColorScheme />
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 8,
        gap: 4,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: 6,
        }}
      >
        <Card sx={{ maxWidth: 400, width: '100%', boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              내 정보
            </Typography>
            <Typography variant="h6" gutterBottom>
              이름: {userData.name}
            </Typography>
            <Typography variant="h6" gutterBottom>
              이메일: {userData.email}
            </Typography>
          </CardContent>
        </Card>
        <Box sx={{ maxWidth: '600px' }}>
          <Typography variant="h6" gutterBottom>
            로그인 통계
          </Typography>
          <Bar data={data} options={options} />
        </Box>
      </Box>
      <Button variant="contained" color="secondary" onClick={handleLogout} sx={{ mt: 3 }}>
        로그아웃
      </Button>
    </Box>
    </AppTheme>
  );
}

