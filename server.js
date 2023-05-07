const express = require('express');
const { spawn } = require('child_process');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/video', (req, res) => {
  res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=frame');

  const ffmpeg = spawn('ffmpeg', [
    '-f', 'v4l2',
    '-input_format', 'mjpeg',
    '-video_size', '1280x720',
    '-i', '/dev/video0',
    '-c:v', 'copy',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-update', '1',
    '-',
  ]);

  ffmpeg.stdout.pipe(res);

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
});

app.listen(port, () => {
  console.log(`Video streaming server is running on http://localhost:${port}`);
});
