import * as React from 'react';
import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import axios from 'axios';

const api_url=process.env.REACT_APP_LOCAL_URL;

function ResetPassword() {
  const { userId } = useParams(); 
  const [searchParams] = useSearchParams();
  const record_no = searchParams.get('record_no');
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 6) {
      setError('비밀번호는 6자리 이상으로 입력해야 합니다.');
      setPassword('');
      setConfirmPassword('');
      return;
    }
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      const response = await axios.post(`${api_url}/api/updatePw`, {
        userId,
        password,
        record_no
      });
      if (response.status === 200) {
        alert('비밀번호가 성공적으로 재설정되었습니다.');
        navigate('/signin'); 
      } else {
        setError('비밀번호 재설정 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('서버 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Typography component="h1" variant="h5" sx={{ mt: 4 }}>
        {userId} 님의 비밀번호 재설정
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          name="password"
          label="새 비밀번호"
          type="password"
          id="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          name="confirmPassword"
          label="비밀번호 확인"
          type="password"
          id="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          sx={{ mt: 3, mb: 2 }}
        >
          비밀번호 재설정
        </Button>
      </form>
    </Container>
  );
}

export default ResetPassword;
