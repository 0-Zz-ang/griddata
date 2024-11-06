import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import GridData from "./pages/GridData";
import { LicenseInfo } from "@mui/x-data-grid-pro";
import { RecoilRoot } from "recoil";
import { Box, FormControl, Select, MenuItem, InputLabel } from "@mui/material";

// data-grid-pro 라이센스 키 등록
LicenseInfo.setLicenseKey(
  "e0d9bb8070ce0054c9d9ecb6e82cb58fTz0wLEU9MzI0NzIxNDQwMDAwMDAsUz1wcmVtaXVtLExNPXBlcnBldHVhbCxLVj0y"
);

function App() {
  const [useLabels, setUseLabels] = useState(true); // 기본적으로 label을 사용

  const handleChange = (event) => {
    setUseLabels(event.target.value === "labels");
  };

  return (
    <Router>
      <div style={{ position: "relative" }}>
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 1000,
            minWidth: 100, // 드롭다운 너비 줄이기
          }}
        >
          <FormControl variant="outlined" size="small" fullWidth>
            <Select
              value={useLabels ? "labels" : "names"}
              onChange={handleChange}
              sx={{ fontSize: "0.8rem", height: "30px" }} // 폰트 크기와 높이 조정
            >
              <MenuItem value="labels" sx={{ fontSize: "0.8rem" }}>
                Show Labels
              </MenuItem>
              <MenuItem value="names" sx={{ fontSize: "0.8rem" }}>
                Show Field Names
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Routes>
          <Route path="/" element={<GridData useLabels={useLabels} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default function RootApp() {
  return (
    <RecoilRoot>
      <App />
    </RecoilRoot>
  );
}
