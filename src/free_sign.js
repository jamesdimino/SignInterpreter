// Classifier Variable
let classifier;
// Model URL
let imageModelURL = "https://teachablemachine.withgoogle.com/models/pJVCDtMZQ/";
const LETTER_NUM = 5;
let confidenceArray = [];
let progress = 0;
let isPaused = true;
let framesPerChar = 45;
// Video
let video;
let flippedVideo;
// To store the classification
let label = "";
let word = "";
// let angle = 0;
let predictions;

// Load the model first
function preload() {
    getModel();
    classifier = ml5.imageClassifier(imageModelURL + 'model.json');
}

function setup() {
    createCanvas(windowWidth, windowHeight / 2);

    // Create the video
    video = createCapture(VIDEO);

    rect(0, 0, windowWidth/2, windowHeight/2)
    video.size(windowWidth/2 - 15, windowHeight/2 - 15);
    video.hide();
    flippedVideo = ml5.flipImage(video);

    // Start classifying
    console.log("Classifying")
    classifyVideo();

    // Change the frame rate as necessary depending on computer preformance
    frameRate(60);
    rectMode(CORNERS);
    textFont(loadFont('fonts/playfulKoala.ttf'));

    pauseBtn = createButton("Start");
    pauseBtn.position(width * 0.63, height * 0.05);
    pauseBtn.mousePressed(() => {
        isPaused = !isPaused;
        if (!isPaused) {
            loop();
        }
        pauseBtn.html(isPaused ? 'Resume' : 'Pause');
    });

    clearBtn = createButton('Clear');
    clearBtn.position(width * 0.75, height * 0.05);
    clearBtn.mousePressed(() => {
        word = "";
        progress = 0;
    });

    deleteBtn = createButton('Delete');
    deleteBtn.position(width * 0.85, height * 0.05);
    deleteBtn.mousePressed(deleteChar);
    
}

function draw() {
    if (isPaused) {
        background('rgb(253,255,243)');
        textSize(60);
        text("Video Paused", width * 0.20, height * 0.35);
        noLoop();
        return;
    }
    
    classifyVideo();

    // draw the background
    background('rgb(253,255,243)');

    // Draw the video
    image(flippedVideo, 0, 0);

    // Frame the video
    noFill();
    stroke(20);
    rect(0, 0, windowWidth * 0.5 + 1, windowHeight * 0.5 )

    // Draw Control Buttons
    
    // Draw the live statistics
    if (predictions) {
        // draw a box to hold the predictions
        noFill();
        rect(windowWidth, 0, windowWidth * 0.5, windowHeight * .5 )
        textAlign(CENTER);
        text(word, width * 0.75, height * 0.25);
        text(Math.round(progress) + '%', width * 0.75, height * 0.30);

        for (let i = 0; i < LETTER_NUM; i++) {

        // set up some quality easy of use variables
        confidence = predictions[i].confidence;
        maxBarHeight = 100;
        barWidth = 45;
        barGap = 50;
        startingX = windowWidth * 0.625 + ((barGap + barWidth) * i);
        startingY = windowHeight * 0.45;

        // Interpolate from red to green using confidence
        fill(lerpColor(color(255,0,0), color(0,255,0), confidence));

        // Draw the rectangle
        rect( startingX,
              startingY - (confidence * maxBarHeight),
              startingX + barWidth,
              startingY,
              5, 5, 5, 5
            )

        // Write the labels under their respective bars
        fill(0,0,0);
        textSize(30);
        textAlign(CENTER);
        text(predictions[i].label,startingX + barWidth / 2, startingY + 30);
      }
    }

}

// Get a prediction for the current video frame
function classifyVideo() {
    flippedVideo = ml5.flipImage(video)
    classifier.classify(flippedVideo, gotResult);
    flippedVideo.remove()
}

// When we get a result
function gotResult(error, results) {
    // If there is an error
    if (error) {
        console.error(error);
        return;
    }
    // The results are in an array ordered by confidence.\

    if (!isPaused) {
        predictions = results;
    }
    label = results[0].label;
    if (label != "-" && !isPaused) {
      progress += (1 / framesPerChar) * 100;
      confidenceArray.push(label);
      if (confidenceArray.length >= framesPerChar) {
        word += highestOccurence(confidenceArray);
        confidenceArray = [];
        progress = 0;
      }
    }
}

function highestOccurence(arr){
    return arr.sort((a, b) =>
          arr.filter(x => x === a).length
        - arr.filter(x => x === b).length
    ).pop();
}



function deleteChar() {
  word = word.slice(0, -1);
  progress = 0;
}


// Will need to update with the new model links -> Currently all using the same model
function getModel() {
  let model = localStorage.getItem("modelType");
  if (model == 1) {
    // Red
    imageModelURL = 'https://teachablemachine.withgoogle.com/models/pJVCDtMZQ/'
  } else if (model == 2) {
    // Blue
    imageModelURL = 'https://teachablemachine.withgoogle.com/models/pJVCDtMZQ/'
  } else if (model == 3) {
    // Green
    imageModelURL = 'https://teachablemachine.withgoogle.com/models/pJVCDtMZQ/'
  }
}
