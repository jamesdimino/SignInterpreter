// Classifier Variable
let classifier;

let upper_threshhold = 0.7
let lower_threshhold = 0.05
let confidenceArray = {}
let progress = 0;
let isPaused = true;
let framesPerChar = 10;
let gameTimer = 60;
let isGameOver = false;
let busy = false;
// Video
let video;
let flippedVideo;
// I'm just arbitrarilly setting the first character to 'a'
let top_character = '-';
let randomCharacters = [];

let predictions;
// // set's of letters for each model
let summerLetters = ['a', 'b', 'c', 'd', 'l', '-'];
let winterLetters = ['d', 'e', 'f', 'g', 'i', '-'];
let letters;
// this tracks where we are in the letters so the prompts cover them all
let promptIndex = 0;
let model;

let correctModel = "";
let needNewWord = true;
let isModelCorrect = false;

let score = 0;

const average = array => array.reduce((a, b) => a + b) / array.length;

// Load the model first
function preload() {
    //getModel();
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
	// Play the game
	playGame();
    if (isPaused) {
        return;
    }
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
}


function getModel() {
	let randomValue = Math.random() < 0.5;
	letters = [];
	if (randomValue) {
		// summer
		classifier = ml5.imageClassifier('https://teachablemachine.withgoogle.com/models/0_xhWMn4A/'+ 'model.json');
		correctModel = "summer";
		for (let i = 0; i < summerLetters.length; ++i) {
			letters.push(summerLetters[i]);
		}
		setupConfidenceArray();
	} else {
		// winter
		classifier = ml5.imageClassifier('https://teachablemachine.withgoogle.com/models/oalxd3LWt/'+ 'model.json');
		correctModel = "winter";
		for (let i = 0; i < winterLetters.length; ++i) {
			letters.push(winterLetters[i]);
		}
		setupConfidenceArray();
	}
	randomCharacters = getRandomCharacters();
	//top_character = randomCharacters[promptIndex];
}

function statistics() {
	busy = true;
    // if the model has not made a prediction, exit the function
    if (!predictions) {
        return;
    }
	if (isPaused) {
        return;
    }
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
			console.log("WE IN HERE?")
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
        console.log("bbb")
        // keep track of the past framesPerChar confidences
        confidenceArray[letters[i]].push(entry.confidence)
        if (confidenceArray[letters[i]].length > framesPerChar) {
            confidenceArray[letters[i]].shift()
        }
    }
    // progress does not update for background, should always be zero
    if (top_character != '-') {
        // is the top character average above or below the threshold?
        console.log(top_character)
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
    if (progress >= 100) {
        confirmLetter();
    } else if (progress <= 0) {
        // if it is negative, set it to zero
        progress = 0;
        let highest_avg = 0;
        // find char with highest avg ( excluding the background )
        for (letter in confidenceArray) {
			console.log("BELOW CONFIRM LETTER")
            // && letter != '-'
            if (average(confidenceArray[letter]) > highest_avg ) {
                highest_avg = average(confidenceArray[letter]);
                top_character = letter;
            }
        }
    }
	busy = false;
}

// This function needs to loop!!
function playGame() {
	//startClock();
	if (needNewWord && !busy) {
		console.log("NEED NEW WORD")
		needNewWord = false;
		getModel();
		document.getElementById("wordPrompt").innerHTML = `Select the model that contains the letters in <strong>'${randomCharacters.join("")}'</strong>?<br>`
		document.getElementById("modelSelect").selectedIndex = 0;
	}
	// Check if model is correct. Dont let user sign until it is
	if (isModelCorrect) {
		isPaused = false;
	}
	if (!gameTimer) {
		console.log("TIME IS UP")
		console.log("SCORE = " + score)
		isPaused = true;
	}


}

function startClock() {
	setInterval(updateTimer, 1000);
}

function confirmLetter() {
	if (top_character === randomCharacters[promptIndex]) {
		promptIndex += 1;
		isPaused = true;

	} else {
		// Incorrect Char
	}
	progress = 0;
	if (promptIndex == randomCharacters.length) {
		promptIndex = 0;
		document.getElementById("extraPrompt").innerHTML = '';
		needNewWord = true;
		score++;
	}
}

function setupConfidenceArray() {
    confidenceArray = {};
    for (let i = 0; i < letters.length; ++i) {
        confidenceArray[letters[i]] = [];
    }
}

function getRandomCharacters() {
	let randomChars = [];
	let remainingChars = correctModel == "winter" ? winterLetters : summerLetters;
	const index = remainingChars.indexOf('-');
	if (index > -1) {
		remainingChars.splice(index, 1);
	}
	for (let i = 0; i < 3; ++i) {
		let char = remainingChars[Math.floor(Math.random() * (remainingChars.length))];
		randomChars.push(char);
		// Remove char to prevent words with same chars
		const index = remainingChars.indexOf(char);
		if (index > -1) {
			remainingChars.splice(index, 1);
		}
	}
	return randomChars;
}

function checkModel() {
	let modelSelector = document.getElementById("modelSelect");
	if (modelSelector.value == correctModel) {
		document.getElementById("extraPrompt").innerHTML = "You selected the correct model! Now sign the word!";
		isModelCorrect = true;
	} else {
		isPaused = true;
		document.getElementById("extraPrompt").innerHTML = "You selected the incorrect model! Look carefully at the models and try again!";
	}
}

function updateTimer() {
	if (gameTimer) {
		gameTimer -= 1;
		if (!gameTimer) {
			isGameOver = true;
		}
	}
}
