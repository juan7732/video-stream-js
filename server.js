const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

// Send the video stream to WebSocket clients
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Start the FFmpeg process for streaming the video from /dev/video0
  const ffmpeg = spawn('ffmpeg', [
    '-f', 'v4l2',
    '-input_format', 'mjpeg',
    '-video_size', '1920x1080',
    '-i', '/dev/video0',
    '-c:v', 'copy',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-'
  ]);

  let imageBuffer = Buffer.alloc(0);

  ffmpeg.stdout.on('data', (data) => {
    imageBuffer = Buffer.concat([imageBuffer, data]);
  
    const boundaryIndex = imageBuffer.indexOf(Buffer.from('\xFF\xD8\xFF', 'binary'));
    const endIndex = imageBuffer.indexOf(Buffer.from('\xFF\xD9', 'binary'), boundaryIndex) + 2;
    if (boundaryIndex > -1 && endIndex > -1) {
      const imageData = imageBuffer.slice(boundaryIndex, endIndex);
      imageBuffer = imageBuffer.slice(endIndex);
  
      ws.send(imageData.toString('base64'));
    }
  });

  ffmpeg.stderr.on('data', (data) => {
    console.log(`FFmpeg stderr: ${data}`);
  });

  ffmpeg.on('close', (code) => {
    console.log(`FFmpeg process exited with code ${code}`);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    ffmpeg.kill('SIGINT');
  });
});

// Start the server
const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
