const video = document.getElementById("video")

// IMPORTANT: GitHub Pages safe path
const MODEL_URL = "models"

// Load models
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
]).then(startVideo)

// Start webcam
function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream
        })
        .catch(err => {
            console.error("Camera error:", err)
        })
}

// When video plays
video.addEventListener("play", () => {

    const canvas = faceapi.createCanvasFromMedia(video)

    // Wrap video + canvas
    const container = document.createElement("div")
    container.style.position = "relative"
    container.style.display = "inline-block"

    video.parentNode.insertBefore(container, video)
    container.appendChild(video)
    container.appendChild(canvas)

    // Match displayed size
    const displaySize = {
        width: video.getBoundingClientRect().width,
        height: video.getBoundingClientRect().height
    }

    canvas.width = displaySize.width
    canvas.height = displaySize.height
    canvas.style.position = "absolute"
    canvas.style.top = "0"
    canvas.style.left = "0"
    canvas.style.pointerEvents = "none"

    faceapi.matchDimensions(canvas, displaySize)

    setInterval(async () => {
        const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceExpressions()

        const resizedDetections =
            faceapi.resizeResults(detections, displaySize)

        const ctx = canvas.getContext("2d")
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw face box
        faceapi.draw.drawDetections(canvas, resizedDetections)

        // Draw expression label
        resizedDetections.forEach(detection => {
            const expressions = detection.expressions

            const maxExpression = Object.keys(expressions).reduce((a, b) =>
                expressions[a] > expressions[b] ? a : b
            )

            const confidence =
                Math.round(expressions[maxExpression] * 100)

            const label =
                `${maxExpression.toUpperCase()} (${confidence}%)`

            const drawBox = new faceapi.draw.DrawBox(
                detection.detection.box,
                { label }
            )

            drawBox.draw(canvas)
        })

    }, 300)
})