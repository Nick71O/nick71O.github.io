var discountCode1 = "ARTIST"; // First discount code
var discountCode2 = "ARTIST"; // Second discount code
var attempts1 = 0; // Counter for discountCode1
var attempts2 = 0; // Counter for discountCode2
var maxAttempts1 = 5; // Number of times to use discountCode1 before switching to discountCode2
var maxAttempts2 = 495; // Number of times to use discountCode2 before stopping
var isRunning = false;
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




function reEnterAndSubmit() {
    if (!isRunning) {
        closeModal();
        return;
    }

    if (attempts1 < maxAttempts1) {
        useDiscountCode(discountCode1);
        attempts1++;
    } else if (attempts2 < maxAttempts2) {
        useDiscountCode(discountCode2);
        attempts2++;
    } else {
        console.log("Exceeded max retry attempts for both discount codes.");
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
        }, delayBeforeRetry);
    } else {
        var discountSpans = document.querySelectorAll('span');
        var discountSpanFound = Array.from(discountSpans).find(span => (
            span.textContent.toLowerCase() === discountCode1.toLowerCase() ||
            span.textContent.toLowerCase() === discountCode2.toLowerCase()
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
                console.log("Exceeded maximum attempts to find Discount Span.");
                reEnterAndSubmit();
            }
        }
    }
}

function findAndClickPayNowButton(attempts = 0) {
    console.log("Running findAndClickPayNowButton(), Loop " + (attempts + 1) + " of " + maxCheckForPayNowButton);
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

        if (attempts < maxCheckForPayNowButton) {
            setTimeout(function () {
                findAndClickPayNowButton(attempts + 1);
            }, delayCheckForPayNowButton);
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
        }, delaySubmitButtonEnabled);
    }
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
    //runStopButton.style.fontSize = "18px";

    modalContent.appendChild(runStopButton);
    modal.appendChild(modalContent);

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

console.log("Show Modal");
showModal();

// Inject CSS
var css = `
    /* Styling for the modal */
    .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 85px;
        height: 85px;
        background-color: rgba(0, 0, 0, 0.7);
    }
    .modal-content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #fff;
        padding: 15px;
        border-radius: 7px;
        font-size: 18px;
    }
    `;
var style = document.createElement("style");
style.type = "text/css";
style.appendChild(document.createTextNode(css));
document.head.appendChild(style);

