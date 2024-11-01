import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import ResetPassword from "./pages/ResetPassword";
import GridData from "./pages/GridData";
import { LicenseInfo } from "@mui/x-data-grid-pro";
import { useLanguageSync } from "./locales/i18n";
import { RecoilRoot } from "recoil";

// data-grid-pro 라이센스 키 등록
LicenseInfo.setLicenseKey(
  "e0d9bb8070ce0054c9d9ecb6e82cb58fTz0wLEU9MzI0NzIxNDQwMDAwMDAsUz1wcmVtaXVtLExNPXBlcnBldHVhbCxLVj0y"
);

function App() {
  useLanguageSync();
  return (
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/reset-password/:userId" element={<ResetPassword />} />
          <Route path="/gridData" element={<GridData />} />
        </Routes>
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


