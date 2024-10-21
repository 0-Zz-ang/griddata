const express = require('express');
const router = express.Router();
const axios = require('axios');
const nodemailer = require('nodemailer');
const config = require('../config');



// 로그인
router.post('/login', async (req, res) => {
  console.log('로그인 도착');
  const logDate = new Date().toISOString();
  const { id, password } = req.body;
  try {
    const checkResponse = await axios.post(`${config.unifierUrl}/ws/rest/service/v1/bp/records`, {
      "bpname" : "member(Seo0)",
      "lineitem" : "yes",
      "record_fields" : "cezUserID;cezUserPW;cesusername;record_no;cezUserEmail",
      "filter_criteria" : {
          "filter" :[
              {
                  "field" : "cezUserID",
                  "value" : id,
                  "condition_type" : "eq"
              }]}
    }, {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (checkResponse.data && checkResponse.data.data && checkResponse.data.data.length > 0) {
      const user = checkResponse.data.data[0];
      const storedPassword = user.cezUserPW;

      if (password === storedPassword) {
        console.log(user.record_no, user.cezUserID, user.cezUserPW, logDate);
        await axios.put(`${config.unifierUrl}/ws/rest/service/v1/bp/record`, {
          options: {
            bpname: "member(Seo0)",
            LineItemIdentifier: "LineAutoSeq"
          },
          data: [{
            _bp_lineitems: [{
              tab_id: 0,
              uuu_tab_id: "Log",
              cezLogType: "로그인 성공",
              short_desc: "로그인 성공",
              cezLogDate: logDate,
              LineAutoSeq: "99999"
            }],
            record_no: user.record_no
          }]
        }, {
          headers: {
            'Authorization': `Bearer ${config.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const logTypes = user._bp_lineitems.map(item => item.cezLogType);
        const loginSuccess = logTypes.filter(log => log ==="로그인 성공").length;
        const loginFail = logTypes.filter(log => log ==="로그인 실패").length;

        return res.status(200).json({
          message: '로그인 성공!',
          user: {
            id: user.cezUserID,
            name: user.cesusername,
            email: user.cezUserEmail,
            record_no : user.record_no,
            CountLoginSuccess : loginSuccess,
            CountLoginFail : loginFail
          }
        });
        
      } else {
        console.log("비밀번호 불일치");
        await axios.put(`${config.unifierUrl}/ws/rest/service/v1/bp/record`, {
          options: {
            bpname: "member(Seo0)",
            LineItemIdentifier: "LineAutoSeq"
          },
          data: [{
            _bp_lineitems: [{
              tab_id: 0,
              uuu_tab_id: "Log",
              cezLogType: "로그인 실패",
              short_desc: "비밀번호 불일치",
              cezLogDate: logDate,
              LineAutoSeq: "99999"
            }],
            record_no: user.record_no
          }]
        }, {
          headers: {
            'Authorization': `Bearer ${config.token}`,
            'Content-Type': 'application/json'
          }
        });
        console.error("비밀번호 불일치");
        return res.status(401).json({ message: '로그인 실패: 비밀번호가 일치하지 않습니다.' });
      }
    } else {
      console.error("존재하지 않는 사용자");
      return res.status(404).json({ message: '존재하지 않는 사용자입니다.' });
    }
  } catch (error) {
    console.error("유니파이어 API 호출 오류:", error.message, error.response ? error.response.data : '');
    return res.status(500).json({ message: '서버 오류: 유니파이어 API 호출 중 문제가 발생했습니다.', error: error.message });
  }
});


// 회원가입
router.post('/signup', async (req, res) => {
  console.log('회원가입 라우터 호출');
  const logDate = new Date().toISOString();
  const { id, name, password, email } = req.body;
  console.log(id,name,password,email, logDate);
  
  try {
    const signupBody = {
      "options" : {
        "bpname" : "member(Seo0)"
      },
      "data" : [{
        "cezUserID" : id,
        "cezUserPW" : password,
        "cesusername" : name,
        "cezUserEmail" : email,
        "_bp_lineitems" :[{
          "uuu_tab_id" : "Log",
          "cezLogType" : "회원가입",
          "short_desc" : "1",
          "cezLogDate" : logDate
        }]
      }]
    };
    console.log("전송할 데이터 :", JSON.stringify(signupBody, null,2));

    const signUp = await axios.post(`${config.unifierUrl}/ws/rest/service/v1/bp/record`, signupBody, {
      headers :{
        'Authorization' : `Bearer ${config.token}`,
        'Content-Type' : `application/json`
      }
    });

    if (signUp.status === 200) {
      return res.status(200).json({ message: '회원가입 성공!' });
    } else {
      return res.status(400).json({ message: '회원가입 실패. 다시 시도해 주세요.' });
    }
  } catch (error) {
    if (error.response) {
      console.error("응답 오류 상태 코드:", error.response.status);
      console.error("응답 데이터:", error.response.data);
    } else if (error.request) {
      console.error("요청이 전송되었으나 응답이 없습니다:", error.request);
    } else {
      console.error("오류 메시지:", error.message);
    }
    console.error("전체 오류 객체:", error);
    return res.status(500).json({ message: '유니파이어 API 호출 중 오류가 발생했습니다.', error: error.message });
  }
});

//중복검사 
router.post('/checkId', async (req, res) => {
  console.log("아이디 이메일 중복검사 라우터 도착 ");
  const { id, email } = req.body; 
  try {
    console.log("아이디 : ",id);
    console.log("이메일 : ", email);
    const checkBody = {
      "bpname" : "member(Seo0)",
      "lineitem" : "no",
      "filter_criteria" : {
          "join" : "OR",
          "filter" :[
              {
                  "field" : "cezUserID",
                  "value" : id,
                  "condition_type" : "eq"
              },
              {
                  "field" : "cezUserEmail",
                  "value" : email,
                  "condition_type" : "eq"
              }
          ]
      }};

    const check = await axios.post(`${config.unifierUrl}/ws/rest/service/v1/bp/records`, checkBody,
    {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type' : `application/json`
      }
    });

    if (check.data && check.data.data && check.data.data.length > 0) {
      const existingRecords = check.data.data;
      if (existingRecords.some(record => record.cezUserID === id)) {
        return res.status(409).json({ errorType: 'id', message: '아이디가 이미 존재합니다.' });
      }
      if (existingRecords.some(record => record.cezUserEmail === email)) {
        return res.status(409).json({ errorType: 'email', message: '이메일이 이미 존재합니다.' });
      }
    } else {
      return res.status(200).json({ message: '사용 가능한 아이디와 이메일입니다.' });
    }
  } catch (error) {
    console.error("유니파이어 API 호출 오류:", error.message);
    return res.status(500).json({ message: '서버 오류: 유니파이어 API 호출 중 문제가 발생했습니다.', error: error.message });
  }
});

// 로그아웃
router.post('/logout', async (req, res) => {
  const {record_no} = req.body;
  console.log("로그아웃 도착 ",record_no);
  const logDate = new Date().toISOString();
  try {
        await axios.put(`${config.unifierUrl}/ws/rest/service/v1/bp/record`, {
          options: {
            bpname: "member(Seo0)",
            LineItemIdentifier: "LineAutoSeq"
          },
          data: [{
            _bp_lineitems: [{
              tab_id: 0,
              uuu_tab_id: "Log",
              cezLogType: "로그아웃",
              short_desc: "로그아웃",
              cezLogDate: logDate,
              LineAutoSeq: "99999"
            }],
            record_no: record_no
          }]
        }, {
          headers: {
            'Authorization': `Bearer ${config.token}`,
            'Content-Type': 'application/json'
          }
        });
        res.status(200).json({ message: '로그아웃 성공' });

  } catch (error) {
    console.error("유니파이어 API 호출 오류:", error.message, error.response ? error.response.data : '');
    return res.status(500).json({ message: '서버 오류: 유니파이어 API 호출 중 문제가 발생했습니다.', error: error.message });
  }
});


// 비밀번호 변경 이메일 전송 
router.post('/forgotpassword', async (req,res) => {
  const { id, email, mail_url } = req.body;
  console.log("비밀번호 변경 이메일 전송 라우터 도착")
  try {
    const checkId = await axios.post(`${config.unifierUrl}/ws/rest/service/v1/bp/records`, {
      "bpname" : "member(Seo0)",
      "lineitem" : "no",
      "record_fields" : "cezUserID;record_no",
      "filter_criteria" : {
          "filter" :[
              {
                  "field" : "cezUserID",
                  "value" : id,
                  "condition_type" : "eq"
              }]}
    }, {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (checkId.data && checkId.data.data && checkId.data.data.length > 0) {
      const user = checkId.data.data[0];
      const record_no = user.record_no;
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 's1998319@gmail.com', 
          pass: 'hjiq oowf rspx qbas', 
        },
      });
      
      const mailOptions = {
        from: 's1998319@gmail.com',
        to: email,
        subject: '비밀번호 재설정 링크',
        html: `
        <p>안녕하세요, ${id}님.</p>
        <p>비밀번호를 재설정하려면 아래의 링크를 클릭하세요:</p>
        <p><a href="${mail_url}/reset-password/${id}?record_no=${record_no}">비밀번호 재설정</a></p>
      `,
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          return res.status(500).send('이메일 전송 중 오류가 발생했습니다.');
        }
        res.status(200).send('비밀번호 재설정 링크가 이메일로 전송되었습니다.');
      });
    } else {
      res.status(404).send('입력된 정보와 일치하는 사용자가 없습니다.');
    }
  } catch (error) {
    console.error('Error verifying user with Unifier API:', error);
    res.status(500).send('서버 오류가 발생했습니다.');
  }
});

// 비밀번호 업데이트 
router.post('/updatePw', async(req,res) => {
  console.log('업데이트 라우터 도착');
  const {record_no, password } = req.body;
  const logDate = new Date().toISOString();
  try {
     await axios.put(`${config.unifierUrl}/ws/rest/service/v1/bp/record`, {
      "options": {
        "bpname": "member(Seo0)",
        "LineItemIdentifier": "LineAutoSeq"
    },

    "data": [{
        "cezUserPW" : password,
        "_bp_lineitems" : [{
          "tab_id" :0,
          "uuu_tab_id" : "Log",
          "cezLogType" : "비밀번호 변경",
          "short_desc" : "비밀번호 변경",
          "cezLogDate" : logDate,
          "LineAutoSeq" : "99999"
       }],
       "record_no" : record_no
        }]
      },{
        headers: {
            'Authorization': `Bearer ${config.token}`,
            'Content-Type': 'application/json'
        }
      });
      res.status(200).json({message : '비밀번호 재설정 완료'});
  } catch (error) {
    console.error('Error updating password with Unifier API:', error);
    res.status(500).json({ message: '비밀번호 재설정 중 서버 오류가 발생했습니다.' });
  }
})

module.exports = router;
