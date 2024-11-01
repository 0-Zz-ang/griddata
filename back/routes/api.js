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
      "bpname" : "member(seoyoung)2",
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
    
        let loginSuccessDays = new Array(7).fill(0);
        // 첫 로그인 
        if (Array.isArray(user._bp_lineitems)) {
          user._bp_lineitems.forEach(item => {
            if (item.cezLogType === '로그인 성공') {
              const prevLogDate = new Date(item.cezLogDate);
              const dayIndex = prevLogDate.getDay(); 
              loginSuccessDays[dayIndex] += 1;
            }
          });
        }
    
        const todayDayIndex = new Date().getDay();
        loginSuccessDays[todayDayIndex] += 1;
    
        console.log(loginSuccessDays);
    
        // 로그인 성공 기록 업데이트
        await axios.put(`${config.unifierUrl}/ws/rest/service/v1/bp/record`, {
          options: {
            bpname: "member(seoyoung)2",
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
    
        // 로그 데이터에서 성공과 실패 기록 계산
        const logTypes = Array.isArray(user._bp_lineitems) ? user._bp_lineitems.map(item => item.cezLogType) : [];
        const loginSuccess = logTypes.filter(log => log === "로그인 성공").length + 1;  
        const loginFail = logTypes.filter(log => log === "로그인 실패").length;
    
        return res.status(200).json({
          message: '로그인 성공!',
          user: {
            id: user.cezUserID,
            name: user.cesusername,
            email: user.cezUserEmail,
            record_no: user.record_no,
            CountLoginSuccess: loginSuccess,  
            CountLoginFail: loginFail,
            logDate: logDate,
            loginSuccessDays: loginSuccessDays
          }
        });
      } else {
        console.log("비밀번호 불일치");

    
        // 비밀번호 불일치 로그 저장
        await axios.put(`${config.unifierUrl}/ws/rest/service/v1/bp/record`, {
          options: {
            bpname: "member(seoyoung)2",
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
        "bpname" : "member(seoyoung)2"
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
      "bpname" : "member(seoyoung)2",
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
            bpname: "member(seoyoung)2",
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


router.post('/forgotpassword', async (req,res) => {
  const { id, email, mail_url } = req.body;
  console.log("비밀번호 변경 이메일 전송 라우터 도착")
  try {
    const checkId = await axios.post(`${config.unifierUrl}/ws/rest/service/v1/bp/records`, {
      "bpname" : "member(seoyoung)2",
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
        "bpname": "member(seoyoung)2",
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
});

// 프로젝트 목록 조회
router.get('/getProjects', async (req, res) => {
  try {
    const response = await axios.get(`${config.unifierUrl}/ws/rest/service/v1/admin/projectshell`,{
       headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      }
    });
    const projectData = response.data.data.map(({ projectname, projectnumber }) => ({
      project_name: projectname,
      project_number: projectnumber,
    }))
    res.status(200).json(projectData);
    console.log(projectData.project_number);
  } catch (error) {
    console.error('프로젝트 목록 조회 오류:', error);
    res.status(500).json({ message: '프로젝트 목록을 가져오는 중 오류가 발생했습니다.' });
  }
});


// BP 목록 조회 
router.get('/getBpList', async (req, res) => {
  const { project_number, project_name } = req.query;  // 쿼리 파라미터로 프로젝트 정보 수신
  console.log('Project Name:', project_name);
  console.log('Project Number:', project_number);

  try {
    let response;
    if (project_number==='0') {
      response = await axios.get(`${config.unifierUrl}/ws/rest/service/v1/admin/bps`, {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json'
        }
      });
    } else {
      // project_number가 있을 때 기존 엔드포인트 호출
      response = await axios.get(`${config.unifierUrl}/ws/rest/service/v1/admin/bps/${project_number}`, {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json'
        }
      });
    }
    const bpData = response.data.data.map(({ bp_name }) => ({
      bpname: bp_name
    }));
    console.log('BP 목록 응답:', response.data);

    console.log(bpData);
    res.status(200).json(bpData);
  } catch (error) {
    console.error('BP 목록 조회 오류:', error);
    res.status(500).json({ message: 'BP 목록을 가져오는 중 오류가 발생했습니다.' });
  }
});

// 그리드 데이터 ⬇️

// bp 데이터 조회 
router.post('/getBpData', async (req, res) => {
  const { bpname,project_number }=req.body;
  try {
    let response;
    const body = {
        "bpname" : bpname,
        "lineitem" : "yes"
    }
    if(project_number==='0')
    {
       response = await axios.post(`${config.unifierUrl}/ws/rest/service/v1/bp/records`, body, {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json'
        }
      });
    }else{
      response = await axios.post(`${config.unifierUrl}/ws/rest/service/v1/bp/records/${project_number}`, body, {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json'
        }
      });
    }

    if (response.data) {
      console.log("bp data 목록 조회 : ", response.data);
      return res.status(200).json(response.data);

    } else {
      return res.status(404).json({ message: 'BP 데이터를 찾을 수 없습니다.' });
    }
  } catch (error) {
    console.error('BP 데이터 가져오기 오류:', error.message);
    return res.status(500).json({ message: '서버 오류: BP 데이터를 가져오는 중 문제가 발생했습니다.', error: error.message });
  }
});

const MAX_CHUNK_SIZE = 1 * 1024 * 1024; // 1MB

function createChunksBySize(data) {
  const chunks = [];
  let currentChunk = [];
  let currentSize = 0;

  data.forEach((record) => {
    // JSON.stringify(record)로 현재 레코드 크기 계산
    const recordSize = Buffer.byteLength(JSON.stringify(record), 'utf8');

    // 현재 레코드를 추가했을 때 청크가 MAX_CHUNK_SIZE를 넘지 않으면 추가
    if (currentSize + recordSize <= MAX_CHUNK_SIZE) {
      currentChunk.push(record);
      currentSize += recordSize;
    } else {
      // 크기를 넘으면 현재 청크를 저장하고 새로운 청크 시작
      chunks.push(currentChunk);
      currentChunk = [record];
      currentSize = recordSize;
    }
  });

  // 마지막 청크가 남아있으면 추가
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

// Grid Data에 새로 입력된 데이터(로컬스토리지에 저장된 데이터)를 유니파이어에 전송 
router.post('/sendData', async (req, res) => {
  const { options, data } = req.body;
  console.log("프로젝트 번호 : ", options.projectNumber);


  const recordsWithoutRecordNo = data.filter(record => !record.record_no);
  const recordsWithRecordNo = data.filter(record => record.record_no);

  try {
    // 신규 레코드 추가 - 청크로 나누기
    const newRecordsChunks = createChunksBySize(recordsWithoutRecordNo);

    const newRecordPromises = newRecordsChunks.map(chunk => {
      const requestBody = {
        options: {
          bpname: options.bpName,
        },
        data: chunk.map(record => ({
          ...record,
          _bp_lineitems: record._bp_lineitems || []
        }))
      };

      return axios.post( 
        options.projectNumber === "0" ?
        `${config.unifierUrl}/ws/rest/service/v1/bp/record` : `${config.unifierUrl}/ws/rest/service/v1/bp/record/${options.projectNumber}`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${config.token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    });

    // 기존 레코드 수정 - 청크로 나누기
    const updateRecordsChunks = createChunksBySize(recordsWithRecordNo);

    const updateRecordPromises = updateRecordsChunks.map(chunk => {
      const requestBody = {
        options: {
          bpname: options.bpName,
          lineitemIdentifier: "LineAutoSeq"
        },
        data: chunk.map(record => ({
          ...record,
          _bp_lineitems: (record._bp_lineitems || []).filter(lineItem => !lineItem.LineAutoSeq) // lineAutoSeq가 없는 라인 아이템만 포함
        }))
      };

      return axios.put(
        options.projectNumber === "0" ?
        `${config.unifierUrl}/ws/rest/service/v1/bp/record` :
        `${config.unifierUrl}/ws/rest/service/v1/bp/record/${options.projectNumber}`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${config.token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    });

    // 모든 요청을 병렬로 처리
    const responses = await Promise.all([...newRecordPromises, ...updateRecordPromises]);

    // 응답 처리
    const recordStatusList = responses.map(response => {
      const status = response.data?.message[0]?._record_status || '알 수 없음';
      console.log('Unifier 응답:', response.data);
      return status;
    });

    // 결과 처리
    const failedRecords = recordStatusList.filter(status => status !== 'success');
    if (failedRecords.length === 0) {
      console.log('모든 레코드 및 라인아이템 처리 성공');
      res.status(200).json({ message: '모든 레코드와 라인아이템이 성공적으로 처리되었습니다.' });
    } else {
      console.error('일부 레코드 처리 중 오류 발생:', failedRecords);
      res.status(400).json({ message: `일부 레코드 처리 중 오류 발생: ${failedRecords.join(', ')}` });
    }

  } catch (error) {
    console.error('Unifier API 호출 중 오류 발생:', error);
    res.status(500).json({ message: 'Unifier API 호출 중 오류가 발생했습니다.' });
  }
});





// 라인아이템 삭제 
router.post("/deleteLineItem", async (req, res) => {
  const { bpName, projectNumber, targetItem, targetRecord } = req.body;

  console.log("전달받은 데이터");
  console.log(
    "bpName:", bpName,
    "projectNumber:", projectNumber,
    "삭제할 번호:", targetItem,
    "레코드:", targetRecord
  );

  try {
    let response;
    const body = {
      options: {
        bpname: bpName,
        LineItemIdentifier: "LineAutoSeq",
      },
      data: [
        {
          _delete_bp_lineitems: targetItem,
          record_no: targetRecord,
        },
      ],
    };

    // 프로젝트번호 0 == company workspace
    if (projectNumber === '0') {
      response = await axios.put(`${config.unifierUrl}/ws/rest/service/v1/bp/record`, body, {
        headers: {
          Authorization: `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
      });
    } else {
      response = await axios.put(`${config.unifierUrl}/ws/rest/service/v1/bp/record/${projectNumber}`, body, {
        headers: {
          Authorization: `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
      });
    }

    
    if (response && response.data) {
      res.status(200).send({ message: "LineItem deleted successfully", data: response.data });
    } else {
    
      res.status(404).json({ message: 'BP 데이터를 찾을 수 없습니다.' });
    }
  } catch (error) {
      console.error('BP 데이터 삭제 중 오류:', error.message);
    
    if (error.response) {
      console.error('서버 응답 오류:', error.response.data);
      return res.status(error.response.status || 500).json({
        message: 'BP 데이터를 삭제하는 중 오류가 발생했습니다.',
        error: error.response.data,
      });
    }

    return res.status(500).json({
      message: '서버 오류: BP 데이터를 삭제하는 중 문제가 발생했습니다.',
      error: error.message,
    });
  }
});


router.post("/addLineItem", async (req, res) => {
  const { bpName, projectNumber, recordNo, lineItemData } = req.body;

  try {
    const response = await axios.put(`${config.unifierUrl}/ws/rest/service/v1/bp/record${projectNumber === '0' ? '' : `/${projectNumber}`}`, {
      options: {
        bpname: bpName,
        LineItemIdentifier: "LineAutoSeq",
      },
      data: [
        {
          record_no: recordNo,
          _bp_lineitems: [
            {
              ...lineItemData,  // 추가할 라인아이템의 데이터
              LineAutoSeq: "자동생성",  // 필요한 경우 자동생성된 시퀀스 값 사용
            },
          ],
        },
      ],
    }, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
    });

    res.status(200).json({ message: "라인아이템 추가 성공", data: response.data });
  } catch (error) {
    console.error("라인아이템 추가 오류:", error.message);
    res.status(500).json({ message: "라인아이템 추가 중 오류가 발생했습니다.", error: error.message });
  }
});

module.exports = router;
