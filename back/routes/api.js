const express = require('express');
const router = express.Router();
const axios = require('axios');
const config = require('../config');


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
  const recordsWithLineAutoSeq = data.filter(record => record._bp_lineitems && record._bp_lineitems.some(item => item.LineAutoSeq));
  console.log("라인 아이템 업데이트 대상:", recordsWithLineAutoSeq);
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

    // 신규 라인아이템 추가 / 기존 레코드 수정   - 청크로 나누기
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

      const updateLinesChunks = createChunksBySize(recordsWithLineAutoSeq);
      
    
      const updateLinePromiise = updateLinesChunks.map(chunk => {
        const requestBody = {
          options: {
            bpname: options.bpName,
            LineItemIdentifier: "LineAutoSeq"
          },
          data: chunk.map(record => ({
            ...record,
            _bp_lineitems: (record._bp_lineitems || []).filter(lineItem => lineItem.LineAutoSeq).map(lineItem => ({
              LineAutoSeq: lineItem.LineAutoSeq, // 기존의 LineAutoSeq 필드를 유지
              ...lineItem
            }))
          }))
        };
        console.log("라인 아이템 업데이트 요청 바디:", JSON.stringify(requestBody, null, 2));
    
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
    const responses = await Promise.all([...newRecordPromises, ...updateLinePromiise, ...updateRecordPromises]);

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
