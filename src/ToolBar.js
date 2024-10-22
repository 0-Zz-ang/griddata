// CustomToolbar.js
import React, { useEffect, useState } from 'react';
import { GridToolbarContainer } from '@mui/x-data-grid';
import { Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import axios from 'axios';

const CustomToolbar = () => {
  const [projects, setProjects] = useState([]);
  const [bps, setBps] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');

  // Fetch project list on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('/getProjects');
        setProjects(response.data);
      } catch (error) {
        console.error('프로젝트 목록 조회 오류:', error);
      }
    };
    fetchProjects();
  }, []);

  // Fetch BP list when a project is selected
  useEffect(() => {
    const fetchBps = async () => {
      if (selectedProject) {
        try {
          const response = await axios.get('/getBpList', {
            params: { project_name: selectedProject },
          });
          setBps(response.data);
        } catch (error) {
          console.error('BP 목록 조회 오류:', error);
        }
      }
    };
    fetchBps();
  }, [selectedProject]);

  const handleProjectChange = (event) => {
    setSelectedProject(event.target.value);
  };

  return (
    <GridToolbarContainer>
      <FormControl variant="outlined" style={{ minWidth: 200, marginRight: 16 }}>
        <InputLabel>프로젝트 목록</InputLabel>
        <Select
          value={selectedProject}
          onChange={handleProjectChange}
          label="프로젝트 목록"
        >
          {projects.map((project) => (
            <MenuItem key={project.project_number} value={project.project_name}>
              {project.project_name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl variant="outlined" style={{ minWidth: 200 }}>
        <InputLabel>BP 목록</InputLabel>
        <Select
          value=""
          label="BP 목록"
        >
          {bps.map((bp, index) => (
            <MenuItem key={index} value={bp}>
              {bp}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </GridToolbarContainer>
  );
};

export default CustomToolbar;
