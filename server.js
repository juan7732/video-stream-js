const express = require("express");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const app = express();

app.use(express.static("public"));

app.get("/start", (req, res) => {
  const ffmpeg = spawn("ffmpeg", [
    "-i",
    "/dev/video0",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-tune",
    "zerolatency",
    "-max_muxing_queue_size",
    "1024",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-f",
    "hls",
    "-hls_time",
    "2",
    "-hls_list_size",
    "10",
    "-hls_flags",
    "delete_segments",
    "public/hls/stream.m3u8",
  ]);

  ffmpeg.stderr.on("data", (data) => {
    console.error(`ffmpeg stderr: ${data}`);
  });

  ffmpeg.on("exit", (code, signal) => {
    console.error(`ffmpeg exited with code ${code} and signal ${signal}`);
  });

  res.sendStatus(200);
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(3000, () => {
  console.log("Video streaming server is running on http://localhost:3000");

  // Create 'public/hls' directory if it doesn't exist
  fs.mkdir("public/hls", { recursive: true }, (err) => {
    if (err && err.code !== "EEXIST") {
      console.error("Error creating public/hls directory:", err);
      return;
    }

    // Clean up old HLS files on startup
    fs.readdir("public/hls", (err, files) => {
      if (err) {
        console.error("Error reading public/hls directory:", err);
        return;
      }
      files.forEach((file) => {
        if (file.endsWith(".ts") || file.endsWith(".m3u8")) {
          fs.unlink(path.join("public/hls", file), (err) => {
            if (err) {
              console.error("Error deleting old HLS file:", err);
            }
          });
        }
      });
    });
  });
});
