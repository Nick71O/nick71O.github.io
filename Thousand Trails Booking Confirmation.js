async function launch() {
    try {
        const db = await initializeDB();
        console.log('DB initialized successfully.');
        await logSiteConstants(db);
        await logAvailabilityRecords(db);
        
        //sleep, clear database and start looking for the next booking
        console.log("\nSleeping...2 minutes");
        resetBookingAvailabilityProcess(db, 117000);

        //you do need to change the type of searching...
        redirectBookingPage();

    } catch (error) {
        console.error("An error occurred during form submission:", error);
    }
}

async function resetBookingAvailabilityProcess(db, sleepMilliseconds = 0) {
    // Clear database and reset availability
    await sleep(sleepMilliseconds);

    await addOrUpdateSiteConstant(db, 'ProcessArrivalDate', null);
    await addOrUpdateSiteConstant(db, 'ProcessDepartureDate', null);
    await addOrUpdateSiteConstant(db, 'AvailabileArrivalDate', null);
    await addOrUpdateSiteConstant(db, 'AvailabileDepartureDate', null);
    await resetAvailabilityTable(db);
}

async function redirectBookingPage() {
    var bookingQueryString = "?robot=78"
    var bookingURL = baseURL + "/reserve/index" + bookingQueryString

    console.log("Redirecting to the Campgrounds Booking Page");
    console.log(bookingURL);
    await sleep(500);
    window.location.replace(bookingURL);
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

launch()