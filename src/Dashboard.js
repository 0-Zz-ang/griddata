import * as React from "react";
import {
  Box,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as echarts from "echarts";
import { useState, useEffect, useRef } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import AppTheme from "./shared-theme/AppTheme";
import { DataGrid } from "@mui/x-data-grid";
import {
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
} from "@mui/x-data-grid";

const api_url = process.env.REACT_APP_LOCAL_URL;

export default function Dashboard(props) {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loginSuccessDays, setLoginSuccessDays] = useState(
    new Array(7).fill(0)
  );
  // const [rows, setRows] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [bps, setBps] = useState([]);
  const [selectedBp, setSelectedBp] = useState("");
  const loginChartRef = useRef(null);
  const dayChartRef = useRef(null);
  const [selectedProjectNumber, setSelectedProjectNumber] = useState("");
  // const [columns, setColumns] = useState([
  //   { field: 'email', headerName: '이메일', width: 200 },
  //   { field: 'username', headerName: '사용자 이름', width: 150 },
  //   { field: 'record_no', headerName: '레코드 번호', width: 150 },
  //   { field: 'userID', headerName: '사용자 ID', width: 150 },
  //   { field: 'status', headerName: '상태', width: 100 },
  // ]);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const parsedUser = JSON.parse(user);
      setUserData(parsedUser);
      setLoginSuccessDays(parsedUser.loginSuccessDays);
    } else {
      navigate("/signin");
    }
  }, [navigate]);

  useEffect(() => {
    // 프로젝트 목록 불러오기
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${api_url}/api/getProjects`);
        setProjects(response.data);
      } catch (error) {
        console.error(
          "프로젝트 목록을 불러오는 중 오류가 발생했습니다.",
          error
        );
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    if (userData) {
      const loginChartDom = loginChartRef.current;
      const loginChart = echarts.init(loginChartDom);
      const loginOption = {
        title: {
          text: "로그인 성공/실패 통계",
          left: "center",
        },
        tooltip: {
          trigger: "item",
        },
        series: [
          {
            name: "로그인 통계",
            type: "pie",
            radius: "50%",
            data: [
              { value: userData.CountLoginSuccess || 0, name: "로그인 성공" },
              { value: userData.CountLoginFail || 0, name: "로그인 실패" },
            ],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)",
              },
            },
          },
        ],
      };
      loginChart.setOption(loginOption);

      const dayChartDom = dayChartRef.current;
      const dayChart = echarts.init(dayChartDom);

      const maxLoginDayValue = Math.max(...loginSuccessDays);
      const colorPalette = [
        "#3f51b5",
        "#f44336",
        "#ff9800",
        "#4caf50",
        "#9c27b0",
        "#00bcd4",
        "#8bc34a",
      ];

      const dayOption = {
        title: {
          text: "요일별 로그인 성공 횟수",
          left: "center",
        },
        tooltip: {
          trigger: "axis",
        },
        xAxis: {
          type: "category",
          data: ["일", "월", "화", "수", "목", "금", "토"],
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            data: loginSuccessDays.map((value, index) => ({
              value: value,
              itemStyle: {
                color:
                  value === maxLoginDayValue
                    ? "#ff4c4c"
                    : colorPalette[index % colorPalette.length],
              },
            })),
            type: "bar",
            showBackground: true,
            backgroundStyle: {
              color: "rgba(180, 180, 180, 0.2)",
            },
          },
        ],
      };
      dayChart.setOption(dayOption);

      window.addEventListener("resize", () => {
        loginChart.resize();
        dayChart.resize();
      });

      return () => {
        loginChart.dispose();
        dayChart.dispose();
        window.removeEventListener("resize", () => {
          loginChart.resize();
          dayChart.resize();
        });
      };
    }
  }, [userData, loginSuccessDays]);

  useEffect(() => {
    if (selectedProject) {
      const fetchBpList = async () => {
        console.log("선택된 프로젝트 번호:", selectedProjectNumber);
        try {
          let response;
          if (selectedProjectNumber === "0") {
            response = await axios.get(`${api_url}/api/getBpList`, {
              params: {
                project_name: selectedProject,
                project_number: "0",
              },
            });
          } else {
            response = await axios.get(`${api_url}/api/getBpList`, {
              params: {
                project_name: selectedProject,
                project_number: selectedProjectNumber,
              },
            });
          }

          console.log("BP 목록 응답:", response.data);
          setBps(response.data);

          // BP 상태 업데이트 확인
          console.log("BP 목록 상태:", response.data);
        } catch (error) {
          console.error("BP 목록을 불러오는 중 오류가 발생했습니다.", error);
        }
      };
      fetchBpList();
    }
  }, [selectedProject, selectedProjectNumber]);
  // useEffect(() => {
  //   const fetchData = async () => {
  //     if (!selectedBp) return;
  //     try {
  //       const response = await axios.post(`${api_url}/api/getBpData`, { bpname: selectedBp, project_number: selectedProjectNumber });
  //       const data = response.data.data;

  //       const formattedRows = data.map((item, index) => ({
  //         id: index,
  //         ...item
  //       }));
  //       setRows(formattedRows);

  //       if (data.length > 0) {
  //         const dynamicColumns = Object.keys(data[0]).map((key) => ({
  //           field: key,
  //           headerName: key,
  //           width: 150,
  //         }));
  //         setColumns(dynamicColumns);
  //       }
  //     } catch (error) {
  //       console.error('BP 데이터 가져오기 오류:', error);
  //     }
  //   };

  //   fetchData();
  // }, [selectedBp, selectedProjectNumber]);

  const [isGetButtonEnabled, setIsGetButtonEnabled] = useState(false);

  const handleProjectChange = (event) => {
    const selectedProjectName = event.target.value;
    setSelectedProject(selectedProjectName);

    if (selectedProjectName === "companyWorkspace") {
      setSelectedProjectNumber("0");
      setSelectedProject("companyWorkspace");
    } else {
      const project = projects.find(
        (p) => p.project_name === selectedProjectName
      );
      if (project) {
        setSelectedProjectNumber(project.project_number);
      }
    }
    setIsGetButtonEnabled(false); // 프로젝트 변경 시 버튼 비활성화
  };

  const handleBpChange = (event) => {
    setSelectedBp(event.target.value);
    setIsGetButtonEnabled(true); // 프로젝트와 BP가 선택되면 버튼 활성화
  };

  const handleGetButtonClick = () => {
    navigate("/gridData", { state: { selectedBp, selectedProjectNumber } });
  };

  const handleLogout = async () => {
    if (!userData) {
      console.error("로그아웃 시도 중 사용자 데이터가 존재하지 않습니다.");
      return;
    }
    try {
      const response = await axios.post(
        `${api_url}/api/logout`,
        {
          record_no: userData.record_no,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        alert("로그아웃 성공");
        localStorage.removeItem("user");
        setUserData(null);
        navigate("/");
      } else {
        console.error("로그아웃 실패, 상태 코드:", response.status);
      }
    } catch (error) {
      console.error("로그아웃 로그 저장 중 오류 발생:", error);
      alert("로그아웃 중 오류가 발생했습니다.");
    }
  };

  if (!userData) {
    return null;
  }

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 8,
          gap: 4,
          backgroundColor: "#f5f7fa",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            gap: 4,
            width: "90%",
            mt: 4,
          }}
        >
          <Box sx={{ width: "50%", height: "400px" }}>
            <div
              ref={loginChartRef}
              style={{ width: "100%", height: "100%" }}
            ></div>
          </Box>

          <Box sx={{ width: "50%", height: "400px" }}>
            <div
              ref={dayChartRef}
              style={{ width: "100%", height: "100%" }}
            ></div>
          </Box>
        </Box>
        <Box sx={{ alignItems: "center", mb: 2 }}>
          <h2>BP 테이블 조회하기</h2>
          <FormControl
            variant="outlined"
            sx={{ minWidth: 200, marginRight: 2 }}
          >
            <InputLabel id="project-select-label">프로젝트</InputLabel>
            <Select
              labelId="project-select-label"
              value={selectedProject}
              onChange={handleProjectChange}
              label="프로젝트"
            >
              <MenuItem key="0" value="0">
                Company Workspace
              </MenuItem>
              {projects.map((project) => (
                <MenuItem
                  key={project.project_number}
                  value={project.project_name}
                >
                  {project.project_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl variant="outlined" sx={{ minWidth: 200 }}>
            <InputLabel id="bp-select-label">BP</InputLabel>
            <Select
              labelId="bp-select-label"
              value={selectedBp}
              onChange={handleBpChange}
              label="BP"
              disabled={!bps.length}
            >
              {bps.map((bp) => (
                <MenuItem key={bp.bpname} value={bp.bpname}>
                  {bp.bpname}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            sx={{
              mt: 0,
              padding: "10px 20px",
              fontSize: "16px",
              borderRadius: "8px",
              boxShadow: 4,
              ml: 2,
              backgroundColor: isGetButtonEnabled ? "#1976d2" : "#d3d3d3",
              color: "#ffffff",
              cursor: isGetButtonEnabled ? "pointer" : "not-allowed",
              "&:hover": {
                backgroundColor: isGetButtonEnabled ? "#115293" : "#d3d3d3",
              },
            }}
            onClick={handleGetButtonClick}
            disabled={!isGetButtonEnabled}
          >
            GET
          </Button>

          {/* <DataGrid
            rows={rows}
            columns={columns}
            pageSize={5}
            autoHeight
            components={{
              Toolbar: CustomToolbar,  
            }}
          /> */}
        </Box>

        <Button
          variant="contained"
          sx={{
            mt: 3,
            padding: "10px 20px",
            fontSize: "16px",
            borderRadius: "8px",
            boxShadow: 4,
            backgroundColor: "#000",
            color: "#ffffff",
          }}
          onClick={handleLogout}
        >
          로그아웃
        </Button>
      </Box>
    </AppTheme>
  );
}
