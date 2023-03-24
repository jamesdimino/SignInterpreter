let classifier;
let imageModelURL = 'https://teachablemachine.withgoogle.com/models/pJVCDtMZQ/';
let confidenceArray = [];
let framesPerChar = 45;
let video;
let flippedVideo;

let alphabet = ['a', 'b', 'c', 'd', 'e', 'f'];
let gameLenth = 5;
let guessLenth = 5;
let gameTimer = 0;
let charTimer = 0;
let guessChar = '';
let gameStarted = false;
let isGameOver = false;
let score = 0;

let startBtn;
let newGameBtn;
let mainMenuBtn;

// Getting rid of first function call
let flushCall = true;

function preload() {
    classifier = ml5.imageClassifier(imageModelURL + 'model.json');
}

function setup() {
    createCanvas(windowWidth, windowHeight);

    video = createCapture(VIDEO);
    video.size(windowWidth/2, windowHeight/2);
    video.hide();
    flippedVideo = ml5.flipImage(video);

    classifyVideo();

    frameRate(30)
    rectMode(CORNERS);
    textFont(loadFont('fonts/playfulKoala.ttf'));
	setInterval(updateTimers, 1000);

	startBtn = createButton('Start');
	startBtn.position(width * 0.68, height * 0.18);
	startBtn.mousePressed(startGame);
	startBtn.size(200, 100);
	startBtn.style("font-size", "48px");

	textAlign(CENTER);
	newGameBtn = createButton('New Game');
	newGameBtn.position(width * 0.68, height * 0.30);
	newGameBtn.mousePressed(startGame);
	newGameBtn.style("font-size", "32px");
	newGameBtn.hide();

	mainMenuBtn = createButton('Main Menu');
	mainMenuBtn.position(width * 0.68, height * 0.40);
	mainMenuBtn.mousePressed(goToMainMenu);
	mainMenuBtn.style("font-size", "32px");
	mainMenuBtn.hide();

}

function draw() {
    background('rgb(253,255,243)');

    image(flippedVideo, 0, 0);

    noFill();
    stroke(20);
    rect(0, 0, windowWidth * 0.5, windowHeight * 0.5 )
	if (gameStarted) {
		startBtn.hide();
		textSize(32);
		text(guessChar, width * 0.75, height * 0.20);
		textSize(42);
		text(gameTimer, width * 0.75, height * 0.15);
		textSize(22);
		text(charTimer, width * 0.75, height * 0.30);
		textSize(22);
		text('Score: ' + score, width * 0.75, height * 0.35);
	}

	if (isGameOver) {
		mainMenuBtn.show();
		newGameBtn.show();
		textSize(32);
		text('Score: ' + score, width * 0.73, height * 0.20);
	}
}

function classifyVideo() {
    flippedVideo = ml5.flipImage(video)
    classifier.classify(flippedVideo, gotResult);
    flippedVideo.remove()
}

function gotResult(error, results) {
    if (error) {
        console.error(error);
        return;
    }

	let label = results[0].label;
    if (label != "-" && gameStarted) {
      	confidenceArray.push(label);
    }

    classifyVideo();
}

function highestOccurence(arr){
    return arr.sort((a, b) =>
        arr.filter(x => x === a).length
        - arr.filter(x => x === b).length
    ).pop();
}

function updateTimers() {
	if (gameTimer && gameStarted) {
		gameTimer -= 1;
		charTimer -= 1;
		if (!gameTimer) {
			isGameOver = true;
			gameStarted = false;
		}
		if (!charTimer) {
			checkInput();
			getRandomChar();
			charTimer = 5;
		}
	}
}

function getRandomChar() {
	let char = '';
	do {
		char = alphabet[Math.floor(Math.random() * alphabet.length)];
	} while (char == guessChar);
	guessChar = char;
}

function startGame() {
	if (isGameOver) {
		isGameOver = false;
	}
	gameTimer = gameLenth;
	charTimer = guessLenth;
	gameStarted = true;
	getRandomChar();
}

function checkInput() {
	console.log(highestOccurence(confidenceArray))
	console.log(guessChar)
	if (highestOccurence(confidenceArray) == guessChar) {
		score++;
	}
	confidenceArray = [];
}

function goToMainMenu() {
	location.href = "home.html"
}
