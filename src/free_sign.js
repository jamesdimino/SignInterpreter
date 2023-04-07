// Classifier Variable
let classifier;
// Model URL
let imageModelURL = "https://teachablemachine.withgoogle.com/models/pJVCDtMZQ/";
const letters = ['a', 'b', 'c', 'd', 'e', 'f','-']
let upper_threshhold = 0.7
let lower_threshhold = 0.1
let confidenceArray = {
    'a': [] ,
    'b': [], 
    'c': [], 
    'd': [], 
    'e': [], 
    'f': [],
    '-': []
}
let progress = 0;
let isPaused = true;
let framesPerChar = 10;
// Video
let video;
let flippedVideo;
// To store the classification
let label = "";
// I'm just arbitrarilly setting the first character to 'a'
let top_character = 'a';
// let angle = 0;
let predictions;
const average = array => array.reduce((a, b) => a + b) / array.length;

// Load the model first
function preload() {
    // getModel();
    classifier = ml5.imageClassifier('../models/1/' + 'model.json');
}

function pause_play() {
    textSize(120);
    text("Video Paused", width * 0.20, height * 0.35);
    noLoop();
    isPaused = !isPaused;
    if (!isPaused) {
        pauseBtn.html("Pause");
        loop();
    } else {
        pauseBtn.html("Play");
        noLoop();
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight / 2);
    background('rgb(255,244,17)')
    koalafont = loadFont("fonts/playfulKoala.otf");
    textFont(koalafont);

    // Create the video
    video = createCapture(VIDEO);

    // draw a white rectangle where the video will be
    rect(0, 0, windowWidth/2, windowHeight/2);

    // set video settings so image is flipped
    video.size(windowWidth/2, windowHeight/2);
    video.hide();
    flippedVideo = ml5.flipImage(video);

    // Change the frame rate as necessary depending on computer preformance
    frameRate(60);
    rectMode(CORNERS);
    // textFont(loadFont('fonts/playfulKoala.ttf'));
}

function draw() {
    // draw the background
    background('rgb(255, 235, 145)');

    classifyVideo();

    // Draw the video
    image(flippedVideo, 0, 0);
    
    // draw the live statistics
    statistics();
}

// Get a prediction for the current video frame
function classifyVideo() {
    flippedVideo = ml5.flipImage(video);
    // classify is causing the program to pause for a couple seconds
    classifier.classify(flippedVideo, gotResult);
    flippedVideo.remove();
}

// When we get a result
function gotResult(error, results) {
    // If there is an error
    if (error) {
        console.error(error);
        return;
    }
    // The results are in an array ordered by confidence
    predictions = results;
    // label = results[0].label;
    // if (label != "-" && !isPaused) {
    //   progress += (1 / framesPerChar) * 100;
    //   confidenceArray.push(label);
    //   if (confidenceArray.length >= framesPerChar) {
    //     word += highestOccurence(confidenceArray);
    //     confidenceArray = [];
    //     progress = 0;
    //   }
    // }
}

function highestOccurence(arr){
    return arr.sort((a, b) =>
          arr.filter(x => x === a).length
        - arr.filter(x => x === b).length
    ).pop();
}

function deleteChar() {
  top_character = top_character.slice(0, -1);
  progress = 0;
}

// // Will need to update with the new model links -> Currently all using the same model
// function getModel() {
//   let model = localStorage.getItem("modelType");
//   if (model == 1) {
//     // Red
//     imageModelURL = 'https://teachablemachine.withgoogle.com/models/pJVCDtMZQ/'
//   } else if (model == 2) {
//     // Blue
//     imageModelURL = 'https://teachablemachine.withgoogle.com/models/pJVCDtMZQ/'
//   } else if (model == 3) {
//     // Green
//     imageModelURL = 'https://teachablemachine.withgoogle.com/models/pJVCDtMZQ/'
//   }
// }

function tutorial() {
    console.log("Ran the tutorial.");
}

function statistics() {
    // if the model has not made a prediction, exit the function
    if (!predictions) {
        return;
    }

    // draw a box to hold the predictions
    // noFill();
    // rect(windowWidth, 0, windowWidth * 0.5, windowHeight * 0.5 )
    textAlign(CENTER);
    textSize(120);
    
    strokeWeight(2);
    stroke(0, 0, 0);
    text(top_character, width * 0.75, height * 0.25 + 15);
    if (progress) {
        noFill();
        arc(width * 0.75, height * 0.25, 120, 120, 0, 2 * PI * (progress / 100.0))
        
    }
    
    // text(Math.round(progress) + '%', width * 0.75, height * 0.30);

    for (let i = 0; i < letters.length; i++) {
        // find the ith letter from the letters arr
        let entry = predictions.find(element => element.label === letters[i]);
    
        // set some vars for easy use later
        maxBarHeight = 100;
        barWidth = 45;
        barGap = 50;
        startingX = windowWidth * 0.625 + ((barGap + barWidth) * i);
        startingY = windowHeight * 0.45;

        // Interpolate from red to green using confidence
        fill(lerpColor(color(255,0,0), color(0,255,0), entry.confidence));

        // Draw the rectangle
        rect(startingX,
            startingY - (entry.confidence * maxBarHeight),
            startingX + barWidth,
            startingY,
            5, 5, 5, 5
        )

        // Write the labels under their respective bars
        fill(0,0,0);
        textSize(30);
        textAlign(CENTER);
        text(entry.label,startingX + barWidth / 2, startingY + 30);

       // keep track of the past framesPerChar confidences
        confidenceArray[letters[i]].push(entry.confidence)
        if (confidenceArray[letters[i]].length > framesPerChar) {
            confidenceArray[letters[i]].shift()
        }
    }

    // is the top character average above or below the threshold?
    let top_avg = average(confidenceArray[top_character]);
    if (top_avg > upper_threshhold) {
        // model is confident for the top letter, increase progress
        progress += 2;
    } else {
        // model is not confident, lets decrease the progress
        progress -= 1;
    }

    // has the progress reaches 100 (done) or 0 (choose a new letter)
    if (progress >= 100) {
        // confirm the letter
        console.log(`confirming letter ${top_character}`)
        progress = 0;
    } else if (progress <= 0) {
        // if it is negative, set it to zero
        progress = 0;
        let highest_avg = 0;
        // find char with highest avg ( excluding the background )
        for (letter in confidenceArray) {
            if (average(confidenceArray[letter]) > highest_avg && letter != '-') {
                highest_avg = average(confidenceArray[letter]);
                top_character = letter;
            }
            
        }
    }
}