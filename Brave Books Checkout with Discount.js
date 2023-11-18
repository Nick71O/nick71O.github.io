console.log('HELLO WORLD!');
function initializeDiscountVariables(callback) {
    console.log('HELLO WORLD2!');
    var discountVariables = {
      discountCode1: "ARTIST",
      discountCode2: "ARTIST",
      autoRunTime: "3:30 PM",
      maxAttempts1: 5,
      maxAttempts2: 495,
      delayBeforeRetry: 100,
      delayBeforeInput: 50,
      delayBeforeApplyButton: 50,
      delaySubmitButtonEnabled: 100,
      maxCheckForErrorMessages: 50,
      delayCheckForErrorMessages: 500,
      delayCheckForErrorMessagesRetry: 100,
      maxCheckForPayNowButton: 50,
      delayCheckForPayNowButton: 100,
    };
  
    // Call the callback function and pass the variables object
    callback(discountVariables);
  }


// Retrieve variables from localStorage

// Access the globals object or the globalVariables function from the existing code
//var globals = window.globals; // Accessing the exposed globals object

//console.log('common - isRunning: ' + isRunning);
/*
// Check if globals is defined before accessing the global variables
if (typeof globals !== 'undefined') {
// Access global variables from the existing code
var discountCode1 = globals.getDiscountCode1();
var discountCode2 = globals.getDiscountCode2();
var isRunning = globals.getIsRunning();
// ... (access other variables)

console.log("discountCode1:" + discountCode1); // Access discountCode1 from the existing code
console.log("discountCode2: " + discountCode2); // Access discountCode2 from the existing code
console.log("isRunning: " + isRunning); // Access discountCode2 from the existing code
*/

/*
function updateCountdown(autoRunTime, isRunningRef) {
    var countdownLabel = document.getElementById("countdownLabel");

    // Parse the autoRunTime into hours, minutes, and AM/PM
    var timeComponents = autoRunTime.split(" ");
    var time = timeComponents[0].split(":");
    var targetHours = parseInt(time[0], 10);
    var targetMinutes = parseInt(time[1], 10);
    var ampm = timeComponents[1].toUpperCase();

    // Adjust targetHours for PM if necessary
    if (ampm === "PM" && targetHours < 12) {
        targetHours += 12;
    }

    // Adjust targetHours for midnight (12 AM)
    if (ampm === "AM" && targetHours === 12) {
        targetHours = 0;
    }

    // Set the target time to today with the specified hours and minutes
    var targetDate = new Date();
    targetDate.setHours(targetHours);
    targetDate.setMinutes(targetMinutes);
    targetDate.setSeconds(0);

    // If the target time is in the past, set it for tomorrow
    var currentDate = new Date();
    if (targetDate < currentDate) {
        targetDate.setDate(targetDate.getDate() + 1);
    }

    var countdownInterval = setInterval(function () {
        var now = new Date().getTime();
        var distance = targetDate - now;

        var hours = Math.floor(distance / (1000 * 60 * 60));
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);

        if (distance <= 0 || isRunningRef.value) {
            clearInterval(countdownInterval);
            countdownLabel.textContent = "";
            toggleRunStop();
            return;
        }

        countdownLabel.textContent = hours + "h " + minutes + "m " + seconds + "s";
    }, 1000);
}
*/
/*
} else {
    console.log('globals is not defined. Make sure to include the existing code that defines globals.');
}
*/