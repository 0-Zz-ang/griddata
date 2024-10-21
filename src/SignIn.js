import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import ForgotPassword from './components/ForgotPassword';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { GoogleIcon, FacebookIcon } from './components/CustomIcons';
import axios from 'axios';
import Divider from '@mui/material/Divider';
import AppTheme from './shared-theme/AppTheme'
import ColorModeSelect from './shared-theme/ColorModeSelect';
 
const api_url=process.env.REACT_APP_LOCAL_URL;

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  minHeight: '100vh',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    }),
  },
}));

export default function SignIn(props) {
  const [formData, setFormData] = React.useState({
    id: '',
    password: '',
  });

  const [idError, setIdError] = React.useState(false);
  const [idErrorMessage, setIdErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [generalError, setGeneralError] = React.useState(''); // 일반적인 에러 메시지 상태 추가
  const [open, setOpen] = React.useState(false);

  const idInputRef = React.useRef();
  const passwordInputRef = React.useRef();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  

  const validateInputs = () => {
    let isValid = true;

    
    if (!formData.id) {
      setIdError(true);
      setIdErrorMessage('아이디를 입력해주세요.');
      idInputRef.current.focus();
      isValid = false;
    } else {
      setIdError(false);
      setIdErrorMessage('');
    }

    if (!formData.password) {
      setPasswordError(true);
      setPasswordErrorMessage('비밀번호를 입력해주세요.');
      passwordInputRef.current.focus();
      isValid = false;
    } else if (formData.password.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('비밀번호는 6자리 이상이어야 합니다.');
      setFormData({
        ...formData,
        password: '', 
      });
      passwordInputRef.current.focus();
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    return isValid;
  };    

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateInputs()) return;

    try {
      const response = await axios.post(`${api_url}/api/login`, {
        id: formData.id,
        password: formData.password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        alert('로그인 성공!');
        console.log('저장할 정보:', response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboard');
      } else {
        setGeneralError(response.data.message);
      }
    } catch (error) {
      if(error.response.status === 401){
        setGeneralError('비밀번호가 일치하지 않습니다.');
        setFormData({
          ...formData,
          password: '', 
        });
        passwordInputRef.current.focus();
        
      }else if (error.response.status === 404){
      setGeneralError('존재하지 않는 사용자입니다.');
      setFormData({
        ...formData,
        password: '', 
        id: '',
      });
      idInputRef.current.focus();
      } else {
        setGeneralError('로그인실패 : 서버와 연결할 수 없습니다. 다시 시도해주세요.');
      }}
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setIdError(false);
    setIdErrorMessage('');
    setPasswordError(false);
    setPasswordErrorMessage('');
    setGeneralError('');

  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme/>
      <SignInContainer direction="column" justifyContent="space-between">
      <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
        <Card variant="outlined">
        <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
          >
            Sign in
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ display: 'flex', flexDirection: 'column', width:'100%',gap: 2 }}
          >
            <FormControl>
              <FormLabel htmlFor="id">아이디</FormLabel>
              <TextField
                error={idError}
                helperText={idErrorMessage}
                id="id"
                type="text"
                name="id"
                placeholder="ID"
                autoComplete="id"
                autoFocus
                required
                fullWidth
                inputRef={idInputRef}
                value={formData.id}
                onChange={handleChange}
                variant="outlined"
                
              />
            </FormControl>
            <FormControl>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <FormLabel htmlFor="password">Password</FormLabel>
                <Link
                  component="button"
                  type="button"
                  onClick={handleClickOpen}
                  variant="body2"
                  sx={{ alignSelf: 'baseline' }}
                >
                  비밀번호를 잊으셨나요?
                </Link>
              </Box>
              <TextField
                error={passwordError}
                helperText={passwordErrorMessage}
                id="password"
                type="password"
                name="password"
                placeholder="••••••"
                autoComplete="current-password"
                required
                fullWidth
                inputRef={passwordInputRef}
                value={formData.password}
                onChange={handleChange}
                variant="outlined"
              />
            </FormControl>
            {generalError && (
              <Typography color="error" align="center">
                {generalError}
              </Typography>
            )}
            <ForgotPassword open={open} handleClose={handleClose} />
            <Button type="submit" fullWidth variant="contained">
              Sign in
            </Button>
            <Typography sx={{ textAlign: 'center' }}>
            아직 회원이 아니신가요?{' '}
              <Link component={RouterLink} to="/sign-up" variant="body2">
                Sign up
              </Link>
            </Typography>
          </Box>
          <Divider>or</Divider>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => alert('Sign in with Google')}
              startIcon={<GoogleIcon />}
            >
              Sign in with Google
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => alert('Sign in with Facebook')}
              startIcon={<FacebookIcon />}
            >
              Sign in with Facebook
            </Button>
          </Box>
        </Card>
      </SignInContainer>
    </AppTheme>
  );
}