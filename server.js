const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const { spawn } = require("child_process");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static("public"));

wss.on("connection", (ws) => {
  console.log("Client connected");

  // Start the FFmpeg process for streaming the video from /dev/video0
  const ffmpeg = spawn("ffmpeg", [
    "-f",
    "v4l2",
    "-input_format",
    "mjpeg",
    "-i",
    "/dev/video0",
    "-c:v",
    "copy",
    "-f",
    "mpjpeg",
    "-boundary_tag",
    "ffmpeg",
    "-",
  ]);

  // Handle FFmpeg output and send it to WebSocket clients
  ffmpeg.stdout.on("data", (data) => {
    ws.send(data);
  });

  ffmpeg.stderr.on("data", (data) => {
    console.log(`FFmpeg stderr: ${data}`);
  });

  ffmpeg.on("close", (code) => {
    console.log(`FFmpeg process exited with code ${code}`);
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    ffmpeg.kill("SIGINT");
  });
});

// Start the server
const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
