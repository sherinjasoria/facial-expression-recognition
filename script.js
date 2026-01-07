const video = document.getElementById("video")

// Load models
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("./models"),
    faceapi.nets.faceExpressionNet.loadFromUri("./models")
]).then(startVideo)

// Start camera
function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream
        })
        .catch(err => {
            console.error("Camera error:", err)
        })
}

// When video starts playing
video.addEventListener("play", () => {

    // Create canvas
    const canvas = faceapi.createCanvasFromMedia(video)

    // Wrap video + canvas in one container
    const container = document.createElement("div")
    container.style.position = "relative"
    container.style.display = "inline-block"

    video.parentNode.insertBefore(container, video)
    container.appendChild(video)
    container.appendChild(canvas)

    // IMPORTANT: use actual video resolution
    const displaySize = {
        width: video.videoWidth,
        height: video.videoHeight
    }

    canvas.width = displaySize.width
    canvas.height = displaySize.height
    canvas.style.position = "absolute"
    canvas.style.top = "0"
    canvas.style.left = "0"
    canvas.style.pointerEvents = "none"

    faceapi.matchDimensions(canvas, displaySize)

    // Detection loop
    setInterval(async () => {
        const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceExpressions()

        const resizedDetections = faceapi.resizeResults(detections, displaySize)

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

            const confidence = Math.round(expressions[maxExpression] * 100)
            const label = `${maxExpression.toUpperCase()} (${confidence}%)`

            const drawBox = new faceapi.draw.DrawBox(
                detection.detection.box,
                { label }
            )

            drawBox.draw(canvas)
        })

    }, 300)
})