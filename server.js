const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/start', (req, res) => {
  if (!fs.existsSync('public/hls')) {
    fs.mkdirSync('public/hls', { recursive: true });
  }

  const ffmpeg = spawn('ffmpeg', [
    '-f', 'v4l2',
    '-input_format', 'mjpeg',
    '-video_size', '1920x1080',
    '-i', '/dev/video0',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-vf', 'fps=25',
    '-g', '50',
    '-hls_time', '1',
    '-hls_list_size', '5',
    '-hls_wrap', '10',
    '-start_number', '1',
    'public/hls/stream.m3u8',
  ]);

  ffmpeg.stderr.on('data', (data) => {
    console.error(`ffmpeg stderr: ${data}`);
  });

  ffmpeg.on('exit', (code, signal) => {
    console.log(`ffmpeg exited with code ${code} and signal ${signal}`);
    res.end();
  });

  req.on('close', () => {
    ffmpeg.kill();
  });

  res.send('Started streaming');
});

app.listen(port, () => {
  console.log(`Video streaming server is running on http://localhost:${port}`);
});
