// Classifier Variable
let classifier;
// Model URL
let imageModelURL = 'https://teachablemachine.withgoogle.com/models/fwgU1vlIM/';
const LETTER_NUM = 5;
// Video
let video;
let flippedVideo;
// To store the classification
let label = "";
// let angle = 0;
let predictions;

// Load the model first
function preload() {
    classifier = ml5.imageClassifier(imageModelURL + 'model.json');
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    
    // Create the video
    video = createCapture(VIDEO);
    video.size(windowWidth/2, windowHeight/2);
    video.hide();
    flippedVideo = ml5.flipImage(video);
  
    // Start classifying
    classifyVideo();
   

    // Change the frame rate as necessary depending on computer preformance
    frameRate(30)
    rectMode(CORNERS);
}

function draw() {
    // draw the background
    background('rgb(253,255,243)');

    // Draw the video
    image(flippedVideo, 0, 0);

    // Frame the video
     noFill();
    stroke(20);
    rect(0, 0, windowWidth * 0.5, windowHeight * 0.5 ) 
    // Draw the live statistics
    if (predictions) {
       // draw a box to hold the predictions
       noFill();
       rect(windowWidth, 0, windowWidth * 0.5, windowHeight * .5 ) 
       // Draw the prediction
        fill('rgb(22,146,70)');
        textSize(72);
        textAlign(CENTER);
        text(predictions[0].label, windowWidth * 0.75, windowHeight * 0.25);
        console.log(predictions)
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

    // TODO: Write out sentences with letters given a high
    // letter confidence over a given interval
    // Possible Method: take the average confidence over every 10 frames and if it's above some threshold for some period of time, write the letter to the screen
    // angle = up if threshold, back to zero if a new letter is being scanned in
    // noFill();
    // arc(width * 0.75, height * 0.66, 72, 72, 0, angle);

    // TODO: Add a way to play different modes ( spelling words, signing the correct letter, etc)

    // TODO: Impliment additional functionality to convey how the models learn from *data* and what are the implications of the data.

    // TODO: Train an additional class on a blank background to have no letter appear. Current model will always predict some letter even if none is being signed.

    // STRETCH GOAL: Display the confidence levels in real time using the data returned in the `results` variable

    // STRETCH GOAL: Current model only supports A-F. Full static alphabet would be better, and full alphabet including dynamic letters would be best. 


    // STRETCH GOAL: Exercise may be more engaging for students if they can collaborate with one another. Further research into p5 party package required. Maybe have one student train the model and another student use it. Or give two students different models ( one trained well and the other not ) and have them try and spell words.

    // ALT: Consider using ML5.js Handpose model to aid in the detection of hand gestures. There is also hand pose detection and finger pose detection. Finger pose allows for gesture recognition. 

    // ALT: Consider training several different models and having the kids interact with them. For example, maybe have one model which is completley missing one of the classes,
    // a model which was undertrained on a specific class, and another which was trained using full data. Students can then get an idea for the type of model they are interacting with
    // depending on the performance


}

// Get a prediction for the current video frame
function classifyVideo() {
    flippedVideo = ml5.flipImage(video)
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
    // The results are in an array ordered by confidence.
    // console.log(results[0]);

    predictions = results;
    // console.log(results)
    // top3["C"] = results[""]
    // Classifiy again!
    classifyVideo();
}