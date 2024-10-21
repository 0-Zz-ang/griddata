const express = require('express');
const cors = require('cors');  
const apiRoutes = require('./routes/api');  
const path = require('path');

const app = express();
const port = 3000;


app.use(cors());
app.use(express.json());


app.use('/api', apiRoutes);
console.log('API Routes가 로드되었습니다.');


app.use(express.static(path.join(__dirname, 'build')));


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});


app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}/`);
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});




