import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Paper, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

function GridData() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedBp: initialSelectedBp, selectedProjectNumber: initialSelectedProjectNumber } = location.state || {};

  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(initialSelectedProjectNumber || '');
  const [bps, setBps] = useState([]);
  const [selectedBp, setSelectedBp] = useState(initialSelectedBp || '');

  useEffect(() => {
    // 프로젝트 목록 불러오기
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_LOCAL_URL}/api/getProjects`);
        setProjects(response.data);
      } catch (error) {
        console.error('프로젝트 목록을 불러오는 중 오류가 발생했습니다.', error);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      const fetchBpList = async () => {
        try {
          const response = await axios.get(`${process.env.REACT_APP_LOCAL_URL}/api/getBpList`, {
            params: {
              project_number: selectedProject,
            },
          });
          setBps(response.data);
        } catch (error) {
          console.error('BP 목록을 불러오는 중 오류가 발생했습니다.', error);
        }
      };
      fetchBpList();
    }
  }, [selectedProject]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedBp) return;

      try {
        const response = await axios.post(`${process.env.REACT_APP_LOCAL_URL}/api/getBpData`, {
          bpname: selectedBp,
          project_number: selectedProject,
        });
        
        const data = response.data.data;

        // 데이터 형식 설정
        const formattedRows = data.map((item, index) => ({
          id: index,
          ...item,
        }));
        setRows(formattedRows);

        // 동적 컬럼 설정
        if (data.length > 0) {
          const dynamicColumns = Object.keys(data[0]).map((key) => ({
            field: key,
            headerName: key,
            width: 150,
          }));
          setColumns(dynamicColumns);
        }
      } catch (error) {
        console.error('BP 데이터 가져오기 오류:', error);
      }
    };

    fetchData();
  }, [selectedBp, selectedProject]);

  const handleAddButtonClick = () => {
    console.log('Add button clicked');
    // 추가 기능 구현
  };

  const handleProjectChange = (event) => {
    setSelectedProject(event.target.value);
    setSelectedBp('');
    setRows([]);
    setColumns([]);
  };

  const handleBpChange = (event) => {
    setSelectedBp(event.target.value);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f7fa',
      }}
    >
      <Paper elevation={3} sx={{ padding: 4, width: '90%' }}>
        <Box sx={{ display: 'flex', gap: 2, marginBottom: 2 }}>
          <FormControl variant="outlined" sx={{ minWidth: 200 }}>
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
                <MenuItem key={project.project_number} value={project.project_number}>
                  {project.project_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl variant="outlined" sx={{ minWidth: 200 }} disabled={!bps.length}>
            <InputLabel id="bp-select-label">BP</InputLabel>
            <Select
              labelId="bp-select-label"
              value={selectedBp}
              onChange={handleBpChange}
              label="BP"
            >
                
              {bps.map((bp) => (
                <MenuItem key={bp.bpname} value={bp.bpname}>
                  {bp.bpname}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={handleAddButtonClick} sx={{ height: '56px' }}>
            Add
          </Button>
        </Box>
        <div style={{ height: '60%', width: '100%' }}>
          <DataGrid rows={rows} columns={columns} pageSize={5} />
        </div>
      </Paper>
    </Box>
  );
}

export default GridData;
