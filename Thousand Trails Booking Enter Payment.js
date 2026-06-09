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

        var errorMessage = await inputEnterPaymentFormAndSubmit();

        if (errorMessage) {
            console.error(errorMessage);
        } else {
            console.log("Payment form submitted successfully!");
        }
    } catch (error) {
        console.error("An error occurred during form submission:", error);
    }
}

function inputEnterPaymentFormAndSubmit() {
    var cbMobileOptIn = document.getElementById("cbMobileOptIn");
    var policyAgreement = document.getElementById("policyAgreement");
    var btnConfirm = document.getElementById("btnConfirm");
    var errorMsgDiv = document.getElementById("errorMsg");

    if (cbMobileOptIn && policyAgreement && btnConfirm && errorMsgDiv) {
        // Check the SMS Opt-In checkbox
        cbMobileOptIn.checked = true;

        // Check the Policy Agreement checkbox
        policyAgreement.checked = true;

        // Add event listener for the click event of the Book Reservation button
        btnConfirm.addEventListener("click", function() {
            // Check if the error message is displayed after clicking the button
            if (errorMsgDiv.style.display !== "none") {
                // Extract and log the error message
                var errorMessage = document.getElementById("divError").textContent.trim();
                console.error(errorMessage);
            } else {
                console.log("Payment form submitted successfully!");
            }
        });

        if (!canContinueThousandTrailsAutomation('Thousand Trails automation stopped before clicking the payment confirmation button.')) {
            return null;
        }

        // Click the Book Reservation button
        btnConfirm.click();

        return null; // No need to return anything immediately
    } else {
        return "Error: Required elements not found!";
    }
}
