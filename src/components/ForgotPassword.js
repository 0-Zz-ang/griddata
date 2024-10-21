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

function ForgotPassword({ open, handleClose }) {
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
        mail_url
      });
      if (response.status === 200) {
        alert('비밀번호 재설정 링크가 이메일로 전송되었습니다.');
      } else {
        alert('요청 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('Error submitting forgot password request:', error);
      alert('서버 오류가 발생했습니다. 다시 시도해주세요.');
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
      <DialogTitle>비밀번호 재설정</DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
      >
        <DialogContentText>
          아이디와 비밀번호 재설정을 위한 링크를 전송받을 메일을 입력해주세요.
        </DialogContentText>
        <OutlinedInput
          autoFocus
          required
          margin="dense"
          id="id"
          name="id"
          label="ID"
          placeholder="ID"
          type="text"
          fullWidth
        />
        <OutlinedInput
          required
          margin="dense"
          id="email"
          name="email"
          label="Email address"
          placeholder="Email address"
          type="email"
          fullWidth
        />
      </DialogContent>
      <DialogActions sx={{ pb: 3, px: 3 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" type="submit">
          Continue
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
