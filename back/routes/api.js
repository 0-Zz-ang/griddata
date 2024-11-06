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

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}


async function getFieldLabel(dataElement) {
  try {
    const apiUrl = `${config.unifierUrl}/ws/rest/service/v1/ds/data-elements`;
    const response = await axios.get(apiUrl, {
      params: { filter: `{"data_element":"${dataElement}"}` },
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.data[0]?.form_label || dataElement; // 라벨이 없으면 필드 이름 반환
  } catch (error) {
    console.error(`Error fetching label for ${dataElement}:`, error.message);
    return dataElement; // 에러 발생 시 필드 이름 그대로 반환
  }
}

// 필드 이름에 따른 라벨을 가져오는 라우터
router.post('/getFieldLabels', async (req, res) => {
  const { dataElements } = req.body; // 클라이언트에서 필드 이름 목록을 받음

  try {
    // 각 필드 이름에 대해 라벨을 병렬로 가져오기
    const labelPromises = dataElements.map(element => getFieldLabel(element));
    const labels = await Promise.all(labelPromises);

    // 필드 이름과 라벨을 키-값 쌍으로 매핑
    const labelMap = dataElements.reduce((acc, field, index) => {
      acc[field] = labels[index];
      return acc;
    }, {});

    res.status(200).json({ labels: labelMap });
  } catch (error) {
    console.error('필드 라벨 가져오기 오류:', error);
    res.status(500).json({ message: '필드 라벨을 가져오는 중 오류가 발생했습니다.' });
  }
});





// Grid Data에 새로 입력된 데이터(로컬스토리지에 저장된 데이터)를 유니파이어에 전송 
router.post('/sendData', async (req, res) => {
  const { options, data } = req.body;
  const recordsWithoutRecordNo = data.filter(record => !record.record_no);
  const recordsWithRecordNo = data.filter(record => record.record_no);
  const recordsWithLineAutoSeq = data.filter(record => record._bp_lineitems && record._bp_lineitems.some(item => item.LineAutoSeq));
  const maxRetries = 3;

  const sendRequest = async (requestFn, requestData) => {
    return requestFn(requestData);
  };

  const retryRequests = async (promises, retriesLeft) => {
    const results = await Promise.allSettled(promises);

    const failedRequests = results
      .map((result, index) => (result.status === 'rejected' ? promises[index] : null))
      .filter(Boolean);

    if (failedRequests.length > 0 && retriesLeft > 0) {
      console.log(`재시도 남은 횟수: ${retriesLeft}, 실패한 요청 개수: ${failedRequests.length}`);
      return retryRequests(failedRequests, retriesLeft - 1);
    } else if (failedRequests.length > 0) {
      throw new Error('일부 요청이 여러 번 재시도 후에도 실패했습니다.');
    }

    return results;
  };

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

      return sendRequest(async (data) => {
        return axios.post(
          options.projectNumber === "0" ?
          `${config.unifierUrl}/ws/rest/service/v1/bp/record` :
          `${config.unifierUrl}/ws/rest/service/v1/bp/record/${options.projectNumber}`,
          data,
          { headers: { 'Authorization': `Bearer ${config.token}`, 'Content-Type': 'application/json' } }
        );
      }, requestBody);
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
      
      return sendRequest(async (data) => {
        return axios.put(
          options.projectNumber === "0" ?
          `${config.unifierUrl}/ws/rest/service/v1/bp/record` :
          `${config.unifierUrl}/ws/rest/service/v1/bp/record/${options.projectNumber}`,
          data,
          { headers: { 'Authorization': `Bearer ${config.token}`, 'Content-Type': 'application/json' } }
        );
      }, requestBody);
    });


    // 기존 라인아이템 수정 
      const updateLinesChunks = createChunksBySize(recordsWithLineAutoSeq);
      
      const updateLineItemPromises = updateLinesChunks.map(chunk => {
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
    
        return sendRequest(async (data) => {
          return axios.put(
            options.projectNumber === "0" ?
            `${config.unifierUrl}/ws/rest/service/v1/bp/record` :
            `${config.unifierUrl}/ws/rest/service/v1/bp/record/${options.projectNumber}`,
            data,
            { headers: { 'Authorization': `Bearer ${config.token}`, 'Content-Type': 'application/json' } }
          );
        }, requestBody);
      });
      
    const results = await retryRequests([...newRecordPromises, ...updateRecordPromises, ...updateLineItemPromises], maxRetries);

    // 응답 처리
    const recordStatusList = results.map((result) => {
      if (result.status === 'fulfilled') {
        const status = result.value.data?.message[0]?._record_status || '알 수 없음';
        console.log('Unifier 성공 응답:', result.value.data);
        return { status, success: true, data: result.value.data };
      } else {
        console.error('Unifier 오류 응답:', result.reason);
        return { status: '실패', success: false, error: result.reason.message, details: result.reason };
      }
    });

    // 성공과 실패 결과 구분
    const failedRecords = recordStatusList.filter((item) => !item.success);
    const successfulRecords = recordStatusList.filter((item) => item.success);

    if (failedRecords.length === 0) {
      console.log('모든 레코드 및 라인아이템 처리 성공');
      res.status(200).json({
        message: '모든 레코드와 라인아이템이 성공적으로 처리되었습니다.',
        successfulRecords: successfulRecords.map((item) => item.data),
      });
    } else {
      console.error('일부 레코드 처리 중 오류 발생:', failedRecords);
      res.status(400).json({
        message: '일부 레코드 처리 중 오류 발생',
        failedRecords: failedRecords.map((item) => ({
          error: item.error,
          details: item.details.response?.data || item.details,
        })),
        successfulRecords: successfulRecords.map((item) => item.data),
      });
    }
  } catch (error) {
    console.error('Unifier API 호출 중 치명적 오류 발생:', error);
    res.status(500).json({
      message: 'Unifier API 호출 중 치명적 오류가 발생했습니다.',
      error: error.message,
      details: error.response?.data || error,
    });
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

module.exports = router;
