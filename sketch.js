let capture;
let facemesh;
let predictions = [];

// ===== 嘴唇外圈 =====
const lipOuter = [
  409, 270, 269, 267, 0, 37, 39, 40, 185, 61,
  146, 91, 181, 84, 17, 314, 405, 321, 375, 291
];

// ===== 嘴唇內圈 =====
const lipInner = [
  76, 77, 90, 180, 85, 16, 315, 404, 320, 307,
  306, 408, 304, 303, 302, 11, 72, 73, 74, 184
];

// ===== 右眼外圈、內圈 =====
const rightEyeOuter = [
  247, 30, 29, 27, 28, 56, 190, 243,
  112, 26, 22, 23, 24, 110, 25, 226
];
const rightEyeInner = [
  246, 161, 160, 159, 158, 157, 173,
  155, 154, 153, 145, 144, 163, 7, 33
];

// ===== 左眼外圈、內圈 =====
const leftEyeOuter = [
  467, 260, 259, 257, 258, 286, 414, 463,
  341, 256, 252, 253, 254, 339, 255, 446
];
const leftEyeInner = [
  466, 388, 387, 386, 385, 384, 398,
  362, 382, 381, 380, 374, 373, 390, 249
];

// ===== 臉部輪廓 =====
const faceOval = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323,
  361, 288, 397, 365, 379, 378, 400, 377, 152, 148,
  176, 149, 150, 136, 172, 58, 132, 93, 234, 127,
  162, 21, 54, 103, 67, 109
];

// ===== 右眉毛特徵點（從外側到內側）=====
const rightEyebrow = [70, 63, 105, 66, 107];

// ===== 左眉毛特徵點 =====
const leftEyebrow = [336, 296, 334, 293, 300];

// ===== 關鍵點：用來定位額頭、雙頰 =====
// 10 = 額頭中心、234 = 右臉頰、454 = 左臉頰

function setup() {
  createCanvas(windowWidth, windowHeight);
  background('#e7c6ff');

  capture = createCapture(VIDEO);
  capture.hide();

  facemesh = ml5.facemesh(capture, modelReady);
  facemesh.on('predict', results => {
    predictions = results;
  });
}

function modelReady() {
  console.log('Facemesh 模型已載入完成！');
}

function draw() {
  background('#e7c6ff');

  // ===== 標題文字 =====
  push();
  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(48);
  textStyle(BOLD);
  text('414737055林宇翔', width / 2, height * 0.125);
  pop();

  // ===== 影像位置 =====
  let imgW = width * 0.5;
  let imgH = height * 0.5;
  let x = (width - imgW) / 2;
  let y = (height - imgH) / 2;

  // ===== 鏡像影像 =====
  push();
  translate(x + imgW, y);
  scale(-1, 1);
  image(capture, 0, 0, imgW, imgH);
  pop();

  // ===== 處理特徵點 =====
  if (predictions.length > 0) {
    const keypoints = predictions[0].scaledMesh;
    const camW = capture.elt.videoWidth || capture.width;
    const camH = capture.elt.videoHeight || capture.height;

    if (camW > 0 && camH > 0) {
      const toDisplay = (idx) => {
        const p = keypoints[idx];
        return {
          x: map(p[0], 0, camW, 0, imgW),
          y: map(p[1], 0, camH, 0, imgH)
        };
      };

      push();
      translate(x + imgW, y);
      scale(-1, 1);

      // ===== 步驟 1：背景遮罩（臉外填 fdf0d5）=====
      noStroke();
      fill('#fdf0d5');
      beginShape();
      vertex(0, 0);
      vertex(imgW, 0);
      vertex(imgW, imgH);
      vertex(0, imgH);
      beginContour();
      for (let i = faceOval.length - 1; i >= 0; i--) {
        const pt = toDisplay(faceOval[i]);
        vertex(pt.x, pt.y);
      }
      endContour();
      endShape(CLOSE);

      // ===== 步驟 2：雙頰紅妝（京劇腮紅）=====
      // 用右臉頰點 234、左臉頰點 454 當圓心
      const rightCheek = toDisplay(234);
      const leftCheek = toDisplay(454);

      noStroke();
      // 半透明的紅色，模擬胭脂暈染
      fill(255, 80, 80, 150);
      ellipse(rightCheek.x + imgW * 0.04, rightCheek.y + imgH * 0.05, imgW * 0.12, imgH * 0.12);
      ellipse(leftCheek.x - imgW * 0.04, leftCheek.y + imgH * 0.05, imgW * 0.12, imgH * 0.12);

      // ===== 步驟 3：額頭花紋（葫蘆造型）=====
      const forehead = toDisplay(10);
      // 葫蘆中心略微向上
      const fx = forehead.x;
      const fy = forehead.y - imgH * 0.05;

      // 葫蘆主體：上小下大兩個圓
      stroke(200, 0, 0);
      strokeWeight(3);
      fill(255, 215, 0); // 金黃色
      ellipse(fx, fy, imgW * 0.025, imgH * 0.03);              // 上半部
      ellipse(fx, fy + imgH * 0.025, imgW * 0.04, imgH * 0.04); // 下半部

      // ===== 步驟 4：京劇挑眉（粗黑線、向外揚起）=====
      stroke(0);
      strokeWeight(8);
      noFill();

      // 右眉
      beginShape();
      for (let i = 0; i < rightEyebrow.length; i++) {
        const pt = toDisplay(rightEyebrow[i]);
        // 外側點（i=0）往上挑、內側點正常
        const lift = (rightEyebrow.length - 1 - i) * imgH * 0.012;
        vertex(pt.x, pt.y - lift);
      }
      endShape();

      // 左眉
      beginShape();
      for (let i = 0; i < leftEyebrow.length; i++) {
        const pt = toDisplay(leftEyebrow[i]);
        const lift = i * imgH * 0.012;
        vertex(pt.x, pt.y - lift);
      }
      endShape();

      // ===== 步驟 5：嘴唇（紅色，粗細 1）=====
      stroke(255, 0, 0);
      strokeWeight(1);
      noFill();
      drawClosedPolyline(lipOuter, toDisplay);
      drawClosedPolyline(lipInner, toDisplay);

      // ===== 步驟 6：雙眼外圈黑眼圈 =====
      stroke(50, 50, 50);
      strokeWeight(15);
      drawClosedPolyline(rightEyeOuter, toDisplay);
      drawClosedPolyline(leftEyeOuter, toDisplay);

      // ===== 步驟 7：雙眼內圈紅線 =====
      stroke(255, 0, 0);
      strokeWeight(2);
      drawClosedPolyline(rightEyeInner, toDisplay);
      drawClosedPolyline(leftEyeInner, toDisplay);

      // ===== 步驟 8：螢光藍臉部輪廓 =====
      stroke(0, 200, 255);
      strokeWeight(2);
      drawClosedPolyline(faceOval, toDisplay);

      pop();
    }
  }

  // ===== 學號水印（左下角）=====
  push();
  fill(80);
  noStroke();
  textAlign(LEFT, BOTTOM);
  textSize(20);
  textStyle(NORMAL);
  text('414737055 林宇翔', 20, height - 20);
  pop();
}

// 繪製封閉多邊形的工具函式
function drawClosedPolyline(points, toDisplay) {
  for (let i = 0; i < points.length; i++) {
    const p1 = toDisplay(points[i]);
    const p2 = toDisplay(points[(i + 1) % points.length]);
    line(p1.x, p1.y, p2.x, p2.y);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}