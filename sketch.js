let video;
let facemesh;
let handpose;
let predictions = [];
let handPredictions = [];
let circleX, circleY;

function setup() {
  createCanvas(640, 480).position(
    (windowWidth - 640) / 2,
    (windowHeight - 480) / 2
  );
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  facemesh = ml5.facemesh(video, modelReady);
  facemesh.on('predict', results => {
    predictions = results;
  });

  handpose = ml5.handpose(video, () => {
    console.log("Handpose model loaded!");
  });
  handpose.on('predict', results => {
    handPredictions = results;
  });

  // 初始圓的位置
  circleX = width / 2;
  circleY = height / 2;
}

function modelReady() {
  console.log("Facemesh model loaded!");
}

function draw() {
  // 翻轉畫布以修正鏡像
  translate(width, 0); // 將畫布的原點移到右上角
  scale(-1, 1); // 水平翻轉畫布

  // 顯示攝影機畫面
  image(video, 0, 0, width, height);

  if (predictions.length > 0) {
    const keypoints = predictions[0].scaledMesh;

    // 鼻子的位置（第94點）
    const [noseX, noseY] = keypoints[94];

    // 偵測手勢並更新圓的位置
    if (handPredictions.length > 0) {
      const hand = handPredictions[0];
      const landmarks = hand.landmarks;

      const gesture = detectGesture(landmarks);

      if (gesture === "scissors") {
        circleX = noseX;
        circleY = noseY - 100; // 額頭
      } else if (gesture === "rock") {
        circleX = noseX - 100; // 左臉頰
        circleY = noseY;
      } else if (gesture === "paper") {
        circleX = noseX + 100; // 右臉頰
        circleY = noseY;
      }
    } else {
      // 如果沒有手勢，圓跟著鼻子移動
      circleX = noseX;
      circleY = noseY;
    }

    // 繪製圓
    noFill();
    stroke(255, 0, 0);
    strokeWeight(4);
    ellipse(circleX, circleY, 50, 50);
  }
}

// 偵測手勢的函式
function detectGesture(landmarks) {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

  // 偵測剪刀手勢（食指和中指伸出）
  if (
    dist(indexTip[0], indexTip[1], middleTip[0], middleTip[1]) > 50 &&
    dist(middleTip[0], middleTip[1], ringTip[0], ringTip[1]) < 50
  ) {
    return "scissors";
  }

  // 偵測石頭手勢（所有手指靠近）
  if (
    dist(thumbTip[0], thumbTip[1], indexTip[0], indexTip[1]) < 50 &&
    dist(indexTip[0], indexTip[1], middleTip[0], middleTip[1]) < 50 &&
    dist(middleTip[0], middleTip[1], ringTip[0], ringTip[1]) < 50 &&
    dist(ringTip[0], ringTip[1], pinkyTip[0], pinkyTip[1]) < 50
  ) {
    return "rock";
  }

  // 偵測布手勢（所有手指伸直）
  if (
    dist(thumbTip[0], thumbTip[1], indexTip[0], indexTip[1]) > 50 &&
    dist(indexTip[0], indexTip[1], middleTip[0], middleTip[1]) > 50 &&
    dist(middleTip[0], middleTip[1], ringTip[0], ringTip[1]) > 50 &&
    dist(ringTip[0], ringTip[1], pinkyTip[0], pinkyTip[1]) > 50
  ) {
    return "paper";
  }

  return null;
}
