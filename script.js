const video = document.getElementById("video");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

const moodDisplay = document.getElementById("moodDisplay");
const emotionMessage = document.getElementById("emotionMessage");
const historyText = document.getElementById("history");
const dominantMoodText = document.getElementById("dominantMood");
const summaryText = document.getElementById("summary");

const MODEL_URL = "models";

let stream, canvas, interval;
let emotionHistory = [];
let emotionCounts = {
  happy: 0, sad: 0, angry: 0,
  surprised: 0, fearful: 0,
  disgusted: 0, neutral: 0
};

const moodMessages = {
  happy: "You look cheerful 😊",
  sad: "Take care 💙",
  angry: "Deep breath 😌",
  surprised: "That’s exciting 😲",
  fearful: "You’re safe 🤍",
  disgusted: "Let’s reset 🌿",
  neutral: "Calm state 🙂"
};

const moodColors = {
  happy: "#fff7cc",
  sad: "#dbeafe",
  angry: "#fee2e2",
  surprised: "#ede9fe",
  fearful: "#e5e7eb",
  disgusted: "#dcfce7",
  neutral: "#ffffff"
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
};

const chartCtx = document.getElementById("emotionChart").getContext("2d");
const emotionChart = new Chart(chartCtx, {
  type: "bar",
  data: {
    labels: Object.keys(emotionCounts),
    datasets: [{
      label: "Emotion Frequency",
      data: Object.values(emotionCounts),
      backgroundColor: "#4f46e5"
    }]
  }
});

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
      const exp = resized[0].expressions;
      const mood = Object.keys(exp).reduce((a,b)=>exp[a]>exp[b]?a:b);

      emotionHistory.push(mood);
      if (emotionHistory.length > 15) emotionHistory.shift();

      emotionCounts[mood]++;
      emotionChart.data.datasets[0].data = Object.values(emotionCounts);
      emotionChart.update();

      historyText.innerText = emotionHistory.join(" → ");
      moodDisplay.innerText = `Mood: ${mood.toUpperCase()}`;
      emotionMessage.innerText = moodMessages[mood];
      document.body.style.background = moodColors[mood];

      const freq = {};
      emotionHistory.forEach(e=>freq[e]=(freq[e]||0)+1);
      const dominant = Object.keys(freq).reduce((a,b)=>freq[a]>freq[b]?a:b);
      dominantMoodText.innerText = dominant.toUpperCase();

      summaryText.innerText =
        `Session Emotions Recorded: ${emotionHistory.length},
         Dominant Mood: ${dominant.toUpperCase()}`;
    }
  }, 400);
});
