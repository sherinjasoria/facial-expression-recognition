const video = document.getElementById("video");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const moodDisplay = document.getElementById("moodDisplay");
const emotionMessage = document.getElementById("emotionMessage");
const historyText = document.getElementById("history");
const dominantMoodText = document.getElementById("dominantMood");

const MODEL_URL = "models";

let stream, canvas, interval;
let emotionHistory = [];

const moodColors = {
  happy: "#fff7cc",
  sad: "#dbeafe",
  angry: "#fee2e2",
  surprised: "#ede9fe",
  fearful: "#e5e7eb",
  disgusted: "#dcfce7",
  neutral: "#ffffff"
};

const moodMessages = {
  happy: "You look cheerful today 😊",
  sad: "It’s okay to take a break 💙",
  angry: "Take a deep breath 😌",
  surprised: "That looks exciting 😲",
  fearful: "You’re safe here 🤍",
  disgusted: "Let’s refresh your mood 🌿",
  neutral: "You look calm and composed 🙂"
};

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
  faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
]);

startBtn.onclick = () => {
  navigator.mediaDevices.getUserMedia({ video: true }).then(s => {
    stream = s;
    video.srcObject = stream;
  });
};

stopBtn.onclick = () => {
  if (stream) stream.getTracks().forEach(t => t.stop());
  clearInterval(interval);
  moodDisplay.innerText = "Mood: Camera stopped";
};

video.addEventListener("play", () => {
  if (canvas) canvas.remove();
  canvas = faceapi.createCanvasFromMedia(video);
  document.querySelector(".video-wrapper").append(canvas);

  const size = {
    width: video.getBoundingClientRect().width,
    height: video.getBoundingClientRect().height
  };

  canvas.width = size.width;
  canvas.height = size.height;
  faceapi.matchDimensions(canvas, size);

  interval = setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions();

    const resized = faceapi.resizeResults(detections, size);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    faceapi.draw.drawDetections(canvas, resized);

    if (resized.length > 0) {
      const expressions = resized[0].expressions;
      const mood = Object.keys(expressions).reduce((a, b) =>
        expressions[a] > expressions[b] ? a : b
      );

      emotionHistory.push(mood);
      if (emotionHistory.length > 10) emotionHistory.shift();

      historyText.innerText = emotionHistory.join(" → ");

      const freq = {};
      emotionHistory.forEach(e => freq[e] = (freq[e] || 0) + 1);
      const dominant = Object.keys(freq).reduce((a, b) =>
        freq[a] > freq[b] ? a : b
      );

      dominantMoodText.innerText = dominant.toUpperCase();

      moodDisplay.innerText = `Mood: ${mood.toUpperCase()}`;
      emotionMessage.innerText = moodMessages[mood];
      document.body.style.background = moodColors[mood];
    }
  }, 400);
});
