// dynamically load additional scripts
loadScript('https://nick71o.github.io/Thousand%20Trails%20IndexedDB.js')
    .then(() => {
        // IndexedDB script has been successfully loaded
        return loadScript('https://nick71o.github.io/Thousand%20Trails%20Common.js');
    })
    .then(() => {
        // Common script has been successfully loaded
        return loadScript('https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js');
    })
    .then(() => {
        // Now you can safely use functions or variables from the loaded scripts here
        startThousandTrailsAutomation(launch);
    })
    .catch(error => {
        // Handle errors if any script fails to load
        console.error('Error loading scripts:', error);
    });


function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.defer = true;

        script.onload = () => {
            resolve();
        };

        script.onerror = () => {
            console.error(`Error loading script: ${src}`);
            reject(new Error(`Error loading script: ${src}`));
        };

        document.head.appendChild(script);
    });
}


async function launch() {
    try {
        console.log('Hello from Thousand Trails Booking Enter Payments');

        if (await handleUnexpectedLoginPageIfPresent({ reason: 'Member login page detected while entering payment.' })) {
            return;
        }

        const db = await initializeDB();
        console.log('DB initialized successfully.');
        if (await handleHumanVerificationIfPresent(db)) {
            return;
        }

        await logSiteConstants(db);
        await logAvailabilityRecords(db);

        if (!canContinueThousandTrailsAutomation('Thousand Trails automation stopped before submitting the payment form.')) {
            return;
        }

        var errorMessage = await inputEnterPaymentFormAndSubmit(db);

        if (errorMessage) {
            console.error(errorMessage);
        } else {
            console.log("Payment form submitted successfully!");
        }
    } catch (error) {
        console.error("An error occurred during form submission:", error);
    }
}

async function inputEnterPaymentFormAndSubmit(db) {
    const formReady = await waitForPaymentFormReady();
    if (!formReady) {
        return "Error: Required payment form elements not found!";
    }

    const cbMobileOptIn = document.getElementById("cbMobileOptIn");
    const policyAgreement = document.getElementById("policyAgreement");
    const btnConfirm = document.getElementById("btnConfirm");

    checkOptionalCheckbox(cbMobileOptIn, "SMS Opt-In");
    checkRequiredCheckbox(policyAgreement, "policy agreement");

    if (!policyAgreement.checked) {
        return "Error: Policy agreement checkbox could not be checked.";
    }

    if (!canContinueThousandTrailsAutomation('Thousand Trails automation stopped before clicking the payment confirmation button.')) {
        return null;
    }

    const bookReservationDelayMilliseconds = await getEnterPaymentBookReservationDelayMilliseconds(db);
    console.log(`Throttling...${formatDelayMillisecondsForLog(bookReservationDelayMilliseconds)} before clicking Book Reservation`);
    const sleepCompleted = await sleep(bookReservationDelayMilliseconds);
    if (!sleepCompleted || !canContinueThousandTrailsAutomation('Thousand Trails automation stopped before clicking the payment confirmation button.')) {
        return null;
    }

    btnConfirm.disabled = false;
    console.log("Clicking Book Reservation button.");
    btnConfirm.click();

    const responseState = await waitForBookReservationResponse(10000);
    if (responseState === "no-response" && typeof window.confirmReservation === "function") {
        console.warn("Book Reservation click did not trigger a visible response. Calling confirmReservation() directly.");
        window.confirmReservation();
    } else if (responseState === "payment-error") {
        console.error(getPaymentErrorText());
    } else {
        console.log(`Book Reservation response detected: ${responseState}.`);
    }

    return null;
}

async function waitForPaymentFormReady(timeoutMillis = 10000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMillis) {
        const policyAgreement = document.getElementById("policyAgreement");
        const btnConfirm = document.getElementById("btnConfirm");

        if (policyAgreement && btnConfirm && typeof window.confirmReservation === "function") {
            return true;
        }

        const sleepCompleted = await sleep(250);
        if (!sleepCompleted) {
            return false;
        }
    }

    return Boolean(document.getElementById("policyAgreement") && document.getElementById("btnConfirm"));
}

function checkOptionalCheckbox(checkbox, label) {
    if (!checkbox) {
        console.log(`${label} checkbox was not found; continuing without it.`);
        return;
    }

    checkRequiredCheckbox(checkbox, label);
}

function checkRequiredCheckbox(checkbox, label) {
    if (!checkbox.checked) {
        console.log(`Checking ${label} checkbox.`);
        checkbox.click();
    }

    if (!checkbox.checked) {
        checkbox.checked = true;
    }

    checkbox.dispatchEvent(new Event("input", { bubbles: true }));
    checkbox.dispatchEvent(new Event("change", { bubbles: true }));
}

async function waitForBookReservationResponse(timeoutMillis) {
    const startTime = Date.now();
    const startUrl = window.location.href;
    let sawLoadingSpinner = false;

    while (Date.now() - startTime < timeoutMillis) {
        if (!isThousandTrailsAutomationRunning()) {
            return "stopped";
        }

        if (isHumanVerificationPage()) {
            return "human-verification";
        }

        if (window.location.href !== startUrl) {
            return "navigation";
        }

        if (getPaymentErrorText()) {
            return "payment-error";
        }

        if (isPaymentRequestInProgress()) {
            sawLoadingSpinner = true;
        } else if (sawLoadingSpinner) {
            return "request-complete";
        }

        const sleepCompleted = await sleep(250);
        if (!sleepCompleted) {
            return "stopped";
        }
    }

    return sawLoadingSpinner ? "request-pending" : "no-response";
}

function isPaymentRequestInProgress() {
    const loadingElement = document.getElementById("loading1");
    return Boolean(loadingElement && loadingElement.classList.contains("open"));
}

function getPaymentErrorText() {
    const reservationErrorsElement = document.getElementById("reservationErrors");
    if (!reservationErrorsElement) {
        return "";
    }

    const style = window.getComputedStyle ? window.getComputedStyle(reservationErrorsElement) : null;
    if (style && (style.display === "none" || style.visibility === "hidden")) {
        return "";
    }

    return reservationErrorsElement.textContent.replace(/\s+/g, " ").replace(/^×\s*/, "").trim();
}
