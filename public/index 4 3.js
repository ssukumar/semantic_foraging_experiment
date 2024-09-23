const noSave = false;
var fileName;

/* TEMPORARY USE OF ORIGINAL CODE TO TEST THINGS OUT */
try {
    let app = firebase.app();
} catch (e) {
    console.error(e);
}

// Setting up firebase variables
const firestore = firebase.firestore();       // (a.k.a.) db
const firebasestorage = firebase.storage();
const subjectcollection = firestore.collection("Subjects");
const trialcollection = firestore.collection("Trials");

// Function to switch between HTML pages
function show(shown, hidden) {
    document.getElementById(shown).style.display = 'block';
    document.getElementById(hidden).style.display = 'none';
    
    // Scroll to the top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return false;
}

// Close window (function no longer in use for this version)
function onexit() {
    window.close();
}

// Function used to enter full screen mode
function openFullScreen() {
    elem = document.getElementById('container-info');
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    }
}

// Function used to exit full screen mode
function closeFullScreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}

// Object used to track subject data (uploaded to database)
var subject = {
    id: null,
    age: null,
    sex: null,
    handedness: null,
    currTrial: 0,
    tgt_file: null,
    ethnicity: null,
    race: null,
    comments: null,
}

// Object used to track reaching data (updated every reach and uploaded to database)
var subjTrials = {
    id: null, // The current trial number with the id
    name: null, // The participant's id for the test
    experimentID: null, // Not important; all of them are "memory"
    startTime: [], // When the participant begins for the current category
    switchTime: [], // whenever press the enter key
    scoreTime: [], // whenever score
    trialNum: [], // The current trial number
    categoryname: [], // The name of the current category
    score: [], // The score for the category
    totalscore: [], // The total score
    minusscore:[], // The score that should be minus when participants didn't answer the attention check correctly
                   // If the participant answers it correct >> 0; if not >> 1 / 3 / 5 / 7 / ......
    time:[], // The remaining time
    partshape:[], // The shape that participant chooses (string)
    partshapeNum:[], // The shape that participant chooses (int) 1 = circle; 2 = triangle; 3 = square; 0 = none
    trueshape:[], // The true shape that appears on the screen (string)
    trueshapeNum:[], // The true shape  that appears on the screen (int) 1 = circle; 2 = triangle; 3 = square
    result:[], // Judge >> If participant answers the check correctly, result = 1; or else result = 0;
    money:[], // How much the participant earns [0, 12]
}

function checkattention() {

    var value2 = $("#attentional").serializeArray();
    var code1 = value2[0].value;
    var code2 = value2[1].value;

    if (code1 != 'total' || code2 != 'some') {
    alert("Make sure you understand the instructions before proceeding!")
    return;

    } else {
        show('container-info', 'attention-check');
    }
}

// Function used to check if all questions were filled in info form, if so, starts the experiment 
function checkInfo() {

    // check what browser is used
    // Opera 8.0+
    var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    // Firefox 1.0+
    var isFirefox = typeof InstallTrigger !== 'undefined';
    // Safari 3.0+ "[object HTMLElementConstructor]"
    var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));
    // Internet Explorer 6-11
    var isIE = /*@cc_on!@*/false || !!document.documentMode;
    // Edge 20+
    var isEdge = !isIE && !!window.StyleMedia;
    // Chrome 1 - 79
    var isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);
    // Edge (based on chromium) detection
    var isEdgeChromium = isChrome && (navigator.userAgent.indexOf("Edg") != -1);
    // Blink engine detection
    var isBlink = (isChrome || isOpera) && !!window.CSS;
    if (isOpera) {
        subject.browsertype = 'Opera';
    } else if (isFirefox) {
        subject.browsertype = 'firefox';
    } else if (isIE) {
        subject.browsertype = 'IE';
    } else if (isEdge) {
        subject.browsertype = 'Edge';
    } else if (isChrome) {
        subject.browsertype = 'Chrome';
    } else if (isEdgeChromium) {
        subject.browsertype = 'EdgeChromium';
    } else if (isBlink) {
        subject.browsertype = 'Blink';
    } else if (isSafari) {
        subject.browsertype = 'Safari';
    } else {
        subject.browsertype = 'NotDetected';
    }

    var values = $("#infoform").serializeArray();
    subject.id = values[0].value;
    subject.age = values[1].value;
    subject.sex = values[2].value;
    subject.handedness = values[3].value;
    subject.returner = values[4].value;
    subject.ethnicity = values[5].value;
    subject.race = values[6].value;
    if (noSave) {
        show('mouse-control', 'container-info');
        return;
    }
    console.log(subject.id);
    console.log(subject.handedness);
    console.log(values)
    if (!subject.id || !subject.age || !subject.sex || !subject.handedness) {
        alert("Please fill out your basic information!");
        return;
    } else {
        createSubject(subjectcollection, subject);
        show('container-exp', 'container-info');
        openFullScreen();
        startGame();
    }
}

// Function used to create/update subject data in the database
function createSubject(collection, subject) {
    if (noSave) {
        return null;
    }
    return collection.doc(subject.id).set(subject)
        .then(function () {
            return true;
        })
        .catch(function (err) {
            console.error(err);
            throw err;
        });
}

function recordTrialSubj(collection, subjTrials) {
    if (noSave) {
        return null;
    }
    return collection.doc(subjTrials.id).set(subjTrials)
        .then(function () {
            return true;
        })
        .catch(function (err) {
            console.error(err);
            throw err;
        });
}



// Variables used throughout the experiment
var svgContainer;
var screen_height;
var screen_width;
var prev_width;
var prev_height;

var experiment_ID;
var subject_ID;

var target_file_data;
var trial;
var num_trials;
var counter = 0;
var fixation_cross;

var category;
var categories = [];
var categoryname;
var categorylist = [];
var usedcategory = [];
var score;
var totalscore;
var money;
var time;
var timeleft;
var timecount = 30 * 60 * 1000;
var isInDelay = false;
var switchTime;
var scoreTime;

var gamephase = 1;
var timer;

var randomNumber;
var shape;
var shaperesult;
var shapepart;
var Fail = true;
var continueFail = false;
var minus = 1;

var phase = 44; // 44 + 1
var question_time = 7; // 7
var empty_time = 3; // 3
var time_shape;
var time_period;

var mediaRecorder;
var audioChunks = [];
var csvContent;
var isRecording = false;
var recognition;

// Object to save reach data per reach, usage has become slightly obsolete but is still used as an intermediate object to store data before uploading to database
var reachData = {
    experiment_ID: '',
    subject_ID: '',
    current_date: '',
    trial: '',
    option: ''
}

// All game functions are defined within this main function, treat as "main"
function gameSetup(data) {

    /*********************
    * Browser Settings  *
    *********************/
    // Initializations to make the screen full size and black background
    $('html').css('height', '98%');
    $('html').css('width', '100%');
    $('html').css('background-color', 'white');
    $('body').css('background-color', 'white');
    $('body').css('height', '98%');
    $('body').css('width', '100%');

    // Hide the mouse from view 
    $('html').css('cursor', 'none');
    $('body').css('cursor', 'none');

    // SVG container from D3.js to hold drawn items
    svgContainer = d3.select("body").append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr('fill', 'black')
        .attr('id', 'stage');

    // Getting the screen resolution
    screen_height = window.screen.availHeight;
    screen_width = window.screen.availWidth;

    // Experiment parameters, subject_ID is no obsolete
    experiment_ID = "memory"; // **TODO** Update experiment_ID to label your experiments
    subject_ID = Math.floor(Math.random() * 10000000000);

    // Reading the json target file into the game
    target_file_data = data;
    num_trials = target_file_data.numtrials;
    categorylist = Object.values(target_file_data.items)
    categoryname = categorylist[counter]

    console.log(num_trials)

    /***************************
    * Drawn Element Properties *
    ***************************/

    // Setting parameters
    score = 0;
    totalscore = 0;
    money = 0;
    totalTrials = data.numtrials;
    fixation_cross = "fixation.png"
    shape = "shape.png"

    // Show the categories
    svgContainer.append('text')
        .attr('text-anchor', 'middle')
        .attr('x', screen_width / 2)
        .attr('y', screen_height / 3 + 30)
        .attr('font-size', '60')
        .attr('font-weight', 'bold')
        .attr('fill', 'black')
        .attr('id', 'category')
        .attr('display', 'none')
        .attr('font-family', 'Arial')
        .text(categoryname);

    // City for practice
        svgContainer.append('text')
        .attr('text-anchor', 'middle')
        .attr('x', screen_width / 2)
        .attr('y', screen_height / 3 + 30)
        .attr('font-size', '80')
        .attr('fill', 'black')
        .attr('id', 'practice')
        .attr('display', 'none')
        .attr('font-weight', 'bold')
        .attr('font-family', 'Arial')
        .text("CITIES")

    // Show the scores
    svgContainer.append('text')
        .attr('text-anchor', 'middle')
        .attr('x', screen_width / 2)
        .attr('y', screen_height / 2)
        .attr('font-size', '40')
        .attr('fill', 'black')
        .attr('id', 'score')
        .attr('font-family', 'Arial')
        .attr('display', 'none')
        .text('Score: ' + score);
    
    // Show the enter notes
        svgContainer.append('text')
        .attr('text-anchor', 'middle')
        .attr('x', screen_width / 2)
        .attr('y', 7 * screen_height / 8)
        .attr('font-size', '24')
        .attr('fill', 'black')
        .attr('id', 'enter')
        .attr('font-family', 'Arial')
        .attr('display', 'none')
        .text('Press "Enter" when you are ready to move to the next category');

    // Show the total scores
    svgContainer.append('text')
        .attr('text-anchor', 'middle')
        .attr('x', screen_width - screen_width / 7)
        .attr('y', screen_height / 15 + 70)
        .attr('font-size', '50')
        .attr('fill', 'red')
        .attr('font-weight', 'bold')
        .attr('id', 'total')
        .attr('font-family', 'Arial')
        .attr('display', 'none')
        .text('Total Score: ' + totalscore);

    // Show the time
    svgContainer.append('text')
        .attr('text-anchor', 'middle')
        .attr('x', screen_width - screen_width / 7)
        .attr('y', screen_height / 15)
        .attr('font-size', '50')
        .attr('fill', 'red')
        .attr('font-weight', 'bold')
        .attr('id', 'time')
        .attr('font-family', 'Arial')
        .attr('display', 'none')
        .text('Time left:  ' + time);

    // Show the money participants earned
    svgContainer.append('text')
        .attr('text-anchor', 'middle')
        .attr('x', screen_width / 2)
        .attr('y', screen_height / 2)
        .attr('font-size', '60')
        .attr('fill', 'black')
        .attr('id', 'money')
        .attr('font-family', 'Arial')
        .attr('display', 'none')
        .text('You have earned $' + money + ' !'); 
    
    // Show the instructions
    svgContainer.append('text')
        .attr('text-anchor', 'middle')
        .attr('x', screen_width / 2)
        .attr('y', screen_height / 2 - 50)
        .attr('font-size', '32')
        .attr('fill', 'black')
        .attr('id', 'instruc1')
        .attr('font-family', 'Arial')
        .text('When the category appears on the screen, please begin naming words immediately.');

    svgContainer.append('text')
        .attr('text-anchor', 'middle')
        .attr('x', screen_width / 2)
        .attr('y', screen_height / 2 + 50)
        .attr('font-size', '32')
        .attr('fill', 'black')
        .attr('id', 'instruc2')
        .attr('font-family', 'Arial')
        .text('Press the SPACE BAR when you are ready.');
    
    // Mark the time delay
    svgContainer.append('text')
        .attr('text-anchor', 'middle')
        .attr('x', screen_width / 2)
        .attr('y', screen_height / 3)
        .attr('font-size', '72')
        .attr('fill', 'red')
        .attr('font-weight', 'bold')
        .attr('id', 'delay')
        .attr('display', 'none')
        .attr('font-family', 'Arial')
        .text('POINT ACCUMULATION ON HOLD!');

    // Mark the time delay
    svgContainer.append('text')
        .attr('text-anchor', 'middle')
        .attr('x', screen_width / 2)
        .attr('y', screen_height / 2 - 20)
        .attr('font-size', '32')
        .attr('fill', 'black')
        .attr('id', 'prepare')
        .attr('display', 'none')
        .attr('font-family', 'Arial')
        .text('Prepare for the next category');

    // Mark the attention check
    svgContainer.append('text')
        .attr('text-anchor', 'middle')
        .attr('x', screen_width / 2)
        .attr('y', screen_height / 2 + 50)
        .attr('font-size', '32')
        .attr('fill', 'black')
        .attr('id', 'attention')
        .attr('display', 'none')
        .attr('font-family', 'Arial')
        .text('Remember to keep an eye on the shape that will appear below:');

    // Draw the fixation cross
    svgContainer.append('image')
        .attr('x', screen_width / 2 - screen_height / 20)
        .attr('y', 2 * screen_height / 3 - screen_height / 20 + 10)
        .attr('width', screen_height / 10)
        .attr('height', screen_height / 10)
        .attr('href', fixation_cross)
        .attr('id', 'fixation')
        .attr('display', 'none');

    // Create a blue circle
    svgContainer.append('circle')
        .attr("cx", screen_width / 2)
        .attr("cy", 2 * screen_height / 3 + 10)
        .attr("r", screen_height / 20)
        .attr("fill", "blue")
        .attr('id', 'circle')
        .attr('display', 'none');

    // Create a blue square
    svgContainer.append('rect')
        .attr('x', screen_width / 2 - screen_height / 20)
        .attr('y', 2 * screen_height / 3 - screen_height / 20 + 10)
        .attr('width', screen_height / 10)
        .attr('height', screen_height / 10)
        .attr('fill', 'blue')
        .attr('id', 'square') 
        .attr('display', 'none');

    // Create a blue triangle
    svgContainer.append("polygon")
        .attr("points", function() {
            var x = screen_width / 2;
            var y = 2 * screen_height / 3 + 10;
            var size = screen_height / 10;
            return [
                [x, y - size / Math.sqrt(3)].join(","),
                [x - size / 2, y + size / (2 * Math.sqrt(3))].join(","),
                [x + size / 2, y + size / (2 * Math.sqrt(3))].join(",")
            ].join(" ");
        })
        .attr("fill", "blue")
        .attr('id', 'triangle')
        .attr('display', 'none');

    // Mark the attentional check
    svgContainer.append('text')
        .attr('text-anchor', 'middle')
        .attr('x', screen_width / 2)
        .attr('y', 2 * screen_height / 3 - 50)
        .attr('font-size', '40')
        .attr('fill', 'black')
        .attr('id', 'check1')
        .attr('display', 'none')
        .attr('font-family', 'Arial')
        .text('What shape did you just see?');
/*    
    // Mark the attentional check
        svgContainer.append('image')
        .attr('text-anchor', 'middle')
        .attr('x', screen_width / 2 - 8.525 * screen_height / 20)
        .attr('y', 2 * screen_height / 3 - screen_height / 20 + 50)
        .attr('width', 8.525 * screen_height / 10)
        .attr('height', screen_height / 10)
        .attr('href', shape)
        .attr('id', 'check2')
        .attr('display', 'none');

    // Press "z" if it was a triangle; Press "v" if it was a circle; Press "m" if it was a square
    svgContainer.append('text')
        .attr('text-anchor', 'middle')
        .attr('x', screen_width / 2)
        .attr('y', 7 * screen_height / 8)
        .attr('font-size', '24')
        .attr('fill', 'black')
        .attr('id', 'press')
        .attr('font-family', 'Arial')
        .attr('display', 'none')
        .text('Press "Z" if it was a triangle; Press "V" if it was a circle; Press "M" if it was a square');
*/
    // Show the total scores in attentional check
    svgContainer.append('text')
        .attr('text-anchor', 'middle')
        .attr('x', screen_width / 2)
        .attr('y', screen_height / 2 - 20)
        .attr('font-size', '40')
        .attr('fill', 'black')
        .attr('id', 'total2')
        .attr('font-family', 'Arial')
        .attr('display', 'none')
        .text('Total Score: ' + totalscore); 

    // Show the response of the attentional check
    // Correct!
    svgContainer.append('text')
        .attr('text-anchor', 'middle')
        .attr('x', screen_width / 2 + 100)
        .attr('y', screen_height / 2 + 20)
        .attr('font-size', '32')
        .attr('fill', 'green')
        .attr('id', 'correct')
        .attr('font-family', 'Arial')
        .attr('display', 'none')
        .text('Correct!'); 

    // Wrong!
    svgContainer.append('text')
        .attr('text-anchor', 'middle')
        .attr('x', screen_width / 2 + 100)
        .attr('y', screen_height / 2 + 20)
        .attr('font-size', '32')
        .attr('fill', 'red')
        .attr('id', 'wrong')
        .attr('font-family', 'Arial')
        .attr('display', 'none')
        .text('Wrong!'); 

    // Score
    svgContainer.append('text')
        .attr('text-anchor', 'middle')
        .attr('x', screen_width / 2 + 180)
        .attr('y', screen_height / 2 - 20)
        .attr('font-size', '32')
        .attr('fill', 'red')
        .attr('id', 'minus')
        .attr('font-family', 'Arial')
        .attr('display', 'none')
        .text('- ' + minus); 

    /***************************************
    * Pointer Lock Variables and Functions *
    ***************************************/
    document.requestPointerLock = document.requestPointerLock || document.mozRequestPointerLock;
    document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
    window.addEventListener('resize', monitorWindow, false);
    document.addEventListener('keydown', handleKeyPress);

    // Function to set pointer lock and log it
    function setPointerLock() {
        console.log("Attempted to lock pointer");
        stage.requestPointerLock();
    }
    setPointerLock();

    // Function to monitor changes in screen size;
    function monitorWindow(event) {
        var prev_size = prev_width * prev_height;
        var curr_size = window.innerHeight * window.innerWidth;
        console.log("prev size: " + prev_size + " curr size: " + curr_size);
        if (prev_size > curr_size) {
            alert("Please enter full screen and click your mouse to continue the experiment!");
        }
        prev_width = window.innerWidth;
        prev_height = window.innerHeight;
        return;
    }

    trial = 1;
    startTrial();
}

// Function used to start reach trials 
function startTrial() {
    document.addEventListener('keydown', handleKeyPress);

    svgContainer.select("#delay").attr("display", "none");
    svgContainer.select("#prepare").attr("display", "none");
    svgContainer.select("#attention").attr("display", "none");
    svgContainer.select("#circle").attr("display", "none");
    svgContainer.select("#triangle").attr("display", "none");
    svgContainer.select("#square").attr("display", "none");

    if (gamephase === 1) {
        svgContainer.select("#instruc1").attr("display", "block");
        svgContainer.select("#instruc2").attr("display", "block");
    }
    /*
    // Start the timer
    if (gamephase === 1) {
        svgContainer.select("#practice").attr("display", "block");
        practicetrial();
    }

    if (gamephase === 2) {
        svgContainer.select("#practice").attr("display", "none");
        startCategory();
    }
    */
}

function startCategory() {
    date = new Date();
    startdate = Date.now();
    startTime = (parseInt(date.getMonth()) + 1).toString() + "/" + date.getDate() + "/" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "." + date.getMilliseconds();
    subjTrials.startTime = startTime;

    // Random assign the categories' name
    do {
        counter = Math.floor(Math.random() * 25);
    } while (usedcategory.includes(counter));

    usedcategory.push(counter);

    console.log('Random counter value:', counter);

    categoryname = categorylist[counter]
    document.addEventListener('keydown', handleKeyPress);

    svgContainer.select("#category")
        .attr("display", "block")
        .text(categoryname);

    svgContainer.select("#score").attr("display", "block");
    svgContainer.select("#enter").attr("display", "block");
    svgContainer.select("#time").attr("display", "block");
    svgContainer.select("#total")
        .text('Total Score: ' + totalscore)
        .attr("display", "block");

    svgContainer.select("#check1").attr("display", "none");
    svgContainer.select("#check2").attr("display", "none");
    svgContainer.select("#total2").attr("display", "none");
    svgContainer.select("#correct").attr("display", "none");
    svgContainer.select("#wrong").attr("display", "none");
    svgContainer.select("#minus").attr("display", "none");
    svgContainer.select("#press").attr("display", "none");
    svgContainer.select("#fixation").attr("display", "none");

    score = 0;

    // Start recording when category starts
    startRecording();
}


function practicetrial() {
    // Begin the main task
    time = 0;
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        if (gamephase === 2) {
            // get the switch time
            date = new Date();
            switchTime = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "." + date.getMilliseconds();
            subjTrials.switchTime = switchTime;

            if (!isInDelay) {
                stopRecording();
                showMoney();
            }
        }
    }

    if ((event.key === 'Space' || event.key === " ") && gamephase === 1) {
        gamephase = 2;

        svgContainer.select("#instruc1").attr("display", "none");
        svgContainer.select("#instruc2").attr("display", "none");

        d3.timer(function(elapsed){
            timeleft = Math.max(0, timecount - elapsed);
            let minutes = Math.floor(timeleft / (1000 * 60)); 
            let seconds = Math.floor((timeleft % (1000 * 60)) / 1000);
    
            time = d3.format("02")(minutes) + ":" + d3.format("02")(seconds);
    
            svgContainer.select("#score").text("Score: " + score);
            svgContainer.select("#time").text("Time Left:  " + time);
            svgContainer.select("#total").text('Total Score: ' + totalscore);

    
            // End the timer if time is up
            if (timeleft <= 0) {
                stopRecording(); 
                endGame();
                return true; // Stop recording when time is up
            }
        });

        startCategory();
    }

    if (event.key === '1' && !isInDelay) {
        score++;
        if (gamephase === 2) {
            date = new Date();
            scoreTime = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "." + date.getMilliseconds();
            subjTrials.scoreTime.push(scoreTime);

            totalscore++;
            money = totalscore * 0.05;
            money = (totalscore * 0.05).toFixed(2);

            if (money < 0) {
                money = 0;
            }

            if (money > 20) {
                money = 20;
            }
        }
    }

    if (gamephase === 3) {
        // z = triangle; v = circle; m = square
        // 1 = circle; 2 = triangle; 3 = square

        if (event.key === 'z') {
            shapepart = 'triangle';
            subjTrials.partshape = shapepart;
            subjTrials.partshapeNum = 2;

            if (randomNumber === 2) {
                Fail = false;
                continueFail = false;
    
                shaperesult = 1;
                subjTrials.result = shaperesult;
    
                gamephase = 2;
            }
        }

        else if (event.key === 'v') {
            shapepart = 'circle';
            subjTrials.partshape = shapepart;
            subjTrials.partshapeNum = 1;

            if (randomNumber === 1) {
                Fail = false;
                continueFail = false;
    
                shaperesult = 1;
                subjTrials.result = shaperesult;
    
                gamephase = 2;
            }
        }

        else if (event.key === 'm') {
            shapepart = 'square';
            subjTrials.partshape = shapepart;
            subjTrials.partshapeNum = 3;

            if (randomNumber === 3) {
                Fail = false;
                continueFail = false;
    
                shaperesult = 1;
                subjTrials.result = shaperesult;
    
                gamephase = 2;
            }
        }

        else {

            Fail = true;

            shaperesult = 0;
            subjTrials.result = shaperesult;

            shapepart = 'none';
            subjTrials.partshape = shapepart;
            subjTrials.partshapeNum = 0;

            gamephase = 2;
        }
        
        console.log(shapepart)

        /*
        if ((event.key === 'z' && shape === 3) || (event.key === 'v' && shape === 0) || (event.key === 'm' && shape === 6)) {
            Fail = false;
            continueFail = false;

            shaperesult = 1;
            subjTrials.result = shaperesult;

            gamephase = 2;

        } else {
            Fail = true;

            shaperesult = 0;
            subjTrials.result = shaperesult;

            gamephase = 2;
        }
        */
    }
}

// Separate page for money that participant earned
function showMoney() {
    isInDelay = true;
    document.removeEventListener('keydown', handleKeyPress);

    svgContainer.select("#category").attr("display", "none");
    svgContainer.select("#score").attr("display", "none");
    svgContainer.select("#time").attr("display", "none");
    svgContainer.select("#total").attr("display", "none");
    svgContainer.select("#enter").attr("display", "none");

    subjTrials.money = money;

    svgContainer.select("#money")
        .attr("display", "block")
        .text('You have earned $' + money + ' !');

    setTimeout(startDelay, 1000);
    
}

// Time Delay for the beginning
function startDelay() {
    svgContainer.select("#money").attr("display", "none");

    svgContainer.select("#delay").attr("display", "block");
    svgContainer.select("#prepare").attr("display", "block");
    svgContainer.select("#attention").attr("display", "block");
    svgContainer.select("#fixation").attr("display", "block");
    
    // Calculate the delay period
    time_period = phase - question_time - empty_time

    // Generate a random int between [3,36]
    time_shape = Math.floor(Math.random() * time_period) + 3;

    time_remain = phase - time_shape - question_time

    if (trial === 3 || trial === 7 || trial === 12 || trial === 18 || trial === 21) {
        // Generate a random integer between 1, 2, and 3
        randomNumber = Math.floor(Math.random() * 3) + 1;
        subjTrials.trueshapeNum = randomNumber
        
        // 1 = circle; 2 = triangle; 3 = square
        if (randomNumber === 1) {
            subjTrials.trueshape = 'circle';
        }

        if (randomNumber === 2) {
            subjTrials.trueshape = 'triangle';
        }

        if (randomNumber === 3) {
            subjTrials.trueshape = 'square';
        }

        setTimeout(shapeAppear, time_shape * 1000);
    }

    else {
        setTimeout(nextTrial, 1000 * phase);
    }

}

// Appear the shape for 500ms
function shapeAppear() {
    svgContainer.select("#fixation").attr("display", "none");

    // If the random number is 1, the circle appears
    if (randomNumber === 1) {
        svgContainer.select("#circle").attr("display", "block");
    }

    // If the random number is 2, the triangle appears
    if (randomNumber === 2) {
        svgContainer.select("#triangle").attr("display", "block");
    }

    if (randomNumber === 3) {
        svgContainer.select("#square").attr("display", "block");
    }

    setTimeout(continueDelay, 500);

}

// Continue Time Delay
function continueDelay() {
    svgContainer.select("#circle").attr("display", "none");
    svgContainer.select("#triangle").attr("display", "none");
    svgContainer.select("#square").attr("display", "none");
    svgContainer.select("#fixation").attr("display", "block");

    setTimeout(attentionCheck, 1000 * time_remain - 500);
}

// Check the shape
function attentionCheck() {
    gamephase = 3;

    document.addEventListener('keydown', handleKeyPress);

    // Display the check1 and check2 prompts
    svgContainer.select("#fixation").attr("display", "none");
    svgContainer.select("#check1").attr("display", "block");
    // svgContainer.select("#check2").attr("display", "block");
    // svgContainer.select("#press").attr("display", "block");
    svgContainer.select("#total2")
        .text('Total Score: ' + totalscore)
        .attr("display", "block");

    svgContainer.select("#prepare").attr("display", "none");
    svgContainer.select("#attention").attr("display", "none");
    svgContainer.select("#circle").attr("display", "none");
    svgContainer.select("#triangle").attr("display", "none");
    svgContainer.select("#square").attr("display", "none");

    setTimeout(attentionResponse, 1000 * question_time - 500);
}

function attentionResponse() {
    if (Fail) {
        if (continueFail){
            totalscore = totalscore - minus;
            money = totalscore * 0.05;

            if (money < 0) {
                money = 0;
            }

            if (money > 20) {
                money = 20;
            }

            subjTrials.minusscore = minus;

            svgContainer.select("#total2").text('Total Score: ' + totalscore);
            svgContainer.select("#total").text('Total Score: ' + totalscore);

            svgContainer.select("#wrong").attr("display", "block");
            svgContainer.select("#minus")
                .text('- ' + minus)
                .attr("display", "block");
                
            minus = minus + 2;
        }

        else {
            minus = 1;
            subjTrials.minusscore = minus;

            totalscore = totalscore - minus;
            money = totalscore * 0.05;


            if (money < 0) {
                money = 0;
            }

            if (money > 20) {
                money = 20;
            }

            continueFail = true;

            svgContainer.select("#total2").text('Total Score: ' + totalscore);
            svgContainer.select("#total").text('Total Score: ' + totalscore);
            svgContainer.select("#wrong").attr("display", "block");
            svgContainer.select("#minus")
                .text('- ' + minus)
                .attr("display", "block");

            minus = minus + 2;
        }
    }

    else {
        subjTrials.minusscore = 0;
        svgContainer.select("#correct").attr("display", "block");
    }

    setTimeout(nextTrial, 500);
}

// Function to start recording and recognizing speech
function startRecording() {
    csvContent = "Word,Time\n";

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            audioChunks = []; // Reset the audio chunks
            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };
            mediaRecorder.onstop = () => {
                let audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                uploadAudio(audioBlob);  // Upload the recorded audio
                console.log('Recording stopped');
            };
            mediaRecorder.start();
            console.log('Recording started');

            // Initialize speech recognition
            recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.lang = 'en-US';
            recognition.interimResults = false; // Only final results
            recognition.continuous = true;

            recognition.onresult = event => {
                let transcript = event.results[event.resultIndex][0].transcript.trim();
                // let combinedPhrases = processTranscript(transcript); // Process with compromise
                let words = transcript.split(' '); // Split the transcript into individual words
                let date = new Date();
                let time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`;

                // Append each word with the time to CSV content
                words.forEach(word => {
                    csvContent += `${word},${time}\n`;
                    console.log(`Recognized: ${word} at ${time}`);
                });
                
            };

            recognition.onerror = error => {
                console.error('Speech recognition error:', error);
            };
            
            // Start speech recognition
            recognition.start();
            isRecording = true;
            console.log('Speech recognition started');
        })
        .catch(error => {
            console.error('Error accessing audio:', error);
        });
}

// Function to stop recording and recognizing speech
function stopRecording() {
    if (isRecording) {
        mediaRecorder.stop();
        recognition.stop();
        saveCSV();
        isRecording = false;
    }
}

// Function to save the CSV file
function saveCSV() {
    const storageRef = firebase.storage().ref();
    const fileName = `${subject.id}-${categoryname}-${Date.now()}.csv`;
    const csvRef = storageRef.child(`transcripts/${subject.id}/${fileName}`);

    // Convert CSV content to Blob
    const csvBlob = new Blob([csvContent], { type: 'text/csv' });

    // Start the upload task
    const uploadTask = csvRef.put(csvBlob);

    uploadTask.on('state_changed',
        function (snapshot) {
            // Handle upload progress
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
        },
        function (error) {
            // Handle upload errors
            console.error('Upload failed:', error);
        },
        function () {
            // Handle successful upload
            uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
                console.log('CSV file saved and available at', downloadURL);
            });
        }
    );
}

// Function to upload audio (as in your existing code)
function uploadAudio(audioBlob) {
    const storageRef = firebase.storage().ref();
    const fileName = `${subject.id}-${categoryname}-${Date.now()}.webm`;
    const audioRef = storageRef.child(`audio-recordings/${subject.id}/${fileName}`);

    const uploadTask = audioRef.put(audioBlob);
    uploadTask.on('state_changed',
        snapshot => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
        },
        error => {
            console.error('Upload failed:', error);
        },
        () => {
            uploadTask.snapshot.ref.getDownloadURL().then(downloadURL => {
                console.log('Audio upload successful! File available at', downloadURL);
            });
        }
    );
}

// Function to process transcript using compromise
function processTranscript(transcript) {
    let doc = nlp(transcript);
    // Extract and combine phrases
    let combinedPhrases = doc.match('#Noun+').out('text');
    return combinedPhrases.trim();  // Trim whitespace
}


function nextTrial(){

    svgContainer.select("#category").attr("display", "none");
    svgContainer.select("#score").attr("display", "none");
    svgContainer.select("#enter").attr("display", "none");
    svgContainer.select("#delay").attr("display", "none");
    svgContainer.select("#prepare").attr("display", "none");
    svgContainer.select("#attention").attr("display", "none");
    svgContainer.select("#circle").attr("display", "none");
    svgContainer.select("#triangle").attr("display", "none");

    subjTrials.experimentID = experiment_ID;
    subjTrials.id = subject.id.concat(trial.toString());
    subjTrials.name = subject.id;
    screen_height = window.screen.availHeight;
    screen_width = window.screen.availWidth;

    subjTrials.score = score;
    subjTrials.time = time;
    subjTrials.trialNum = trial;
    subjTrials.categoryname = categoryname;
    subjTrials.totalscore = totalscore;

    // Increment the trial count
    trial += 1;
    counter += 1;
    subject.currTrial = trial;
    isInDelay = false;
    Fail = true;

    recordTrialSubj(trialcollection, subjTrials);
    createSubject(subjectcollection, subject);

    if (trial < num_trials) {
        d3.select('#total').text('Total Score: ' + totalscore);
        d3.select('#time').text('Time left:  ' + time);

    subjTrials = {
        id: null,
        name: null,
        experimentID: null,
        startTime: [],
        switchTime: [],
        scoreTime: [],
        trialNum: [],
        categoryname: [],
        score: [],
        totalscore: [],
        minusscore:[],
        time:[],
        partshape:[],
        partshapeNum:[],
        trueshape:[],
        trueshapeNum:[],
        result:[],
        money:[],
    };

    startCategory();
    
    } else {
        // Checks whether the experiment is complete, if not continues to next trial
        document.exitPointerLock();
        endGame();
    }
}


// Function to start the game
function startGame() {
    target_files = "tgt_files/multiclamp_demo.json";
    fileName = target_files;
    console.log(fileName);
    subject.tgt_file = fileName;
    subjTrials.group_type = "null";
    $.getJSON(fileName, function (json) {
        target_file_data = json;
        gameSetup(target_file_data);
    });
}

// Function to end early
function endEarly() {

    closeFullScreen();
    $('html').css('cursor', 'auto');
    $('body').css('cursor', 'auto');
    $('body').css('background-color', 'white');
    $('html').css('background-color', 'white');

    d3.select('#category').attr('display', 'none');
    d3.select('#score').attr('display', 'none');
    d3.select('#total').attr('display', 'none');
    d3.select('#time').attr('display', 'none');

    svgContainer.select("#check1").attr("display", "none");
    svgContainer.select("#check2").attr("display", "none");
    svgContainer.select("#total2").attr("display", "none");
    svgContainer.select("#correct").attr("display", "none");
    svgContainer.select("#wrong").attr("display", "none");
    svgContainer.select("#minus").attr("display", "none");
    svgContainer.select("#press").attr("display", "none");
    show('container-failed', 'container-exp');
}

// Function that ends the game appropriately after the experiment has been completed
function endGame() {

    closeFullScreen();
    $('html').css('cursor', 'auto');
    $('body').css('cursor', 'auto');
    $('body').css('background-color', 'white');
    $('html').css('background-color', 'white');

    d3.select('#category').attr('display', 'none');
    d3.select('#score').attr('display', 'none');
    d3.select('#total').attr('display', 'none');
    d3.select('#time').attr('display', 'none');

    d3.select("#check1").attr("display", "none");
    d3.select("#check2").attr("display", "none");
    d3.select("#total2").attr("display", "none");
    d3.select("#correct").attr("display", "none");
    d3.select("#wrong").attr("display", "none");
    d3.select("#minus").attr("display", "none");
    d3.select("#press").attr("display", "none");

    show('container-not-an-ad', 'container-exp');
}

document.addEventListener('DOMContentLoaded', function () {
    // // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
    // // The Firebase SDK is initialized and available here!
    //
    // firebase.auth().onAuthStateChanged(user => { });
    // firebase.database().ref('/path/to/ref').on('value', snapshot => { });
    // firebase.messaging().requestPermission().then(() => { });
    // firebase.storage().ref('/path/to/ref').getDownloadURL().then(() => { });
    //
    // // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
});