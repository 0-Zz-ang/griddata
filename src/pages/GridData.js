import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { DataGridPro, useGridApiRef } from "@mui/x-data-grid-pro";
import {Box,Button,FormControl,Select,MenuItem,IconButton,Modal,} from "@mui/material";
import * as XLSX from "xlsx";
import { v4 as uuidv4 } from "uuid";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CloseIcon from "@mui/icons-material/Close";
import { useTranslation } from "react-i18next";
import localeTexts from "../locales/localeText";

const api_url = process.env.REACT_APP_LOCAL_URL;

function GridData({useLabels}) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const {selectedBp: initialSelectedBp,selectedProjectNumber: initialSelectedProjectNumber,} = location.state || {};
  const [selectedRow, setSelectedRow] = useState(null); // 모달에 표시될거 
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [projects, setProjects] = useState([]);
  const [bps, setBps] = useState([]);
  const [selectedProject, setSelectedProject] = useState(initialSelectedProjectNumber || "");
  const [selectedBp, setSelectedBp] = useState(initialSelectedBp || "");
  const [existingRecords, setExistingRecords] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [isDataSaved, setIsDataSaved] = useState(false);
  const [isEditable, setIsEditable] = useState(true);
  const [isSaveMode, setIsSaveMode] = useState(true); // 저장 모드와 수정 모드 전환
  const [globalLineItemColumns, setGlobalLineItemColumns] = useState([]);
  const handleOpenModal = (row) => {setSelectedRow(row);setIsModalOpen(true);};
  const handleCloseModal = () => {setIsModalOpen(false);};
  const [labels, setLabels] = useState({});

  const apiRef = useGridApiRef();

  // 라인아이템 추가
  const handleAddLineItem = (parentRowId) => {
    setRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id === parentRowId) {
          const newLineItem = {
            id: uuidv4(),
            ...globalLineItemColumns.reduce((acc, column) => {
              if (column !== "id") {// id 컬럼 제외
                acc[column] = ""; // 각 필드를 빈 값으로 초기화
              }
              return acc;
            }, {}),
          };

          const updatedRow = {
            ...row,
            _bp_lineitems: [...(row._bp_lineitems || []), newLineItem],
          };

          if (selectedRow && selectedRow.id === parentRowId) {
            setSelectedRow(updatedRow);
          }
          return updatedRow;
        }
        return row;
      }));
  };


  useEffect(() => {
    if (columns.length > 0) {
      setColumns((prevColumns) =>
        prevColumns.map((col) =>
          col.field === "viewLineItems"
            ? { ...col, headerName: "라인 아이템 조회" }
            : col
        ));
    }}, [i18n.language,t,columns.length]);

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

  const fetchLabel = async (fieldName) => {
    try {
      const response = await axios.get(`${api_url}/api/getDataElementLabel`, {
        params: { data_element: fieldName }
      });
      return response.data?.data[0]?.form_label || fieldName; // label이 없을 경우 fieldName을 사용
    } catch (error) {
      console.error("Label fetch error for field:", fieldName, error);
      return fieldName;
    }
  };
  



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
        const lineItemKeys = Object.keys(sampleRecordWithLineItems._bp_lineitems[0]);
        setGlobalLineItemColumns(lineItemKeys);
      }

      const formattedRows = data.map((item) => ({
        id: item.id || uuidv4(),
        ...item,
      }));

      setRows(formattedRows);

      const lineItemFields = sampleRecordWithLineItems ? Object.keys(sampleRecordWithLineItems._bp_lineitems[0]) : [];
      const labelResponse = await axios.post(`${api_url}/api/getFieldLabels`, { dataElements: lineItemFields });
      const lineItemLabels = labelResponse.data.labels;

      const dynamicLineItemColumns = lineItemFields.map((key) => ({
        field: key,
        headerName: useLabels ? lineItemLabels[key] || key : key,
        width: 150,
        editable: isEditable,
        align: "center",
        headerAlign: "center",
        flex: 1,
        minWidth: 150,
      }));

      const hasLineItems = formattedRows.some(
        (row) => row._bp_lineitems && row._bp_lineitems.length > 0
      );

      const dataElements = Object.keys(data[0] || {}).filter((key) => key !== "_bp_lineitems");
      const recordLabelResponse = await axios.post(`${api_url}/api/getFieldLabels`, { dataElements });
      const recordLabels = recordLabelResponse.data.labels;

      const dynamicColumns = [
        ...dataElements.map((key) => ({
          field: key,
          headerName: useLabels ? recordLabels[key] || key : key,
          width: 150,
        })),
        ...(hasLineItems
          ? [
              {
                field: "viewLineItems",
                headerName: "라인 아이템 조회",
                renderCell: (params) => (
                  <Button variant="outlined" color="primary" onClick={() => handleOpenModal(params.row)}>
                    라인 아이템 조회
                  </Button>
                ),
                width: 150,
                align: "center",
                headerAlign: "center",
              },
            ]
          : []),
      ];

      setColumns(dynamicColumns);
      setIsDataSaved(false);
      setExistingRecords(formattedRows);
      setGlobalLineItemColumns(dynamicLineItemColumns);
    } catch (error) {
      console.error("BP 데이터 가져오기 오류:", error);
    }
  };
// useLabels가 변경될 때 fetchData를 자동 호출
useEffect(() => {
  if (selectedBp) {
    fetchData();
  }
}, [useLabels]); // useLabels 변경 시 데이터 새로 고침

  const handleGetData = () => {
    if (selectedBp) {
      fetchData();
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
      alert("파일 이름이 형식에 맞지 않습니다. '프로젝트번호_BP이름.xlsx' 형식이어야 합니다.");
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

  useEffect(() => {
    if (isModalOpen && selectedRow) {
      const updatedRow = rows.find((row) => row.id === selectedRow.id);
      if (updatedRow) {
        setSelectedRow(updatedRow);
      }
    }
  }, [isModalOpen, rows, selectedRow]);

  const handleLineItemDelete = async (parentRow, LineAutoSeq) => {

    const confirmDelete = window.confirm("정말 삭제하시겠습니까?");
    if (!confirmDelete) {
      return;
    }

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
          (item) => item.LineAutoSeq !== LineAutoSeq
        );

        // 부모 행의 _bp_lineitems 업데이트
        const updatedRows = rows.map((row) =>
          row.id === parentRow.id
            ? { ...row, _bp_lineitems: updatedLineItems }
            : row
        );
        setRows(updatedRows);
        if (selectedRow && selectedRow.id === parentRow.id) {
          setSelectedRow((prevSelectedRow) => ({
            ...prevSelectedRow,
            _bp_lineitems: updatedLineItems,
          }));
        }

        alert(`레코드 번호 ${parentRow.record_no}의 라인아이템 ${LineAutoSeq}을(를) 삭제했습니다.`);
        await fetchData(); // 삭제 후 데이터 다시 가져오기
      } else {
        alert(t("삭제 실패:", { message: response.data.message }));
      }
    } catch (error) {
      if (error.response && error.response.data) {
        console.error("삭제 중 오류 발생:", error.response.data);
        alert(
          t("삭제 중 오류가 발생했습니다:", { message: error.response.data.message })
        );
      } else {
        console.error("삭제 중 오류 발생:", error);
        alert(t("삭제 중 오류가 발생했습니다:"));
      }
    }
  };



  return (
    // <Paper
    //   sx={{ padding: 4, width: "auto", margin: "auto" }}
    // >
    <div style={{ padding: "16px", width: "auto", margin: "0 auto" }}>
      <Box
        sx={{display: "flex",gap: 1,marginTop: 3,marginBottom: 3,alignItems: "center",}}>
        <Box
          sx={{ display: "flex", gap: 1, flexGrow: 1, alignItems: "center" }}>
          <FormControl
            variant="outlined"
            sx={{ minWidth: 120, height: "32px" }}>
            <Select
              labelId="project-select-label"
              value={selectedProject}
              onChange={handleProjectChange}
              displayEmpty
              sx={{ height: "32px", fontSize: "0.8rem", textAlign: "center" }}
              renderValue={(selected) => {
                if (selected.length === 0) {
                  return (
                    <span style={{ color: "#aaa" }}>
                      프로젝트
                    </span>
                  );
                }
                return projects.find(
                  (project) => project.project_number === selected
                )?.project_name;
              }}
            >
              {projects.map((project) => (
                <MenuItem
                  key={project.project_number}
                  value={project.project_number}
                  sx={{ fontSize: "0.8rem" }}
                >
                  {project.project_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl
            variant="outlined"
            sx={{ minWidth: 120, height: "32px" }}
            disabled={!bps.length}
          >
            <Select
              labelId="bp-select-label"
              value={selectedBp}
              onChange={handleBpChange}
              displayEmpty
              sx={{ height: "32px", fontSize: "0.8rem" }}
              renderValue={(selected) => {
                if (selected.length === 0) {
                  return (
                    <span style={{ color: "#aaa" }}>BP</span>
                  );
                }
                return bps.find((bp) => bp.bpname === selected)?.bpname;
              }}
            >
              {bps.map((bp) => (
                <MenuItem
                  key={bp.bpname}
                  value={bp.bpname}
                  sx={{ fontSize: "0.8rem" }}
                >
                  {bp.bpname}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button variant="outlined" onClick={handleGetData} disabled={!selectedBp}  sx={{ height: "32px", fontSize: "0.8rem", textAlign: "center" }}>
            get
          </Button>
          <Button variant="outlined" component="label"  sx={{ height: "32px", fontSize: "0.8rem", textAlign: "center" }}>
           엑셀 업로드
            <input
              type="file"
              key={fileInputKey}
              hidden
              accept=".xlsx, .xls"
              onChange={handleExcelUpload}
            />
          </Button>
          <Button
            variant="outlined"
            onClick={() => downloadExcelFile(rows, selectedBp)}
            disabled={rows.length === 0}
            sx={{ height: "32px", fontSize: "0.8rem", textAlign: "center" }}
          >
          엑셀 다운로드
          </Button>
          <Button
            variant="outlined"
            disabled={rows.length === 0}
            onClick={handleAddRow}
            sx={{ height: "32px", fontSize: "0.8rem", textAlign: "center" }}
          >
           레코드 추가
          </Button>
        </Box>
      </Box>

      <div style={{ height: 750, width: "100%", marginTop: 5 }}>
        <DataGridPro
          apiRef={apiRef}
          rows={rows}
          columns={columns.map((col) => ({
            ...col,
            editable: isEditable,
            align: "center",
            headerAlign: "center",
            flex: 1,
            minWidth: 150,
          }))}
          pagination
          autoPageSize
          localeText={localeTexts[i18n.language]} 
          style={{ width: "100%", height: "100%" }}
          processRowUpdate={(newRow, oldRow) => {
            const updatedRows = rows.map((row) =>
              row.id === oldRow.id ? newRow : row
            );
            setRows(updatedRows); 
            return newRow;
          }}
          experimentalFeatures={{ newEditingApi: true }}
          onProcessRowUpdateError={(error) =>
            console.error("Row update error:", error)
          }
        />
      </div>
      <Modal open={isModalOpen} onClose={handleCloseModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%", // 모달 너비 확대
            height: "80%", // 모달 높이 확대
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            display: "flex",
            flexDirection: "column", // 레이아웃을 위에서 아래로 정렬
          }}
        >
          {/* 상단 고정 영역 */}

          <IconButton
            onClick={handleCloseModal}
            sx={{
              position: "absolute",
              top: 8, // 상단에서 약간 떨어진 위치
              right: 8, // 오른쪽에서 약간 떨어진 위치
            }}
          >
            <CloseIcon />
          </IconButton>

          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <div>
              <h2>BP : {selectedBp}</h2>
              <h2>Record_no : {selectedRow?.record_no}</h2>
            </div>
          </Box>

          {/* 라인 아이템 추가 버튼 (고정) */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleAddLineItem(selectedRow.id)}
            >
            라인 아이템 추가
            </Button>
          </Box>

          {/* 그리드 영역: 스크롤 가능 */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto", // 그리드 내부에서만 스크롤,
              display: "flex", // 추가
              alignItems: "center", // 세로 중앙 정렬
              justifyContent: "center", // 가로 중앙 정렬
            }}
          >
            {selectedRow &&
            selectedRow._bp_lineitems &&
            selectedRow._bp_lineitems.length > 0 ? (
              <DataGridPro
                rows={selectedRow._bp_lineitems.map((item, index) => ({
                  id: item.LineAutoSeq || index,
                  ...item,
                }))}
                columns={[
                  {
                    width: 100,
                    align: "center",
                    renderCell: (cellParams) => (
                      <IconButton
                        variant="contained"
                        onClick={() =>
                          handleLineItemDelete(selectedRow, cellParams.row.id)
                        }
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    ),
                  },
                  // ...Object.keys(selectedRow._bp_lineitems[0])
                  //   .map((key) => ({
                  //     field: key,
                  //     headerName: useLabels ? labels[key] || key : key, // useLabels 상태에 따라 라벨 또는 필드명 표시
                  //     width: 150,
                  //     editable: isEditable,
                  //     align: "center",
                  //     headerAlign: "center",
                  //     flex: 1,
                  //     minWidth: 150,
                  //   }))
                  //   .filter((column) => column.field !== "id"),
                  ...globalLineItemColumns,
                ]}
                autoPageSize
                pagination
                processRowUpdate={(newRow, oldRow) => {
                  // 새로 업데이트된 라인아이템을 처리하는 함수
                  const updatedLineItems = selectedRow._bp_lineitems.map(
                    (item) =>
                      item.LineAutoSeq === oldRow.LineAutoSeq ? newRow : item
                  );

                  // 업데이트된 라인아이템을 selectedRow에 반영
                  const updatedSelectedRow = {
                    ...selectedRow,
                    _bp_lineitems: updatedLineItems,
                  };
                  setSelectedRow(updatedSelectedRow);

                  // 전체 rows에서도 업데이트
                  setRows((prevRows) =>
                    prevRows.map((row) =>
                      row.id === selectedRow.id
                        ? { ...row, _bp_lineitems: updatedLineItems }
                        : row
                    )
                  );

                  return newRow;
                }}
                onProcessRowUpdateError={(error) =>
                  console.error("Row update error:", error)
                }
              />
            ) : (
             <p> 라인 아이템이 없습니다.</p>
            )}
          </Box>
        </Box>
      </Modal>
      {rows.length > 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            marginTop: 2,
          }}
        >
          <Button variant="outlined" color="primary" onClick={toggleSaveEdit}>
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
