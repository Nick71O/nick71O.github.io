﻿//var discountCode1 = "ARTIST"; // First discount code
////var discountCode2 = "ARTIST"; // Second discount code
var autoRunTime = "4:30 AM"; // Replace this with your desired autoRunTime (e.g., "8:58 AM")
var attempts1 = 0; // Counter for discountCode1
var attempts2 = 0; // Counter for discountCode2
var maxAttempts1 = 5; // Number of times to use discountCode1 before switching to discountCode2
var maxAttempts2 = 495; // Number of times to use discountCode2 before stopping
//var isRunning = false;
var submitButtonInterval;

var delayBeforeRetry = 100;

var delayBeforeInput = 50;
var delayBeforeApplyButton = 50;
var delaySubmitButtonEnabled = 100;

var maxCheckForErrorMessages = 50;
var delayCheckForErrorMessages = 500;
var delayCheckForErrorMessagesRetry = 100;

var maxCheckForPayNowButton = 50; 
var delayCheckForPayNowButton = 100;

// Encapsulate global variables within a function
function globalVariables() {
    var discountCode1 = "ARTIST";
    var discountCode2 = "ARTIST";
    var isRunning = false;
    // ... (other variables)

    // Expose necessary variables or functions externally
    return {
        //discountCode1,
        //discountCode2,
        //isRunning
        // ... (other variables)

        getDiscountCode1: function() {
            return discountCode1;
        },
        getDiscountCode2: function() {
            return discountCode2;
        },
        getIsRunning: function() {
            return isRunning;
        }
    };

    
}

// Access global variables using the exposed functions
var globals = globalVariables();


function initialize() {
/*
    // Create a script element
    var script = document.createElement("script");

    // Set the src attribute to the path of your countdown.js file
    script.src = "https://nick71o.github.io/Brave%20Books%20Common.js";

    // Append the script element to the HTML body or head
    document.body.appendChild(script);
    console.log("script: " + script.src);
*/
}

function reEnterAndSubmit() {
    if (!globals.isRunning) {
        closeModal();
        return;
    }

    if (attempts1 < maxAttempts1) {
        useDiscountCode(globals.discountCode1);
        attempts1++;
    } else if (attempts2 < maxAttempts2) {
        useDiscountCode(globals.discountCode2);
        attempts2++;
    } else {
       //nmh console.log("Exceeded max retry attempts for both discount codes.");
        closeModal();
    }
}

function useDiscountCode(code) {
    console.log("Running useDiscountCode(), Loop " + (attempts1 + attempts2 + 1) + " of " + (maxAttempts1 + maxAttempts2));
    var reductionsInput = document.getElementsByName("reductions")[0];

    if (reductionsInput) {
        reductionsInput.focus();

        // Input the text
        reductionsInput.value = code;
        console.log("Inputted: " + code);

        // Create a new 'input' event
        var inputEvent = new Event('input', { bubbles: true, cancelable: true });
        reductionsInput.dispatchEvent(inputEvent);

        setTimeout(function () {
            // Clear the input
            reductionsInput.value = "";
            console.log("Cleared the input field.");

            // Create another 'input' event after clearing
            reductionsInput.dispatchEvent(inputEvent);

            setTimeout(function () {
                // Input the text again
                reductionsInput.value = code;
                console.log("Inputted again: " + code);

                // Create another 'input' event after inputting again
                reductionsInput.dispatchEvent(inputEvent);

                setTimeout(function () {
                    var submitButton = document.querySelector('button[type="submit"][aria-label="Apply Discount Code"]');
                    if (submitButton) {
                        console.log("'Apply' button found.");
                        waitForSubmitButtonEnabled(submitButton);
                        setTimeout(function () {
                            checkForErrorMessage();
                        }, delayCheckForErrorMessages);
                    } else {
                        console.log("'Apply' button not found.");
                        reEnterAndSubmit();
                    }
                }, delayBeforeApplyButton);
            }, delayBeforeInput);
        }, delayBeforeInput);
    } else {
        console.log("Input element with name 'reductions' not found.");
    }
}

function checkForErrorMessage(ctLoop = 0) {
    console.log("Running checkForErrorMessage(), Loop " + (ctLoop + 1) + " of " + maxCheckForErrorMessages);
    if (!globals.isRunning) {
        closeModal();
        return;
    }

    var elements = document.querySelectorAll('*');
    var errorMessage = Array.from(elements).find(element => element.textContent.includes("Enter a valid discount code or gift card"));

    if (errorMessage) {
        console.log("Error Message Found: Enter a valid discount code or gift card");
        setTimeout(function () {
            reEnterAndSubmit();
        }, delayBeforeRetry);
    } else {
        var discountSpans = document.querySelectorAll('span');
        var discountSpanFound = Array.from(discountSpans).find(span => (
            span.textContent.toLowerCase() === globals.discountCode1.toLowerCase() ||
            span.textContent.toLowerCase() === globals.discountCode2.toLowerCase()
        ));

        if (discountSpanFound) {
            console.log("Discount span found: " + discountSpanFound.textContent);
            findAndClickPayNowButton();
        } else {
            console.log("No Discount Span Found.");

            if (ctLoop < maxCheckForErrorMessages) {
                setTimeout(function () {
                    checkForErrorMessage(ctLoop + 1);
                }, delayCheckForErrorMessagesRetry);
            } else {
                //nmh console.log("Exceeded maximum attempts to find Discount Span.");
                reEnterAndSubmit();
            }
        }
    }
}

function findAndClickPayNowButton(attempts = 0) {
    console.log("Running findAndClickPayNowButton(), Loop " + (attempts + 1) + " of " + maxCheckForPayNowButton);
    if (!globals.isRunning) {
        closeModal();
        return;
    }

    var payNowButton = document.querySelector('button[type="button"][aria-label="Pay now"]');

    if (!payNowButton) {
        var buttons = document.querySelectorAll('button[type="submit"]');
        for (var i = 0; i < buttons.length; i++) {
            var button = buttons[i];
            var buttonText = button.textContent;
            if (buttonText.includes("Pay now")) {
                payNowButton = button;
                break;
            }
        }
    }

    if (payNowButton) {
        payNowButton.click();
        console.log("Pay now button found and clicked!");
        closeModal();
    } else {
        console.log("Pay now button not found.");

        if (attempts < maxCheckForPayNowButton) {
            setTimeout(function () {
                findAndClickPayNowButton(attempts + 1);
            }, delayCheckForPayNowButton);
        } else {
            //nmh console.log("Exceeded maximum attempts to find the 'Pay now' button.");
            reEnterAndSubmit();
        }
    }
}

function waitForSubmitButtonEnabled(submitButton) {
    if (submitButton && !submitButton.disabled) {
        submitButton.click();
    } else {
        submitButtonInterval = setInterval(function () {
            if (!globals.isRunning) {
                clearInterval(submitButtonInterval);
                closeModal();
                return;
            }
            if (submitButton && !submitButton.disabled) {
                clearInterval(submitButtonInterval);
                submitButton.click();
            }
        }, delaySubmitButtonEnabled);
    }
}
/*
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

    //console.log("Target Time:", targetDate.toLocaleTimeString());

    var countdownInterval = setInterval(function () {
        var now = new Date().getTime();
        var distance = targetDate - now;

        var hours = Math.floor(distance / (1000 * 60 * 60));
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);

        //console.log("Remaining Time:", hours + "h " + minutes + "m " + seconds + "s");

        if (distance <= 0 || globals.isRunning) {
            clearInterval(countdownInterval);
            countdownLabel.textContent = "";
            toggleRunStop();
            return;
        }

        countdownLabel.textContent = hours + "h " + minutes + "m " + seconds + "s";
    }, 1000);
}
*/

function showModal() {
    var modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "myModal";

    var modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    var runStopButton = document.createElement("button");
    runStopButton.textContent = "Run";
    runStopButton.id = "runStopButton";
    runStopButton.onclick = toggleRunStop;

    modalContent.appendChild(runStopButton);
    modal.appendChild(modalContent);

    // Creating countdownLabel outside the button
    var countdownContainer = document.createElement("div");
    countdownContainer.id = "countdownContainer";

    var countdownLabel = document.createElement("label");
    countdownLabel.id = "countdownLabel";
    countdownLabel.textContent = "";

    countdownContainer.appendChild(countdownLabel);
    modalContent.appendChild(countdownContainer);

    document.body.appendChild(modal);

    modal.style.display = "block";

    updateCountdown(autoRunTime);
}


function closeModal() {
    var runStopButton = document.getElementById("runStopButton");
    if (runStopButton) {
        if (runStopButton.textContent === "Stop") {
            runStopButton.click();
            console.log("Stopping the automation.");
        }
    } else {
        console.log("Run/Stop button not found in the modal.");
    }
}

function toggleRunStop() {
    var runStopButton = document.getElementById("runStopButton");
    if (runStopButton) {
        if (runStopButton.textContent === "Run") {
            runStopButton.textContent = "Stop";
            globals.isRunning = true;
            attempts1 = 0; // Reset attempts for discountCode1
            attempts2 = 0; // Reset attempts for discountCode2
            console.log("---RUNNING!---");
            reEnterAndSubmit();
        }
        else {
            runStopButton.textContent = "Run";
            globals.isRunning = false;
            console.log("---STOPPED!---");
        }
    }
}

initialize();
console.log("Show Modal");
showModal();

// Inject CSS for the modal and content
var css = `
        /* Styling for the modal */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100px;
            height: 94px;
            background-color: rgba(0, 0, 0, 0.7);
        }
        .modal-content {
            background-color: #f5f5f5;
            margin: 10px;
            padding: 8px 4px 2px 4px;
            border-radius: 2px;
            font-size: 10px;
            height: -webkit-fill-available;
        }
        #countdownContainer {
            margin: 6px 0px 3px 0px;
            text-align: center;
        }
        #countdownLabel {
            font-size: 9px;
            color: black;
        }
        #runStopButton {
            display: block;
            margin: 0 auto;
            padding: 4px 12px 4px 12px;
            background-color: #007bff;
            color: white;
            font-size: 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            text-align: center;
            text-decoration: none;
        }
        #runStopButton:hover {
            background-color: #0056b3;
        }
    `;
var style = document.createElement("style");
style.type = "text/css";
style.appendChild(document.createTextNode(css));
document.head.appendChild(style);

