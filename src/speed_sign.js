// Classifier Variable
let classifier;

let upper_threshhold = 0.7
let lower_threshhold = 0.05
let confidenceArray = {}
let progress = 0;
let isPaused = true;
let framesPerChar = 10;
let gameTimer = 120;
let startTimer = 5;
// Video
let video;
let flippedVideo;
// I'm just arbitrarilly setting the first character to 'a'
let top_character = '-';
let randomCharacters = [];

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

let modelNum;
let letters = [['a', 'b', 'c', 'd', 'l', '-'], ['d', 'e', 'f', 'g', 'i', '-']];
let promptIndex = 0;
let model;

let correctModel = "";
let isModelCorrect = false;

let summerClassifier = ml5.imageClassifier('https://teachablemachine.withgoogle.com/models/0_xhWMn4A/'+ 'model.json');
let winterClassifier = ml5.imageClassifier('https://teachablemachine.withgoogle.com/models/oalxd3LWt/'+ 'model.json');

let score = 0;
let incorrectModelAttempts = 0;
let totalModelAttempts = 0


const average = array => array.reduce((a, b) => a + b) / array.length;

// Load the model first
function preload() {
    getModel();
	document.getElementById("wordPrompt").innerHTML = `Select the model that contains the letters in <strong>'${randomCharacters.join("")}'</strong>?<br>`
	document.getElementById("modelSelect").selectedIndex = 0;
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
	startGame();
}

function draw() {
	// Play the game
    if (isPaused) {
        return;
    }
	if (isModelCorrect) {
		isPaused = false;
		isModelCorrect = false;
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
	if (randomValue) {
		// summer
		classifier = summerClassifier;
		correctModel = "summer";
		//letters = JSON.parse(JSON.stringify(summerLetters));
		modelNum = 0;
		confidenceArray = summerConfidence;
	} else {
		// winter
		classifier = winterClassifier;
		correctModel = "winter";
		//letters = JSON.parse(JSON.stringify(winterLetters));
		modelNum = 1;
		confidenceArray = winterConfidence;
	}

	predictions = null;
	if (flippedVideo) {
		classifier.classify(flippedVideo, gotResult);
	}
	top_character = '-';

	randomCharacters = getRandomCharacters();
}

function statistics() {
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

	for (let i = 0; i < letters[modelNum].length; i++) {
		// draw the bar and letter if not background
		let entry = predictions.find(element => element.label === letters[modelNum][i]) ?? null;

		// set some vars for easy use later
		maxBarHeight = 100;
		barWidth = 45;
		barGap = 50;
		startingX = windowWidth * 0.625 + ((barGap + barWidth) * i);
		startingY = windowHeight * 0.45;
		if (entry && entry.label != '-') {
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
		confidenceArray[letters[modelNum][i]].push(entry.confidence)
		if (confidenceArray[letters[modelNum][i]].length > framesPerChar) {
			confidenceArray[letters[modelNum][i]].shift()
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
	if (progress >= 100) {
		progress = 0;
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

// This function needs to loop!!
function resetGameCycle() {
	getModel();
	document.getElementById("wordPrompt").innerHTML = `Select the model that contains the letters in <strong>'${randomCharacters.join("")}'</strong>?<br>`
	document.getElementById("modelSelect").selectedIndex = 0;
	// Check if model is correct. Dont let user sign until it is
}

function startClock() {
	setInterval(updateTimer, 1000);
}

function confirmLetter() {
	if (top_character === randomCharacters[promptIndex]) {
		promptIndex += 1;
		document.getElementById("wordPrompt").innerHTML = `Correct! Now sign the letter: <strong>'${randomCharacters[promptIndex]}'</strong>?<br>`;
		document.getElementById("extraPrompt").innerHTML = ''
	} else {
		// Incorrect Char
		document.getElementById("extraPrompt").innerHTML = 'Incorrect Character! Try Again'
		document.getElementById("extraPrompt").style.color = '#D2042D'
	}
	progress = 0;
	// Need new word
	if (promptIndex == randomCharacters.length) {
		isPaused = true;
		promptIndex = 0;
		document.getElementById("extraPrompt").innerHTML = '';
		score++;
		resetGameCycle();
	}
}

function getRandomCharacters() {
	let randomChars = [];
	let remainingChars = JSON.parse(JSON.stringify(letters[modelNum]));
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
	totalModelAttempts++;
	let modelSelector = document.getElementById("modelSelect");
	if (modelSelector.value == correctModel) {
		document.getElementById("wordPrompt").innerHTML = `Correct! Now sign the letter: <strong>'${randomCharacters[promptIndex]}'</strong>?<br>`;
		document.getElementById("extraPrompt").innerHTML = '';
		isModelCorrect = true;
		isPaused = false;
	} else {
		incorrectModelAttempts++;
		isPaused = true;
		document.getElementById("extraPrompt").innerHTML = "You selected the incorrect model! Look carefully at the models and try again!";
	}
}

function updateTimer() {
	if (gameTimer) {
		gameTimer -= 1;
		document.getElementById("roundTimer").innerHTML = `Time Left: ${gameTimer}`
		if (!gameTimer) {
			document.getElementById("modelSelect").style.visibility = "hidden";
			document.getElementById("robotImg").style.visibility = "hidden";
			document.getElementById("overlay").style.visibility = "visible";
			document.getElementById("scorePrompt").innerHTML = `Your Score: <strong>${score}</strong>`
			document.getElementById("scorePromptBox").style.visibility = "visible";
			isPaused = true;
		}
	}
}

function startGame() {
	setInterval(updateStartTime, 1000);
	document.getElementById("modelSelect").style.visibility = "hidden";
	document.getElementById("robotImg").style.visibility = "hidden";
	document.getElementById("overlay").style.visibility = "visible";
	document.getElementById("startPrompt").innerHTML = `Game starting in: ${startTimer}`
	document.getElementById("startPromptBox").style.visibility = "visible";
	document.getElementById("roundTimer").innerHTML = `Time Left: ${gameTimer}`
}

function updateStartTime() {
	if (startTimer) {
		startTimer -= 1;
		document.getElementById("startPrompt").innerHTML = `Game starting in: ${startTimer}`
		if (!startTimer) {
			document.getElementById("modelSelect").style.visibility = "visible";
			document.getElementById("robotImg").style.visibility = "visible";
			document.getElementById("overlay").style.visibility = "hidden";
			document.getElementById("startPrompt").innerHTML = ''
			document.getElementById("startPromptBox").style.visibility = "hidden";
			startClock();
		}
	}
}

function endGame() {
	addUser();
	// Uncomment when you want to export users. Or run in console
	//exportUsers();
	window.location = 'index.html';
}

/**
     * Add new users to locally stored JSON object
    **/
function addUser() {
	let userData = localStorage.getItem('userData');
	let firstName = localStorage.getItem('fname');
	let grade = localStorage.getItem('grade');
	var date = new Date();
	var formattedDate = date.getDate() + "/"
		+ (date.getMonth() + 1)  + "/"
		+ date.getFullYear() + " - "
		+ date.getHours() + ":"
		+ date.getMinutes() + ":"
		+ date.getSeconds();

	if (userData) {
		userData = JSON.parse(userData);
	} else {
		userData = {users: []};
	}
	userData.users.push({
		firstName: firstName,
		grade: grade,
		date: formattedDate,
		incorrectModelAttempts: incorrectModelAttempts,
		totalModelAttempts: totalModelAttempts,
		score: score,
	});
	localStorage.setItem('userData', JSON.stringify(userData));
}

/**
 * Exports all users currently in localstorage
 * Download file in csv format
**/
function exportUsers() {
	let userData = localStorage.getItem('userData');
	if (userData) {
		userData = JSON.parse(userData).users;
		let csvRows = [];
		const headers = ['ID', 'Name', 'Grade', 'Incorrect Model Attempts', 'Total Model Attempts', 'Score', 'Date/Time'];
		csvRows.push(headers.join(','));
		userData.forEach(function (user) {
			let newRow = [
				csvRows.length,
				user.firstName,
				user.grade,
				user.incorrectModelAttempts,
				user.totalModelAttempts,
				user.score,
				user.date,
			];

			csvRows.push(newRow.join(','))
		})
		csvRows = csvRows.join('\n')
		const blob = new Blob([csvRows], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.setAttribute('href', url)
		a.setAttribute('download', 'users.csv');
		a.click()
		console.log('Users have been exported!')
	} else {
		console.log("No user data to export!");
	}
}
