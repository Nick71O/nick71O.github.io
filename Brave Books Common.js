var attempts1 = 0; // Counter for discountCode1
var attempts2 = 0; // Counter for discountCode2
var isRunning = false;
var submitButtonInterval;

/*
 * Receives and processes global variables from another script (e.g., "Brave Books Checkout with Discount.js").
 * @param {Object} globalVariables - Object containing global variables.
 */
function initializeGlobalVariables(globalVariables) {
    // Process the received globalVariables object
    console.log("autoRunEnabled: " + globalVariables.autoRunEnabled);
    console.log("autoRunTime: " + globalVariables.autoRunTime);
    console.log("discountCode1: " + globalVariables.discountCode1);
    console.log("discountCode2: " + globalVariables.discountCode2);
    console.log("maxAttempts1: " + globalVariables.maxAttempts1);
    console.log("maxAttempts2: " + globalVariables.maxAttempts2);
    
    // Call Launch() after initializing global variables
    Launch();
  }
  
  // Call initializeGlobalVariables function in "Brave Books Checkout with Discount.js"
  // This function will be called from "Brave Books Checkout with Discount.js" and receive the globalVariables object as an argument
  // If initializeGlobalVariables is called from "Brave Books Checkout with Discount.js" before this script is loaded,
  // it will execute immediately after this code block due to asynchronous loading
  if (typeof globalVariables !== 'undefined') {
    initializeGlobalVariables(globalVariables);
  }

function Launch() {
    // Your code to execute after initializing variables
    console.log("Launch() function is executed!");
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
    
}

function reEnterAndSubmit() {
    if (!isRunning) {
        closeModal();
        return;
    }

    if (attempts1 < globalVariables.maxAttempts1) {
        useDiscountCode(globalVariables.discountCode1);
        attempts1++;
    } else if (attempts2 < globalVariables.maxAttempts2) {
        useDiscountCode(globalVariables.discountCode2);
        attempts2++;
    } else {
        console.log("Exceeded max retry attempts for both discount codes.");
        closeModal();
    }
}

function useDiscountCode(code) {
    console.log("Running useDiscountCode(), Loop " + (attempts1 + attempts2 + 1) + " of " + (globalVariables.maxAttempts1 + globalVariables.maxAttempts2));
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
                        }, globalVariables.delayCheckForErrorMessages);
                    } else {
                        console.log("'Apply' button not found.");
                        reEnterAndSubmit();
                    }
                }, globalVariables.delayBeforeApplyButton);
            }, globalVariables.delayBeforeInput);
        }, globalVariables.delayBeforeInput);
    } else {
        console.log("Input element with name 'reductions' not found.");
    }
}

function checkForErrorMessage(ctLoop = 0) {
    console.log("Running checkForErrorMessage(), Loop " + (ctLoop + 1) + " of " + globalVariables.maxCheckForErrorMessages);
    if (!isRunning) {
        closeModal();
        return;
    }

    var elements = document.querySelectorAll('*');
    var errorMessage = Array.from(elements).find(element => element.textContent.includes("Enter a valid discount code or gift card"));

    if (errorMessage) {
        console.log("Error Message Found: Enter a valid discount code or gift card");
        setTimeout(function () {
            reEnterAndSubmit();
        }, globalVariables.delayBeforeRetry);
    } else {
        var discountSpans = document.querySelectorAll('span');
        var discountSpanFound = Array.from(discountSpans).find(span => (
            span.textContent.toLowerCase() === globalVariables.discountCode1.toLowerCase() ||
            span.textContent.toLowerCase() === globalVariables.discountCode2.toLowerCase()
        ));

        if (discountSpanFound) {
            console.log("Discount span found: " + discountSpanFound.textContent);
            findAndClickPayNowButton();
        } else {
            console.log("No Discount Span Found.");

            if (ctLoop < globalVariables.maxCheckForErrorMessages) {
                setTimeout(function () {
                    checkForErrorMessage(ctLoop + 1);
                }, globalVariables.delayCheckForErrorMessagesRetry);
            } else {
                console.log("Exceeded maximum attempts to find Discount Span.");
                reEnterAndSubmit();
            }
        }
    }
}

function findAndClickPayNowButton(attempts = 0) {
    console.log("Running findAndClickPayNowButton(), Loop " + (attempts + 1) + " of " + globalVariables.maxCheckForPayNowButton);
    if (!isRunning) {
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

        if (attempts < globalVariables.maxCheckForPayNowButton) {
            setTimeout(function () {
                findAndClickPayNowButton(attempts + 1);
            }, globalVariables.delayCheckForPayNowButton);
        } else {
            console.log("Exceeded maximum attempts to find the 'Pay now' button.");
            reEnterAndSubmit();
        }
    }
}

function waitForSubmitButtonEnabled(submitButton) {
    if (submitButton && !submitButton.disabled) {
        submitButton.click();
    } else {
        submitButtonInterval = setInterval(function () {
            if (!isRunning) {
                clearInterval(submitButtonInterval);
                closeModal();
                return;
            }
            if (submitButton && !submitButton.disabled) {
                clearInterval(submitButtonInterval);
                submitButton.click();
            }
        }, globalVariables.delaySubmitButtonEnabled);
    }
}

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

    console.log("Target Time:", targetDate.toLocaleTimeString());

    var countdownInterval = setInterval(function () {
        var now = new Date().getTime();
        var distance = targetDate - now;

        var hours = Math.floor(distance / (1000 * 60 * 60));
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);

        //console.log("Remaining Time:", hours + "h " + minutes + "m " + seconds + "s");

        if (distance <= 0 || isRunning) {
            clearInterval(countdownInterval);
            countdownLabel.textContent = "";
            toggleRunStop();
            return;
        }

        countdownLabel.textContent = hours + "h " + minutes + "m " + seconds + "s";
    }, 1000);
}


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

    var countdownContainer = document.createElement("div");
    countdownContainer.id = "countdownContainer";
    
    var autoStartCheckbox = document.createElement("input");
    autoStartCheckbox.type = "checkbox";
    autoStartCheckbox.id = "autoStartCheckbox";
    autoStartCheckbox.checked = globalVariables.autoRunEnabled;

    var autoStartLabel = document.createElement("label");
    autoStartLabel.textContent = "Starting";
    autoStartLabel.setAttribute("for", "autoStartCheckbox");

    var countdownLabel = document.createElement("label");
    countdownLabel.id = "countdownLabel";
    countdownLabel.textContent = "";

    countdownContainer.appendChild(autoStartCheckbox);
    countdownContainer.appendChild(autoStartLabel);
    countdownContainer.appendChild(countdownLabel);
    modalContent.appendChild(countdownContainer);

    autoStartCheckbox.addEventListener("change", function () {
        var isChecked = autoStartCheckbox.checked;
        if (isChecked) {
            console.log("Auto Starting checkbox checked. Starting countdown.");
            updateCountdown(globalVariables.autoRunTime);
        } else {
            console.log("Auto Starting checkbox unchecked. Stopping countdown.");
            clearInterval(countdownInterval); // Clear any ongoing countdown
            countdownLabel.textContent = ""; // Clear the countdown display
        }
    });

    document.body.appendChild(modal);
    modal.style.display = "block";
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
            isRunning = true;
            attempts1 = 0; // Reset attempts for discountCode1
            attempts2 = 0; // Reset attempts for discountCode2
            console.log("---RUNNING!---");
            reEnterAndSubmit();
        }
        else {
            runStopButton.textContent = "Run";
            isRunning = false;
            console.log("---STOPPED!---");
        }
    }
}


