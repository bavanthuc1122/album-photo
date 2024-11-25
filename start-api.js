const { spawn } = require('child_process');
const path = require('path');

const apiProcess = spawn('python', [
  path.join(__dirname, 'pages', 'api', 'upload_album.py')
], {
  stdio: 'inherit'
});

apiProcess.on('close', (code) => {
  console.log(`API process exited with code ${code}`);
});