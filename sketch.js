let video;
let classifier;
let label = "等待识别...";
let confidence = 0;

let tooCloseTimer = 0;
let alertShow = false;

let canvas;

const DELAY_TIME = 2000;

let startTime = Date.now();
let totalTime = 0;
let lastBreakTime = 0;

const BREAK_INTERVAL = 30 * 60 * 1000;

const soundList = [
    new Audio("./audio/alert1.mp3"),
    new Audio("./audio/alert2.mp3"),
    new Audio("./audio/alert3.mp3"),
    new Audio("./audio/alert4.mp3")
];

let currentSoundIndex = 0;
let ALERT_SOUND = soundList[currentSoundIndex];

soundList.forEach(sound => {
    sound.volume = 1.0;
    sound.loop = true;
});

let soundEnabled = localStorage.getItem("soundEnabled") !== "false";
let savedVolume = localStorage.getItem("volume") || 1;
let savedSoundIndex = localStorage.getItem("soundIndex") || 0;

let audioUnlocked = false;

currentSoundIndex = parseInt(savedSoundIndex);
ALERT_SOUND = soundList[currentSoundIndex];

soundList.forEach(sound => {
    sound.volume = savedVolume;
});

function preload() {
    classifier = ml5.imageClassifier('model/model.json');
}

function setup() {
    canvas = createCanvas(800, 600);
    canvas.parent('canvas-container');

    video = createCapture(VIDEO);
    video.size(800, 600);
    video.hide();

    classifyVideo();
    setupUI();
}

function unlockAudio() {
    if (!audioUnlocked) {
        ALERT_SOUND.play().then(() => {
            ALERT_SOUND.pause();
            ALERT_SOUND.currentTime = 0;
            audioUnlocked = true;
        }).catch(() => {});
    }
}

function setupUI() {
    const btn = document.getElementById("soundToggle");
    const slider = document.getElementById("volumeSlider");
    const selector = document.getElementById("soundSelector");

    btn.innerText = soundEnabled ? "🔊 关闭提示音" : "🔇 开启提示音";
    slider.value = savedVolume;
    selector.value = currentSoundIndex;

    btn.onclick = () => {
        unlockAudio();

        soundEnabled = !soundEnabled;
        btn.innerText = soundEnabled ? "🔊 关闭提示音" : "🔇 开启提示音";

        localStorage.setItem("soundEnabled", soundEnabled);

        if (!soundEnabled) {
            ALERT_SOUND.pause();
        }
    };

    slider.oninput = (e) => {
        let vol = e.target.value;

        soundList.forEach(sound => {
            sound.volume = vol;
        });

        localStorage.setItem("volume", vol);
    };

    selector.onchange = (e) => {
        let index = parseInt(e.target.value);
        switchSound(index);

        localStorage.setItem("soundIndex", index);
    };

    document.body.addEventListener("click", unlockAudio, { once: true });
}

function switchSound(index) {
    ALERT_SOUND.pause();
    ALERT_SOUND.currentTime = 0;

    currentSoundIndex = index;
    ALERT_SOUND = soundList[currentSoundIndex];
}

function classifyVideo() {
    classifier.classify(video, gotResult);
}

function gotResult(error, results) {
    if (error) return;

    label = results[0].label;
    confidence = (results[0].confidence * 100).toFixed(1);

    classifyVideo();
}

function draw() {
   
    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, 0, 0);
    pop();

    fill(255);
    textSize(20);
    text(`状态：${label}`, 20, 40);

    updateUsageTime();

    switch (label) {
        case 'Too_Close':
            handleTooClose();
            break;
        case 'Normal_Distance':
            handleNormal();
            break;
        case 'Too_Far':
            handleTooFar();
            break;
        default:
            handleDefault();
    }
}

function updateUsageTime() {
    totalTime = Date.now() - startTime;

    let totalSeconds = Math.floor(totalTime / 1000);

    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;

    hours = String(hours).padStart(2, '0');
    minutes = String(minutes).padStart(2, '0');
    seconds = String(seconds).padStart(2, '0');

    document.getElementById("timeDisplay").innerText =
        `使用时长：${hours}:${minutes}:${seconds}`;

    if (totalTime - lastBreakTime >= BREAK_INTERVAL) {
        showBreakAlert();
        lastBreakTime = totalTime;
    }
}

function showBreakAlert() {
    alert("⏰ 已使用30分钟，请休息一下眼睛！");
}

function handleTooClose() {
    tooCloseTimer += deltaTime;

    if (tooCloseTimer >= DELAY_TIME) {
        drawBlinkingBorder();
        showPopup();

        if (soundEnabled && audioUnlocked && !alertShow) {
            alertShow = true;
            ALERT_SOUND.play().catch(()=>{});
        }
    }
}

function handleNormal() {
    stroke(0,255,0);
    strokeWeight(8);
    noFill();
    rect(0,0,width,height);

    resetAlert();
}

function handleTooFar() {
    fill(255,200,0,80);
    rect(0,0,width,height);

    fill(255);
    textSize(24);
    text("请靠近一点", width/2 - 80, height/2);

    resetAlert();
}

function handleDefault() {
    resetAlert();
}

function drawBlinkingBorder() {
    if (frameCount % 60 < 30) {
        stroke(255,0,0);
        strokeWeight(12);
        noFill();
        rect(0,0,width,height);
    }
}

function showPopup() {
    document.querySelector('.alert-popup').style.display = 'block';
}

function resetAlert() {
    tooCloseTimer = 0;

    if (alertShow) {
        ALERT_SOUND.pause();
        ALERT_SOUND.currentTime = 0;

        document.querySelector('.alert-popup').style.display = 'none';

        alertShow = false;
    }
}


async function enablePiP() {
    const videoElement = document.querySelector("video");

    if (document.pictureInPictureEnabled) {
        await videoElement.requestPictureInPicture();
    }
}