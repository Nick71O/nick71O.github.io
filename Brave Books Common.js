console.log('HELLO WORLD!');
// Retrieve variables from localStorage
var isRunning = localStorage.getItem('isRunning');
console.log('common - isRunning: ' + isRunning);

function updateCountdown(autoRunTime) {
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

        if (distance <= 0 || isRunning) {
            clearInterval(countdownInterval);
            countdownLabel.textContent = "";
            toggleRunStop();
            return;
        }

        countdownLabel.textContent = hours + "h " + minutes + "m " + seconds + "s";
    }, 1000);
}
