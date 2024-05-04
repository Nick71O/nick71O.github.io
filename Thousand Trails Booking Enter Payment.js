
async function launch() {
    try {
        const db = await initializeDB();
        console.log('DB initialized successfully.');
        await logSiteConstants(db);
        await logAvailabilityRecords(db);
        
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

        // Click the Book Reservation button
        btnConfirm.click();

        return null; // No need to return anything immediately
    } else {
        return "Error: Required elements not found!";
    }
}


launch();