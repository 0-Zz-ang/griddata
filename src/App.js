import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignIn from './SignIn';
import SignUp from './SignUp';
import Landing from './Landing'; 
import Dashboard from './Dashboard';
import ResetPassword from './components/ResetPassword';
import GridData from './GridData';




function App() {
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

export default App;
