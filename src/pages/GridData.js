import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { DataGridPro, useGridApiRef } from "@mui/x-data-grid-pro";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from "@mui/material";
import * as XLSX from "xlsx";
import { v4 as uuidv4 } from "uuid";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useTranslation } from "react-i18next";
import AddIcon from "@mui/icons-material/Add";
import UploadIcon from "@mui/icons-material/Upload";
import DownloadIcon from "@mui/icons-material/Download";

const api_url = process.env.REACT_APP_LOCAL_URL;

function GridData() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    selectedBp: initialSelectedBp,
    selectedProjectNumber: initialSelectedProjectNumber,
  } = location.state || {};
  const [selectedRow, setSelectedRow] = useState(null); // 모달에 표시할 선택된 행
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 상태

  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [projects, setProjects] = useState([]);
  const [bps, setBps] = useState([]);
  const [selectedProject, setSelectedProject] = useState(
    initialSelectedProjectNumber || ""
  );
  const [selectedBp, setSelectedBp] = useState(initialSelectedBp || "");
  const [existingRecords, setExistingRecords] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [isDataSaved, setIsDataSaved] = useState(false);
  const [isEditable, setIsEditable] = useState(true);
  const [isSaveMode, setIsSaveMode] = useState(true); // 저장 모드와 수정 모드 전환
  const [lineItemColumns, setLineItemColumns] = useState([]);
  const [globalLineItemColumns, setGlobalLineItemColumns] = useState([]);
    const handleOpenModal = (row) => {
    setSelectedRow(row); // 선택된 행을 설정
    setIsModalOpen(true); // 모달 열기
  };

  const handleCloseModal = () => {
    setIsModalOpen(false); // 모달 닫기
  };

  const apiRef = useGridApiRef();

  const handleAddLineItem = (parentRowId) => {
    setRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id === parentRowId) {
          // id 컬럼을 제외하고 빈 라인아이템 생성
          const newLineItem = {
            id: uuidv4(),
            ...globalLineItemColumns.reduce((acc, column) => {
              if (column !== "id") {
                // id 컬럼 제외
                acc[column] = ""; // 각 필드를 빈 값으로 초기화
              }
              return acc;
            }, {}),
          };
          return {
            ...row,
            _bp_lineitems: [...(row._bp_lineitems || []), newLineItem],
          };
        }
        return row;
      })
    );
  };

  const handleAddRow = () => {
    const newRow = {
      id: uuidv4(),
      ...columns.reduce((acc, column) => {
        acc[column.field] = "";
        return acc;
      }, {}),
    };

    setRows((prevRows) => [...prevRows, newRow]);
    setIsEditable(true); // 비피 레코드 추가 후 수정 가능

    const savedDataKey = `project_${selectedProject}_bp_${selectedBp}`;
    const savedData = localStorage.getItem(savedDataKey);
    const parsedData = savedData ? JSON.parse(savedData) : { records: [] };

    parsedData.records.push(newRow);
    localStorage.setItem(savedDataKey, JSON.stringify(parsedData));
  };

  // 프로젝트 목록
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${api_url}/api/getProjects`);
        const companyWorkspace = {
          project_name: "Company_workspace",
          project_number: "0",
        };
        setProjects([companyWorkspace, ...response.data]);
      } catch (error) {
        console.error(
          "프로젝트 목록을 불러오는 중 오류가 발생했습니다.",
          error
        );
      }
    };
    fetchProjects();
  }, []);

  // 선택된 프로젝트에 따라 BP 목록 가져오기
  useEffect(() => {
    if (selectedProject) {
      const fetchBpList = async () => {
        try {
          const response = await axios.get(`${api_url}/api/getBpList`, {
            params: { project_number: selectedProject },
          });
          setBps(response.data);
        } catch (error) {
          console.error("BP 목록을 불러오는 중 오류가 발생했습니다.", error);
        }
      };
      fetchBpList();
    }
  }, [selectedProject]);

  // 저장된 데이터 확인
  useEffect(() => {
    const savedDataKey = `project_${selectedProject}_bp_${selectedBp}`;
    const savedData = localStorage.getItem(savedDataKey);
  }, [selectedProject, selectedBp]);

  // BP 데이터 가져오기
  const fetchData = async () => {
    if (!selectedBp) return;

    try {
      const response = await axios.post(`${api_url}/api/getBpData`, {
        bpname: selectedBp,
        project_number: selectedProject,
      });
      const data = response?.data?.data || [];

      const sampleRecordWithLineItems = data.find(
        (item) => item._bp_lineitems && item._bp_lineitems.length > 0
      );

      if (sampleRecordWithLineItems) {
        const lineItemKeys = Object.keys(
          sampleRecordWithLineItems._bp_lineitems[0]
        );
        setGlobalLineItemColumns(lineItemKeys); // 라인아이템 컬럼 형식 전역 설정
      }

      const formattedRows = data.map((item) => ({
        id: item.id || uuidv4(), // id가 없으면 UUID를 생성하여 사용
        ...item,
      }));

      setRows(formattedRows);

      if (data.length > 0) {
        const dynamicColumns = Object.keys(data[0])
          .filter((key) => key !== "_bp_lineitems")
          .map((key) => ({
            field: key,
            headerName: key,
            width: 150,
          }));
        setColumns(dynamicColumns);
        setIsDataSaved(false);

        setExistingRecords(formattedRows);
      }
    } catch (error) {
      console.error("BP 데이터 가져오기 오류:", error);
    }
  };

  const handleProjectChange = (event) => {
    setSelectedProject(event.target.value);
    setSelectedBp("");
    setRows([]);
    setColumns([]);
  };

  const handleBpChange = (event) => {
    setSelectedBp(event.target.value);
  };

  const downloadExcelFile = (data, selectedBp) => {
    if (!data || data.length === 0) {
      console.error("다운로드할 데이터가 없습니다.");
      return;
    }

    const mainRecords = [];
    const lineItems = [];

    data.forEach((row) => {
      mainRecords.push({
        ...row,
        _bp_lineitems: row._bp_lineitems ? row._bp_lineitems.length : 0,
      });

      if (row._bp_lineitems && row._bp_lineitems.length > 0) {
        row._bp_lineitems.forEach((lineItem) => {
          lineItems.push({
            ...lineItem,
            record_no: row.record_no,
          });
        });
      }
    });

    const workbook = XLSX.utils.book_new();

    // 첫번째 시트 레코드
    const mainWorksheet = XLSX.utils.json_to_sheet(mainRecords);
    XLSX.utils.book_append_sheet(
      workbook,
      mainWorksheet,
      selectedBp || "Main Records"
    );

    // 두번째 시트 라인아이템
    if (lineItems.length > 0) {
      const lineItemsWorksheet = XLSX.utils.json_to_sheet(lineItems);
      XLSX.utils.book_append_sheet(workbook, lineItemsWorksheet, "Line Items");
    }

    // 파일 이름 projectNumber_bpName.xlxs
    XLSX.writeFile(workbook, `${selectedProject}_${selectedBp}.xlsx`);
  };

  const handleExcelUpload = (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.error("파일이 선택되지 않았습니다.");
      return;
    }

    const fileName = file.name.split(".").slice(0, -1).join(".");
    const [projectPart, bpPart] = fileName.split("_");

    if (!projectPart || !bpPart) {
      alert(
        '파일 이름이 형식에 맞지 않습니다. "프로젝트번호_Bp이름.xlsx" 형식이어야 합니다.'
      );
      return;
    }
    setSelectedProject(projectPart);

    console.log(bps);
    setSelectedBp(bpPart);

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        console.log("Main Records (jsonData):", jsonData.slice(0, 5)); // 첫 몇 행 출력

        const secondSheet = workbook.Sheets[workbook.SheetNames[1]];
        const lineItemData = XLSX.utils.sheet_to_json(secondSheet, {
          header: 1,
        });
        console.log("Line Items (lineItemData):", lineItemData.slice(0, 5)); // 첫 몇 행 출력

        const lineItemsByRecord = {};
        const lineItemHeaders = lineItemData[0];
        lineItemData.slice(1).forEach((lineItemRow) => {
          const lineItemObj = {};
          lineItemHeaders.forEach((header, i) => {
            lineItemObj[header] = lineItemRow[i];
          });
          const recordNo = lineItemObj.record_no;
          if (!lineItemsByRecord[recordNo]) {
            lineItemsByRecord[recordNo] = [];
          }
          lineItemsByRecord[recordNo].push(lineItemObj);
        });

        // 엑셀 파일에서 행 id (uuid) 그리드에 안보이게하기
        const headers = jsonData[0].filter((header) => header !== "id");
        const rows = jsonData.slice(1).map((row) => {
          const rowData = {};
          headers.forEach((header, i) => {
            rowData[header] = row[i + 1];
          });

          // 라인아이템
          rowData._bp_lineitems = lineItemsByRecord[rowData.record_no] || []; // record_no연결
          rowData.id = uuidv4();
          console.log("Row Data : ", rowData);
          return rowData;
        });

        setRows([]);
        setColumns([]);
        setTimeout(() => {
          setRows(rows);

          const dynamicColumns = headers
            .filter((header) => header !== "_bp_lineitems")
            .map((header) => ({
              field: header,
              headerName: header,
              width: 150,
            }));

          setColumns(dynamicColumns);
        }, 0);

        setFileInputKey(Date.now());
      } catch (error) {
        console.error("엑셀 파일을 읽는 중 오류 발생:", error);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const saveData = () => {
    if (!rows || rows.length === 0) {
      console.error("저장할 데이터가 없습니다.");
      return;
    }

    alert("데이터가 저장되었습니다.");

    // 저장이 완료되었으므로 전송 버튼 활성화 및 데이터 수정 불가 상태 설정
    setIsEditable(false);
    setIsDataSaved(true);

    // 모든 row를 수정 불가 상태로 변경
    // const updatedRows = rows.map((row) => ({
    //   ...row,
    //   isEditable: false,
    // }));
    // setRows(updatedRows);
  };
  const toggleSaveEdit = () => {
    const nonEmptyRow = rows.filter((row) => {
      // row_id를 제외하고 값이 있는지 확인
      return Object.keys(row).some(
        (key) => key !== "id" && row[key] !== "" && row[key] !== undefined
      );
    });

    // 각 row의 _bp_lineitems를 검사하여 빈 라인아이템 제거
    const cleanedRows = nonEmptyRow.map((row) => {
      if (row._bp_lineitems && row._bp_lineitems.length > 0) {
        row._bp_lineitems = row._bp_lineitems.filter((lineItem) => {
          return Object.keys(lineItem).some(
            (key) =>
              key !== "id" &&
              lineItem[key] !== "" &&
              lineItem[key] !== undefined
          );
        });
      }
      return row;
    });

    setRows(cleanedRows); // 상태 업데이트

    if (isSaveMode) {
      // 저장 모드
      alert("데이터가 저장되었습니다.");
      setIsEditable(false); // 저장 후 그리드 수정 불가
      setIsDataSaved(true); // 전송 버튼 활성화
    } else {
      // 수정 모드
      setIsEditable(true); // 수정 가능하게 변경
    }

    setIsSaveMode(!isSaveMode); // 버튼을 저장 <-> 수정 모드로 전환
  };

  const enableEditting = () => {
    setIsEditable(true);
  };

  const uploadToUnifier = async () => {
    if (!rows || rows.length === 0) {
      console.error("전송할 데이터가 없습니다.");
      return;
    }

    const confirmSend = window.confirm(
      `정말로 ${
        projects.find((p) => p.project_number === selectedProject)?.project_name
      }의 ${selectedBp} 데이터를 전송하시겠습니까?`
    );

    if (!confirmSend) {
      console.log("사용자가 전송을 취소했습니다.");
      return;
    }

    try {
      const requestBody = {
        options: {
          projectNumber: selectedProject,
          bpName: selectedBp,
        },
        data: rows,
      };

      console.log("전체 데이터 전송 중...");

      const response = await axios.post(`${api_url}/api/sendData`, requestBody);

      if (response.status === 200) {
        console.log("데이터 전송 성공");
        setIsDataSaved(false);
        await fetchData();
        alert(
          `${
            projects.find((p) => p.project_number === selectedProject)
              ?.project_name
          }의 ${selectedBp} 데이터 전송을 완료했습니다.`
        );
      } else {
        console.error("데이터 전송 실패", response);
        alert("데이터 전송 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("데이터 전송 중 오류 발생:", error);
      alert("데이터 전송 중 오류가 발생했습니다.");
    }
  };

  const handleLineItemDelete = async (parentRow, LineAutoSeq) => {
    // const lineItem = parentRow._bp_lineitems[LineAutoSeq];
    // console.log(lineItem);

    const confirmDelete = window.confirm("정말 삭제하시겠습니까?");
    if (!confirmDelete) {
      return;
    }
    console.log("선택된 BP 이름:", selectedBp);
    console.log("선택된 프로젝트 번호:", selectedProject);
    console.log("레코드 번호:", parentRow.record_no);
    console.log("선택된 라인아이템 LineAutoSeq:", LineAutoSeq);

    try {
      const response = await axios.post(`${api_url}/api/deleteLineItem`, {
        bpName: selectedBp,
        projectNumber: selectedProject,
        targetItem: LineAutoSeq,
        targetRecord: parentRow.record_no,
      });

      // API 호출 성공 시 해당 아이템 삭제
      if (response.status === 200) {
        const updatedLineItems = parentRow._bp_lineitems.filter(
          (item, index) => index !== LineAutoSeq
        );

        // 부모 행의 _bp_lineitems 업데이트
        const updatedRows = rows.map((row) =>
          row.id === parentRow.id
            ? { ...row, _bp_lineitems: updatedLineItems }
            : row
        );
        setRows(updatedRows);

        alert(
          `레코드 번호 ${parentRow.record_no}의 라인아이템 ${LineAutoSeq}을(를) 삭제했습니다.`
        );
      } else {
        alert(`삭제 실패: ${response.data.message}`);
      }
    } catch (error) {
      if (error.response && error.response.data) {
        console.error("삭제 중 오류 발생:", error.response.data);
        alert(`삭제 중 오류가 발생했습니다: ${error.response.data.message}`);
      } else {
        console.error("삭제 중 오류 발생:", error);
        alert("삭제 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    // <Paper
    //   sx={{ padding: 4, width: "auto", margin: "auto" }}
    // >
    <div style={{ padding: "16px", width: "auto", margin: "0 auto" }}>
      <Box sx={{ display: "flex", gap: 1, marginBottom: 1 }}>
      <Box sx={{ display: "flex", gap: 1, flexGrow: 1, alignItems: 'center' }}>
  <FormControl variant="outlined" sx={{ minWidth: 120, height:'32px' }}>
    <InputLabel 
      id="project-select-label" 
      sx={{ fontSize: '0.8rem' }}  // 글씨 크기 줄이기
    >
      프로젝트
    </InputLabel>
    <Select
      labelId="project-select-label"
      value={selectedProject}
      onChange={handleProjectChange}
      label="프로젝트"
      sx={{ height: '32px', fontSize: '0.8rem' }}  // 높이와 글씨 크기 줄이기
    >
      {projects.map((project) => (
        <MenuItem
          key={project.project_number}
          value={project.project_number}
          sx={{ fontSize: '0.8rem' }}  // 메뉴 아이템 크기도 줄이기
        >
          {project.project_name}
        </MenuItem>
      ))}
    </Select>
  </FormControl>

  <FormControl
    variant="outlined"
    sx={{ minWidth: 120, height: '32px' }}
    disabled={!bps.length}
  >
    <InputLabel 
      id="bp-select-label" 
      sx={{ fontSize: '0.8rem' }}  // 글씨 크기 줄이기
    >
      BP
    </InputLabel>
    <Select
      labelId="bp-select-label"
      value={selectedBp}
      onChange={handleBpChange}
      label="BP"
      sx={{ height: '32px', fontSize: '0.8rem' }}  // 높이와 글씨 크기 줄이기
    >
      {bps.map((bp) => (
        <MenuItem 
          key={bp.bpname} 
          value={bp.bpname}
          sx={{ fontSize: '0.8rem' }}  // 메뉴 아이템 크기 줄이기
        >
          {bp.bpname}
        </MenuItem>
      ))}
    </Select>
  </FormControl>

  <Button
    variant="contained"
    onClick={fetchData}
    disabled={!selectedBp}
    sx={{ height: '32px', fontSize: '0.8rem', padding: '4px 8px' }}  // 버튼 크기 및 패딩 줄이기
  >
   get
  </Button>
</Box>

        <Box sx={{ display: "flex", gap: 2 }}>
          <Tooltip title="엑셀파일 다운로드" arrow>
            <IconButton
              variant="outlined"
              onClick={() => downloadExcelFile(rows, selectedBp)}
              disabled={rows.length === 0}
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="엑셀파일 업로드" arrow>
            <IconButton
              variant="outlined"
              component="label"
            >
              <UploadIcon />
              <input
                type="file"
                key={fileInputKey}
                hidden
                accept=".xlsx, .xls"
                onChange={handleExcelUpload}
              />
            </IconButton>
          </Tooltip>
          <Tooltip title="BP레코드 추가" arrow>
            <IconButton
              variant="outlined"
              disabled={rows.length === 0}
              onClick={handleAddRow}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <div style={{ height: 600, width: "100%" }}>
        <DataGridPro
          apiRef={apiRef}
          rows={rows}
          columns={columns.map((col) => ({
            ...col,
            editable: isEditable,
            align: "center",
            headerAlign: "center",
          }))}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 20]}
          pagination
          processRowUpdate={(newRow, oldRow) => {
            const updatedRows = rows.map((row) =>
              row.id === oldRow.id ? newRow : row
            );
            setRows(updatedRows); // 상태 업데이트
            return newRow;
          }}
          experimentalFeatures={{ newEditingApi: true }}
          onProcessRowUpdateError={(error) =>
            console.error("Row update error:", error)
          }
          getDetailPanelContent={(params) => (
            <div
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "#f9f9f9",
                border: "1px solid #cccccc",
                borderRadius: "8px",
                boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.05)",
                transition: "height 0.3s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    color: "#333",
                    textAlign: "center",
                    flex: 1,
                  }}
                >
                  Line Items
                </h3>
                <Tooltip title="라인 아이템 추가" arrow>
                  <IconButton
                    variant="outlined"
                    onClick={() => handleAddLineItem(params.row.id)}
                  >
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              </div>
              {params.row._bp_lineitems &&
              params.row._bp_lineitems.length > 0 ? (
                <div style={{ width: "100%", overflowY: "auto" }}>
                  <DataGridPro
                    rows={params.row._bp_lineitems.map((item, index) => ({
                      id: item.LineAutoSeq || index, // 유일한 ID 사용
                      ...item,
                    }))}
                    columns={[
                      {
                        field: "Actions",
                        headerName: "",
                        width: 100,
                        align: "center",
                        renderCell: (cellParams) => (
                          <IconButton
                            variant="contained"
                            onClick={() =>
                              handleLineItemDelete(
                                params.row,
                                cellParams.row.id
                              )
                            }
                          >
                            <DeleteOutlineIcon />
                          </IconButton>
                        ),
                      },
                      ...globalLineItemColumns
                        .filter((key) => key !== "id") // id 컬럼을 제외한 나머지 컬럼만 표시
                        .map((key) => ({
                          field: key,
                          headerName: key,
                          width: 150,
                          align: "center",
                          headerAlign: "center",
                          editable: isEditable,
                        })),
                    ]}
                    pageSize={10}
                    rowsPerPageOptions={[5]}
                    hideFooterPagination
                    hideFooter
                    autoHeight
                    processRowUpdate={(newRow, oldRow) => {
                      console.log("New Row:", newRow);
                      console.log("Old Row:", oldRow);

                      const updatedRows = rows.map((row) => {
                        // 부모 행이 일치하는 경우
                        if (row.id === params.row.id) {
                          // 라인 아이템에서 수정해야 할 아이템 찾기
                          const updatedLineItems = row._bp_lineitems.map(
                            (item) => {
                              // 수정할 라인 아이템을 찾고 newRow로 업데이트
                              if (item.LineAutoSeq === newRow.LineAutoSeq) {
                                // item.id 대신 item.LineAutoSeq 사용
                                console.log(
                                  `Updating line item: ${item.LineAutoSeq}`
                                ); // 수정할 라인 아이템 확인
                                return { ...item, ...newRow }; // oldRow가 아닌 newRow의 값을 사용
                              }
                              return item; // 일치하지 않으면 기존 아이템 반환
                            }
                          );

                          // 부모 행을 업데이트하여 새로운 라인 아이템 배열 반환
                          return { ...row, _bp_lineitems: updatedLineItems };
                        }
                        return row; // 다른 행은 그대로 반환
                      });

                      console.log("Updated Rows:", updatedRows); // 최종 업데이트된 rows 확인
                      setRows(updatedRows); // 상태 업데이트
                      return newRow; // 수정된 행 반환
                    }}
                  />
                </div>
              ) : (
                <p>No Line Items Available</p>
              )}
            </div>
          )}
          getDetailPanelHeight={(params) => {
            const lineItemCount = params.row._bp_lineitems
              ? params.row._bp_lineitems.length
              : 0;
            const rowHeight = 52;
            const minHeight = 5 * rowHeight;
            const maxHeight = 400;
            const panelHeight = Math.min(
              Math.max(lineItemCount * rowHeight, minHeight),
              maxHeight
            );
            return panelHeight;
          }}
        />
      </div>

      {rows.length > 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            marginTop: 2,
          }}
        >
          <Button variant="contained" color="primary" onClick={toggleSaveEdit}>
            {isSaveMode ? "저장" : "수정"}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={uploadToUnifier}
            disabled={!isDataSaved}
          >
            전송
          </Button>
        </Box>
      )}
      {/* // </Paper> */}
    </div>
  );
}

export default GridData;
