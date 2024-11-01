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
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import AppTheme from '../shared-theme/AppTheme';
import ColorModeSelect from '../shared-theme/ColorModeSelect';
import { useTranslation } from 'react-i18next';
const api_url=process.env.REACT_APP_LOCAL_URL;


const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  justifyContent: 'center',
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

const SignUpContainer = styled(Stack)(({ theme }) => ({
  minHeight: '100vh',
  padding: theme.spacing(2),
  justifyContent: 'center',
  alignItems: 'center',
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

export default function SignUp(props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = React.useState({
    id: '',
    name: '',
    password: '',
    email: ''
  });

  const [idMessage, setIdMessage] = React.useState('');
  const [emailMessage, setEmailMessage] = React.useState('');
  const [nameMessage, setNameMessage] = React.useState('');
  const [passwordMessage, setPasswordMessage] = React.useState('');

  const [nameError, setNameError] = React.useState(false);
  const [idError, setIdError] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState(false);
  const [emailError, setEmailError] = React.useState(false);

  const idInputRef = React.useRef();
  const emailInputRef = React.useRef();

  React.useEffect(() => {
    if (idError && idInputRef.current) {
      idInputRef.current.focus();
    } else if (emailError && emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, [idError, emailError]); 

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateInputs = () => {
    let isValid = true;

    if (!formData.id) {
      setIdError(true);
      setIdMessage('아이디를 입력해주세요.');
      isValid = false;
    } else {
      setIdError(false);
      setIdMessage('');
    }

    if (!formData.password) {
      setPasswordError(true);
      setPasswordMessage('비밀번호를 입력해주세요.');
      isValid = false;
    } else if (formData.password.length < 6) {
      setPasswordError(true);
      setPasswordMessage('비밀번호는 6자리 이상이어야 합니다.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordMessage('');
    }

    if (!formData.name) {
      setNameError(true);
      setNameMessage('이름을 입력해주세요.');
      isValid = false;
    } else {
      setNameError(false);
      setNameMessage('');
    }

    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      setEmailError(true);
      setEmailMessage('적절한 이메일 주소를 입력하세요.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailMessage('');
    }

    return isValid;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateInputs()) {
      return;
    }

    try {
      const checkIdAndEmail = await axios.post(`${api_url}/api/checkId`, {
        id: formData.id,
        email: formData.email
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (checkIdAndEmail.status === 200) {
        const response = await axios.post(`${api_url}/api/signup`, formData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 200) {
          alert('회원가입 성공\n로그인 페이지로 이동합니다.');
          navigate('/signin');
        } else {
          console.error('회원가입 실패 : ', response.data.message);
        }
      }
    } catch (error) {
      if (error.response && error.response.status === 409) {
        const { errorType, message } = error.response.data;

        if (errorType === 'id') {
          setIdError(true);
          setIdMessage(message);
          setFormData(prevState => ({
            ...prevState,
            id: ''
          }));
        }

        if (errorType === 'email') {
          setEmailError(true);
          setEmailMessage(message);
          setFormData(prevState => ({
            ...prevState,
            email: ''
          }));
        }
      } else {
        console.error('회원가입 중 오류 발생:', error);
        alert('서버 오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <SignUpContainer direction="column" justifyContent="space-between">
        <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
        <Card variant="outlined">
          <Typography component="h1" variant="h4" sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}>
          {t('sign.signUp')}
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl>
              <FormLabel htmlFor="name">{t('general.name')}</FormLabel>
              <TextField
                autoComplete="name"
                name="name"
                fullWidth
                id="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t('general.name')}
                error={nameError}
                helperText={nameMessage}
              />
            </FormControl>
            <FormControl>
            <FormLabel htmlFor="id">{t('general.id')}</FormLabel>
              <TextField
                fullWidth
                id="id"
                placeholder={t('general.id')}
                name="id"
                autoComplete="id"
                value={formData.id}
                onChange={handleChange}
                variant="outlined"
                error={idError}
                helperText={idMessage}
                inputRef={idInputRef} // idInputRef 연결
              />
            </FormControl>
            <FormControl>
            <FormLabel htmlFor="email">{t('general.email')}</FormLabel>
              <TextField
                fullWidth
                id='email'
                placeholder={t('general.email')}
                name='email'
                value={formData.email}
                onChange={handleChange}
                autoComplete='email'
                variant='outlined'
                error={emailError}
                helperText={emailMessage}
                inputRef={emailInputRef}
              />
            </FormControl>
            <FormControl>
            <FormLabel htmlFor="password">{t('general.password')}</FormLabel>
              <TextField
                fullWidth
                name="password"
                placeholder="••••••"
                type="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                variant="outlined"
                error={passwordError}
                helperText={passwordMessage}
              />
            </FormControl>
            <Button type="submit" fullWidth variant="contained">
            {t('sign.signUp')}
            </Button>
            <Typography sx={{ textAlign: 'center' }}>
            {t('sign.ownAccount')}{' '}
              <Link component={RouterLink} to="/signin" variant="body2">
              {t('sign.signIn')}
              </Link>
            </Typography>
          </Box>
        </Card>
      </SignUpContainer>
    </AppTheme>
  );
}