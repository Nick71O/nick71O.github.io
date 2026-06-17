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

        const submissionResult = await inputEnterPaymentFormAndSubmit(db);

        if (!submissionResult || submissionResult.status === "stopped") {
            return;
        }

        if (submissionResult.status === "error") {
            console.error(submissionResult.message);
            return;
        }

        if (submissionResult.status === "pending") {
            console.warn(submissionResult.message);
            return;
        }

        console.log(`Book Reservation submission response detected: ${submissionResult.responseState}. Waiting for confirmation page.`);
    } catch (error) {
        console.error("An error occurred during form submission:", error);
    }
}

async function inputEnterPaymentFormAndSubmit(db) {
    const formReady = await waitForPaymentFormReady();
    if (!formReady) {
        return {
            status: "error",
            message: "Error: Required payment form elements not found!"
        };
    }

    const cbMobileOptIn = document.getElementById("cbMobileOptIn");
    const policyAgreement = document.getElementById("policyAgreement");
    const btnConfirm = document.getElementById("btnConfirm");

    checkOptionalCheckbox(cbMobileOptIn, "SMS Opt-In");
    checkRequiredCheckbox(policyAgreement, "policy agreement");

    if (!policyAgreement.checked) {
        return {
            status: "error",
            message: "Error: Policy agreement checkbox could not be checked."
        };
    }

    if (!canContinueThousandTrailsAutomation('Thousand Trails automation stopped before clicking the payment confirmation button.')) {
        return { status: "stopped" };
    }

    const bookReservationDelayMilliseconds = await getEnterPaymentBookReservationDelayMilliseconds(db);
    const maxBookReservationAttempts = 8;

    for (let attempt = 1; attempt <= maxBookReservationAttempts; attempt++) {
        console.log(`Throttling...${formatDelayMillisecondsForLog(bookReservationDelayMilliseconds)} before clicking Book Reservation (attempt ${attempt}/${maxBookReservationAttempts})`);
        const sleepCompleted = await sleep(bookReservationDelayMilliseconds);
        if (!sleepCompleted || !canContinueThousandTrailsAutomation('Thousand Trails automation stopped before clicking the payment confirmation button.')) {
            return { status: "stopped" };
        }

        btnConfirm.disabled = false;
        clearPaymentErrorText();
        console.log(`Clicking Book Reservation button (attempt ${attempt}/${maxBookReservationAttempts}).`);
        btnConfirm.click();

        let responseState = await waitForBookReservationResponse(10000);
        if (responseState === "no-response" && typeof window.confirmReservation === "function") {
            console.warn("Book Reservation click did not trigger a visible response. Calling confirmReservation() directly.");
            window.confirmReservation();
            responseState = await waitForBookReservationResponse(15000);
        }

        const submissionResult = getBookReservationSubmissionResult(responseState);
        if (submissionResult.status !== "error" || attempt === maxBookReservationAttempts) {
            return submissionResult;
        }

        console.warn(`${submissionResult.message} Retrying Book Reservation.`);
    }

    return {
        status: "error",
        message: "Book Reservation retry loop ended without a successful response."
    };
}

function getBookReservationSubmissionResult(responseState) {
    if (responseState === "stopped" || responseState === "human-verification") {
        return { status: "stopped", responseState };
    }

    if (responseState === "payment-error") {
        return {
            status: "error",
            responseState,
            message: `Payment error after clicking Book Reservation: ${getPaymentErrorText() || "Unknown payment error."}`
        };
    }

    if (responseState === "navigation") {
        return {
            status: "submitted",
            responseState
        };
    }

    if (responseState === "request-pending" || responseState === "request-complete") {
        return {
            status: "pending",
            responseState,
            message: `Book Reservation response is ${responseState}. Not marking payment submission as successful yet.`
        };
    }

    return {
        status: "error",
        responseState,
        message: `Book Reservation click did not produce a successful response. Response state: ${responseState}.`
    };
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
    let loadingSpinnerStoppedAt = null;

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
            loadingSpinnerStoppedAt = null;
        } else if (sawLoadingSpinner) {
            if (loadingSpinnerStoppedAt === null) {
                loadingSpinnerStoppedAt = Date.now();
            } else if (Date.now() - loadingSpinnerStoppedAt >= 1000) {
                return "request-complete";
            }
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

function clearPaymentErrorText() {
    const reservationErrorsElement = document.getElementById("reservationErrors");
    if (!reservationErrorsElement) {
        return;
    }

    reservationErrorsElement.textContent = "";
    reservationErrorsElement.style.display = "none";
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
