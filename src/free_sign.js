// Due to the draw function driving the program cycles, it is necessary to use
// many global variables so 

// Classifier Variable
let classifier;
// Model URL
let imageModelURL = "https://teachablemachine.withgoogle.com/models/pJVCDtMZQ/";

let upper_threshhold = 0.7;
let lower_threshhold = 0.05;
let confidenceArray = {};

let progress = 0;
let isPaused = true;
let framesPerChar = 10;
// Video
let video;
let tutorial_counter = 1;
let flippedVideo;
// To store the classification
let label = "";
// This only works because the two models share a letter. If this changes,
// then each time a model is chosen there must be a new top letter chosen
// from their set of letters
let top_character = 'd';

let predictions;
// // set's of letters for each model 
let summerLetters = ['a', 'b', 'c', 'd', 'l', '-'];
let summerConfidence = {
    'a': [],
    'b': [],
    'c': [],
    'd': [],
    'l': [],
    '-': []
};

let winterLetters = ['d', 'e', 'f', 'g', 'i', '-'];
let winterConfidence = {
    'd': [],
    'e': [],
    'f': [],
    'g': [],
    'i': [],
    '-': []
};

let letters;
// let letters = summerLetters;
// this tracks where we are in the letters so the prompts cover them all
let promptIndex = 0;
let model;
let summerClassifier = ml5.imageClassifier('https://teachablemachine.withgoogle.com/models/0_xhWMn4A/'+ 'model.json');
let winterClassifier = ml5.imageClassifier('https://teachablemachine.withgoogle.com/models/oalxd3LWt/'+ 'model.json');
const average = array => array.reduce((a, b) => a + b) / array.length;

// Load the model first
function preload() {
    document.getElementById("modelSelect").value = "summer";
    getModel();
    
}

// Will need to update with the new model links -> Currently all using the same model
function getModel() {
    model = document.getElementById("modelSelect").value;
    if (model == "summer") {
      // summer
      classifier = summerClassifier;
      letters = summerLetters;
      confidenceArray = summerConfidence;
    } else { 
      // winter
      classifier = winterClassifier;
      letters = winterLetters;
      confidenceArray = winterConfidence;
    }

    for (i in confidenceArray) {
        confidenceArray[i] = [];
    }

    predictions = null;
    // reset any predictions
  }

function pause_play() {
    textSize(120);
    text("Video Paused", width * 0.20, height * 0.35);
    noLoop();
    isPaused = !isPaused;
    if (!isPaused) {
        // pauseBtn.html("Pause");
        loop();
    } else {
        // pauseBtn.html("Play");
        noLoop();
    }
}

// used to control the movement from different tutorial phases
function tutorialNext() {
    console.log(tutorial_counter);
    switch(tutorial_counter) {
        case 1:
            document.getElementById("tutorialPrompt1").style.visibility = "hidden"; 
            document.getElementById("tutorialPrompt2").style.visibility = "visible";
            document.getElementById("videoHighlight").style.visibility = "visible";
            tutorial_counter += 1;
            break; 
        case 2:
            document.getElementById("tutorialPrompt2").style.visibility = "hidden"; 
            document.getElementById("videoHighlight").style.visibility = "hidden";
            document.getElementById("tutorialPrompt3").style.visibility = "visible"; 
            document.getElementById("statsHighlight").style.visibility = "visible";
            tutorial_counter += 1;
            break; 
        case 3:
            document.getElementById("tutorialPrompt3").style.visibility = "hidden"; 
            document.getElementById("statsHighlight").style.visibility = "hidden";  
            document.getElementById("overlay").style.visibility = "hidden";
            // console.log("DEBUGGING: SET IS PAUSED TO FALSE HERE WHEN DONE ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
            isPaused = false;
            tutorial_counter += 1;
            break;
        
        case 4:
            // user has signed all the summer letters and needs to be shown the model select button
            isPaused = true;
            document.getElementById("overlay").style.visibility = "visible";
            document.getElementById("overlay").style.opacity = "85%";
            // make the background mostly opaque 
            document.getElementById("modelSelectContainer").style.zIndex = "1";
            document.getElementById("promptContainer").style.zIndex = "1";
            document.getElementById("modelSelect").style.zIndex = "1";
            document.getElementById("letterPrompt").innerHTML = "Let's try letters from another model!";
            document.getElementById("letterPromptCaption").innerHTML = "Click the button under 🤖";
            document.getElementById("modelSelect").disabled = false;
            document.getElementById("modelSelect").style.opacity = "1";
            tutorial_counter += 1;
            // tutorial counter will increase when they click the winter model
            break;
        case 5:
            document.getElementById("overlay").style.visibility = "hidden";    
            document.getElementById("letterPromptCaption").innerHTML = "Hint: Try moving your hand around the screen";
            document.getElementById("modelSelect").disabled = true;
            document.getElementById("modelSelect").style.opacity = "0.5";
            for (i in confidenceArray) {
                confidenceArray[i] = [];
            }
            top_character = 'd';
            predictions = null;
            isPaused = false;
            tutorial_counter += 1;
            break;
        case 6:
            document.getElementById("letterPrompt").innerHTML = "Congratulations, you finished free mode!";  
            document.getElementById("letterPromptCaption").innerHTML = "When you're ready, try out speed mode and test your ASL skills";
            document.getElementById("speedBtn").disabled = false;
            document.getElementById("speedBtn").style.opacity = "1";
            document.getElementById("speedBtn").innerHTML = "🔓SpeedMode⏩";
            tutorial_counter += 1;
    }
}

function setup() {
    
    createCanvas(windowWidth, windowHeight / 2);
    background('rgb(255, 235, 145)')
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
    // uncomment this after testing

}

function draw() {
    if (isPaused) {
        return;
    }

    console.log("drawing");
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

// function highestOccurence(arr){
//     return arr.sort((a, b) =>
//           arr.filter(x => x === a).length
//         - arr.filter(x => x === b).length
//     ).pop();
// }

// function deleteChar() {
//   top_character = top_character.slice(0, -1);
//   progress = 0;
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
    let top_character_size = 160;
    textSize(top_character_size);
    
    // only draw the character if the bg is not detected
    if (top_character != '-') {
        text(top_character, width * 0.75, height * 0.33 + (top_character_size * 0.25));
        strokeWeight(12);
        stroke(0, 0, 0);
        if (progress) {
            noFill();
            stroke(lerpColor(color(255,0,0), color(0,255,0), (progress / 100.0)));
            arc(width * 0.75, height * 0.33, top_character_size*  1.5, top_character_size * 1.5, 0, 2 * PI * (progress / 100.0))
        }
        strokeWeight(1);
        stroke(0, 0, 0);
    }

    for (let i = 0; i < letters.length; i++) {
        // draw the bar and letter if not background
        let entry = predictions.find(element => element.label === letters[i]);

        // set some vars for easy use later
        maxBarHeight = 100;
        barWidth = 45;
        barGap = 50;
        startingX = windowWidth * 0.625 + ((barGap + barWidth) * i);
        startingY = windowHeight * 0.45;

        if (entry.label != '-') {
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
        }
        
        // keep track of the past framesPerChar confidences
        confidenceArray[letters[i]].push(entry.confidence)
        if (confidenceArray[letters[i]].length > framesPerChar) {
            confidenceArray[letters[i]].shift()
        }
    }
    // progress does not update for background, should always be zero
    if (top_character != '-') {
        // is the top character average above or below the threshold?
        let top_avg = average(confidenceArray[top_character]);
        if (top_avg > upper_threshhold) {
            // model is confident for the top letter, increase progress
            progress += 2;
        } else if (top_avg < lower_threshhold) {
            // model is very unsure, lets decrease progress by 2
            progress -= 2;
        } else {
            // model has mid range confidence, decrease progress by 1
            progress -= 1;
        }
    }

    // has the progress reaches 100 (done) or 0 (choose a new letter)
    if (progress >= 100 && tutorial_counter < 7) {
        confirmLetter();
    } else if (progress <= 0) {
        // if it is negative, set it to zero
        progress = 0;
        let highest_avg = 0;
        // find char with highest avg ( excluding the background )
        for (letter in confidenceArray) {
            // && letter != '-'
            if (average(confidenceArray[letter]) > highest_avg ) {
                highest_avg = average(confidenceArray[letter]);
                top_character = letter;
            }
        }
    }
}

function switchModel() {
    // function activates when the user selects a model
    let selector = document.getElementById("modelSelect")
    // Am I waiting for them to click winter?
    if (tutorial_counter == 5 && selector.value == "winter") {
        // indicate that the user can proceed
        // disable the button so they can't change it during this phase
        document.getElementById("modelSelect").disabled = true;
        document.getElementById("modelSelect").style.opacity = "0.5";
        document.getElementById("letterPrompt").innerHTML = `Can you sign a <strong>'d'</strong>?<br>`
        // unpause the game
        isPaused = false;
        // update the classifier
        getModel();
        tutorialNext();
    }
}
function confirmLetter() {
    // confirm the letter
    console.log(`confirming letter ${top_character}`);
    /////////////////////////////////////////////////////////////////////////////////////////
    if (top_character === letters[promptIndex]) {
        // show the correct icon
        
        promptIndex += 1;
        // -1 since the last character is the background
        // entry needs to be there since it's classifiable and it used in the
        // statistics function
        if (promptIndex >= letters.length - 1) {
            
            // 
            
            tutorialNext();
            // no more prompts to give
            if (tutorial_counter > 6) { 
                promptIndex = -1;
            } else {
                promptIndex = 0;
            }
            
        
        } else {
            document.getElementById("letterPrompt").innerHTML = `Can you sign a <strong>'${letters[promptIndex]}'</strong>?<br>`
        }
    }
    progress = 0;
}