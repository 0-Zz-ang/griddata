import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; 
import RootApp from './App'; // App을 RootApp으로 변경

const root = ReactDOM.createRoot(document.getElementById('root')); // index.html의 root 요소와 연결
root.render(
  <RootApp /> // RootApp을 렌더링
);
