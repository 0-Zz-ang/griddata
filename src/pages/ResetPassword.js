import * as React from 'react';
import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const api_url=process.env.REACT_APP_LOCAL_URL;

function ResetPassword() {

  const { t } = useTranslation();
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
      setError(t('resetPassword.passwordMinLength'));
      setPassword('');
      setConfirmPassword('');
      return;
    }
    if (password !== confirmPassword) {
      setError(t('resetPassword.passwordMismatch'));
      return;
    }

    try {
      const response = await axios.post(`${api_url}/api/updatePw`, {
        userId,
        password,
        record_no
      });
      if (response.status === 200) {
        alert(t('resetPassword.successMessage'));
        navigate('/signin'); 
      } else {
        setError(t('resetPassword.errorMessage'));
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setError(t('errors.serverError'));
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Typography component="h1" variant="h5" sx={{ mt: 4 }}>
      {t('resetPassword.title', { userId })}
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          name="password"
          label={t('resetPassword.newPasswordLabel')}
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
          label={t('resetPassword.confirmPasswordLabel')}
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
          {t('resetPassword.submitButton')}
        </Button>
      </form>
    </Container>
  );
}

export default ResetPassword;
