// config.js
require('dotenv').config({ path: '../.env' });

const config = {
  unifierUrl: process.env.UNIFIER_URL,
  token: process.env.UNIFIER_TOKEN,
  apiUrl: process.env.API_URL || 'http://localhost:3000'  // 기본값 설정
};

module.exports = config;
