import * as React from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import OutlinedInput from '@mui/material/OutlinedInput';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useRecoilValue } from 'recoil';
import { languageState } from '../recoil/atoms';

function ForgotPassword({ open, handleClose }) {
  const currentLang = useRecoilValue(languageState);
  const { t } = useTranslation();
  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const id = formData.get('id');
    const email = formData.get('email');

    const api_url=process.env.REACT_APP_LOCAL_URL;
    const mail_url = window.location.origin;
    try {
      const response = await axios.post(`${api_url}/api/forgotpassword`, {
        id,
        email,
        mail_url,
        lang: currentLang
      });
      if (response.status === 200) {
        alert(t('forgotPassword.successMessage'));
      } else {
        alert(t('forgotPassword.errorMessage'));
      }
    } catch (error) {
      console.error('Error submitting forgot password request:', error);
      alert(t('errors.serverError'));
    }
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit,
      }}
    >
      <DialogTitle>{t('forgotPassword.title')}</DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
      >
        <DialogContentText>{t('forgotPassword.description')}</DialogContentText>
        <OutlinedInput
          autoFocus
          required
          margin="dense"
          id="id"
          name="id"
          label="ID"
          placeholder={t('general.id')}
          type="text"
          fullWidth
        />
        <OutlinedInput
          required
          margin="dense"
          id="email"
          name="email"
          label="Email address"
          placeholder={t('general.email')}
          type="email"
          fullWidth
        />
      </DialogContent>
      <DialogActions sx={{ pb: 3, px: 3 }}>
        <Button onClick={handleClose}>{t('general.cancel')}</Button>
        <Button variant="contained" type="submit">
        {t('general.continue')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ForgotPassword.propTypes = {
  handleClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};

export default ForgotPassword;
