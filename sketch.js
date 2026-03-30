const LANG = {
    zh:{
        title:"护眼检测系统",
        desc:"基于AI的距离检测",
        start:"开始",
        tooClose:"⚠ 请后退！距离过近",
        tooFar:"距离过远，请靠近",
        background:"未检测到人脸",
        break:"⏰ 请休息一下",
        startTip:"⚠ 启动前请点击右上角按钮开启声音"
    },
    en:{
        title:"Eye Protection",
        desc:"AI distance detection",
        start:"Start",
        tooClose:"⚠ Too Close!",
        tooFar:"Too Far",
        background:"No face detected",
        break:"⏰ Take a break",
        startTip:"⚠ Click top-right button to enable sound"
    },
    ko:{
        title:"눈 보호 시스템",
        desc:"AI 거리 감지",
        start:"시작",
        tooClose:"⚠ 너무 가까움",
        tooFar:"너무 멀어요",
        background:"얼굴 감지 안됨",
        break:"⏰ 휴식하세요",
        startTip:"⚠ 우측 버튼 눌러 소리 활성화"
    }
};

let currentLang = localStorage.getItem("lang") || "zh";

let video, classifier, label="...";
let tooCloseTimer=0, alertShow=false;
const DELAY_TIME=2000;

let startTime=Date.now(), lastBreakTime=0;
const BREAK_INTERVAL=30*60*1000;

const soundList=[
    new Audio("./audio/alert1.mp3"),
    new Audio("./audio/alert2.mp3"),
    new Audio("./audio/alert3.mp3"),
    new Audio("./audio/alert4.mp3")
];

let currentSoundIndex=parseInt(localStorage.getItem("soundIndex")||0);
let ALERT_SOUND=soundList[currentSoundIndex];

let soundEnabled=localStorage.getItem("soundEnabled")!=="false";
let audioUnlocked=false;

soundList.forEach(s=>s.loop=true);

function startApp(){
    homePage.style.display="none";
    appPage.style.display="block";
    showStartTip();
}

function showStartTip(){
    startTip.innerText=LANG[currentLang].startTip;
    startTip.style.display="block";
    setTimeout(()=>startTip.style.display="none",3000);
}

function applyLang(){
    const t=LANG[currentLang];
    title.innerText=t.title;
    desc.innerText=t.desc;
    startBtn.innerText=t.start;
    appTitle.innerText=t.title;
}

langSelector.value=currentLang;
langSelector.onchange=(e)=>{
    currentLang=e.target.value;
    localStorage.setItem("lang",currentLang);
    applyLang();
};

function preload(){
    classifier=ml5.imageClassifier('model/model.json');
}

function setup(){
    let c=createCanvas(800,600);
    c.parent("canvas-container");

    video=createCapture(VIDEO);
    video.hide();

    classifyVideo();
    applyLang();
    setupUI();
}

function classifyVideo(){
    classifier.classify(video,(e,r)=>{
        if(!e) label=r[0].label;
        classifyVideo();
    });
}

function draw(){
    push();
    translate(width,0);
    scale(-1,1);
    image(video,0,0);
    pop();

    updateTime();

    switch(label){
        case "Too_Close":handleTooClose();break;
        case "Too_Far":handleTooFar();break;
        case "background":handleBackground();break;
        default:resetAlert();
    }
}

function updateTime(){
    let t=Date.now()-startTime;
    let s=Math.floor(t/1000);

    let h=String(Math.floor(s/3600)).padStart(2,'0');
    let m=String(Math.floor((s%3600)/60)).padStart(2,'0');
    let sec=String(s%60).padStart(2,'0');

    timeDisplay.innerText=`${h}:${m}:${sec}`;

    if(t-lastBreakTime>BREAK_INTERVAL){
        alert(LANG[currentLang].break);
        lastBreakTime=t;
    }
}

function handleTooClose(){
    tooCloseTimer+=deltaTime;
    if(tooCloseTimer>DELAY_TIME){
        if(!alertShow){
            showPopup(LANG[currentLang].tooClose,"danger");
        }
        playSound();
    }
}

function handleTooFar(){
    showPopup(LANG[currentLang].tooFar,"warning");
    resetSound();
}

function handleBackground(){
    showPopup(LANG[currentLang].background,"info");
    playSound();
}

function showPopup(text,type){
    const el=alertText;

    el.className="alert-popup";
    el.innerText=text;

    if(type==="danger") el.classList.add("alert-danger");
    if(type==="warning") el.classList.add("alert-warning");
    if(type==="info") el.classList.add("alert-info");

    el.style.display="block";
}

function playSound(){
    if(soundEnabled && audioUnlocked && !alertShow){
        alertShow=true;
        ALERT_SOUND.play().catch(()=>{});
    }
}

function resetSound(){
    ALERT_SOUND.pause();
    ALERT_SOUND.currentTime=0;
    alertShow=false;
}

function resetAlert(){
    tooCloseTimer=0;
    resetSound();
    alertText.style.display="none";
}

function setupUI(){
    soundToggle.innerText=soundEnabled?"🔊":"🔇";

    soundToggle.onclick=()=>{
        if(!audioUnlocked){
            ALERT_SOUND.play().then(()=>{
                ALERT_SOUND.pause();
                audioUnlocked=true;
            }).catch(()=>{});
        }

        soundEnabled=!soundEnabled;
        soundToggle.innerText=soundEnabled?"🔊":"🔇";

        localStorage.setItem("soundEnabled",soundEnabled);

        if(!soundEnabled) resetSound();
    };

    volumeSlider.value=localStorage.getItem("volume")||1;

    volumeSlider.oninput=(e)=>{
        soundList.forEach(s=>s.volume=e.target.value);
        localStorage.setItem("volume",e.target.value);
    };

    soundSelector.value=currentSoundIndex;

    soundSelector.onchange=(e)=>{
        ALERT_SOUND.pause();
        currentSoundIndex=e.target.value;
        ALERT_SOUND=soundList[currentSoundIndex];
        localStorage.setItem("soundIndex",currentSoundIndex);
    };
}
function setup(){
    let canvas = createCanvas(800,600);
    canvas.parent("canvas-container");

    video = createCapture(VIDEO);
    video.size(800,600);
    video.hide();

    classifyVideo();
    applyLang();
    setupUI();
}

async function enablePiP(){
    if(document.pictureInPictureEnabled){
        await document.querySelector("video").requestPictureInPicture();
    }
}

document.body.addEventListener("click",()=>{
    if(!audioUnlocked){
        ALERT_SOUND.play().then(()=>{
            ALERT_SOUND.pause();
            audioUnlocked=true;
        }).catch(()=>{});
    }
},{once:true});