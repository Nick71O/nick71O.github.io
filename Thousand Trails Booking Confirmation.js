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
        launch();
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
            console.log(`Script loaded: ${src}`);
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
        console.log('Hello from Thousand Trails Booking Confirmation');
        const db = await initializeDB();
        console.log('DB initialized successfully.');
        await logSiteConstants(db);
        await logAvailabilityRecords(db);

        const scDesiredArrivalConstant = await getSiteConstant(db, 'DesiredArrivalDate');
        const scDesiredDepartureConstant = await getSiteConstant(db, 'DesiredDepartureDate');
        const scBookedArrivalConstant = await getSiteConstant(db, 'BookedArrivalDate');
        const scBookedDepartureConstant = await getSiteConstant(db, 'BookedDepartureDate');
        const scAvailabileArrivalConstant = await getSiteConstant(db, 'AvailableArrivalDate');
        const scAvailabileDepartureConstant = await getSiteConstant(db, 'AvailableDepartureDate');
        let scDesiredArrivalDate = null;
        let scDesiredDepartureDate = null;
        let scBookedArrivalDate = null;
        let scBookedDepartureDate = null;
        let scAvailableArrivalDate = null;
        let scAvailableDepartureDate = null;

        // Check if constants were retrieved successfully and if their values are not null or empty
        if (scDesiredArrivalConstant && scDesiredDepartureConstant &&
            scDesiredArrivalConstant.value !== null && scDesiredDepartureConstant.value !== null &&
            scDesiredArrivalConstant.value.trim() !== '' && scDesiredDepartureConstant.value.trim() !== '') {

            scDesiredArrivalDate = scDesiredArrivalConstant.value;
            scDesiredDepartureDate = scDesiredDepartureConstant.value;

            // Calculate the number of nights
            const oneDay = 24 * 60 * 60 * 1000; // hours * minutes * seconds * milliseconds
            const dateDifference = Math.abs(new Date(scDesiredDepartureDate).getTime() - new Date(scDesiredArrivalDate).getTime());
            const scDesiredNumberOfNights = Math.round(dateDifference / oneDay);

            console.log("SiteConstants Desired Dates to Book\n   Arrival: " + scDesiredArrivalDate + "    Departure: " + scDesiredDepartureDate + "    Number of Nights: " + scDesiredNumberOfNights);
        } else {
            console.error('SiteConstant Desired Arrival or Departure constant is null, empty, or not found.');
        }

        if (scBookedArrivalConstant && scBookedDepartureConstant &&
            scBookedArrivalConstant.value !== null && scBookedDepartureConstant.value !== null &&
            scBookedArrivalConstant.value.trim() !== '' && scBookedDepartureConstant.value.trim() !== '') {

            scBookedArrivalDate = scBookedArrivalConstant.value;
            scBookedDepartureDate = scBookedDepartureConstant.value;

            // Calculate the number of nights
            const oneDay = 24 * 60 * 60 * 1000; // hours * minutes * seconds * milliseconds
            const dateDifference = Math.abs(new Date(scBookedDepartureDate).getTime() - new Date(scBookedArrivalDate).getTime());
            const scBookedNumberOfNights = Math.round(dateDifference / oneDay);

            console.log("SiteConstants Booked Dates\n   Arrival: " + scBookedArrivalDate + "    Departure: " + scBookedDepartureDate + "    Number of Nights: " + scBookedNumberOfNights);
        } else {
            console.log('SiteConstant Booked Arrival or Departure constant is null, empty, or not found.');
        }

        // Check if Availabile Arrival and Departure constants are not null and their values are valid dates
        if (scAvailabileArrivalConstant && scAvailabileDepartureConstant &&
            scAvailabileArrivalConstant.value !== null && scAvailabileDepartureConstant.value !== null &&
            isValidDate(scAvailabileArrivalConstant.value) && isValidDate(scAvailabileDepartureConstant.value)) {

            // Proceed with operations only if the constants are valid
            scAvailableArrivalDate = scAvailabileArrivalConstant.value;
            scAvailableDepartureDate = scAvailabileDepartureConstant.value;

            // Calculate the number of nights
            const oneDay = 24 * 60 * 60 * 1000; // hours * minutes * seconds * milliseconds
            const dateDifference = Math.abs(new Date(scAvailableDepartureDate).getTime() - new Date(scAvailableArrivalDate).getTime());
            const scAvailabileNumberOfNights = Math.round(dateDifference / oneDay);

            console.log("SiteConstants Availabile Dates to Book\n   Arrival: " + scAvailableArrivalDate + "    Departure: " + scAvailableDepartureDate + "    Number of Nights: " + scAvailabileNumberOfNights);
        } else {
            console.log('SiteConstant Availabile Arrival or Departure constant is null, empty, or not a valid date.');
        }

        const combinedBookingDates = combineBookingDates(scBookedArrivalDate, scBookedDepartureDate, scAvailableArrivalDate, scAvailableDepartureDate);
        if (combinedBookingDates) {
            scBookedArrivalDate = combinedBookingDates.bookedArrivalDate.toLocaleDateString('en-US', formatDateOptions);
            scBookedDepartureDate = combinedBookingDates.bookedDepartureDate.toLocaleDateString('en-US', formatDateOptions);

            // Calculate the number of nights
            const oneDay = 24 * 60 * 60 * 1000; // hours * minutes * seconds * milliseconds
            const dateDifference = Math.abs(new Date(scBookedDepartureDate).getTime() - new Date(scBookedArrivalDate).getTime());
            const scBookedNumberOfNights = Math.round(dateDifference / oneDay);

            console.log("Combined Booked Dates\n   Arrival: " + scBookedArrivalDate + "    Departure: " + scBookedDepartureDate + "    Number of Nights: " + scBookedNumberOfNights);
        
            //set the SiteConstant with the newly booked dates
            await addOrUpdateSiteConstant(db, 'BookedArrivalDate', scBookedArrivalDate);
            await addOrUpdateSiteConstant(db, 'BookedDepartureDate', scBookedDepartureDate);

            //bookingPreference switch: consecutive | leadingtrailing
            await addOrUpdateSiteConstant(db, 'BookingPreference', 'leadingtrailing');

        } else {
            console.log('Dates cannot be combined without gaps.');
        }

        // Call the sendPushMessage function with the required parameters
        pushSiteBookedMessage(composeMessageToSend('step4', scDesiredArrivalDate, scDesiredDepartureDate, scAvailableArrivalDate, 
            scAvailableDepartureDate, scBookedArrivalDate, scBookedDepartureDate, null, null));


        //clear database, sleep and start looking for the next booking
        resetBookingAvailabilityProcess(db, 240000);
        console.log("\nSleeping...4 minutes");

        //you do need to change the type of searching...
        redirectBookingPage();

    } catch (error) {
        console.error("An error occurred during form submission:", error);
    }
}

function combineBookingDates(existingArrivalDate, existingDepartureDate, newArrivalDate, newDepartureDate) {
    if (!existingArrivalDate && !existingDepartureDate && !newArrivalDate && !newDepartureDate) {
        return null; // Return null if all dates are missing
    } else if (!existingArrivalDate && !existingDepartureDate && newArrivalDate && newDepartureDate) {
        const newArrival = new Date(newArrivalDate);
        const newDeparture = new Date(newDepartureDate);
        return { bookedArrivalDate: newArrival, bookedDepartureDate: newDeparture };
    }

    // Convert dates to JavaScript Date objects
    const existingArrival = existingArrivalDate ? new Date(existingArrivalDate) : null;
    const existingDeparture = existingDepartureDate ? new Date(existingDepartureDate) : null;
    const newArrival = new Date(newArrivalDate);
    const newDeparture = new Date(newDepartureDate);

    // Combine dates without gaps
    if (existingDeparture && newDeparture.getTime() === existingArrival.getTime()) {
        return { bookedArrivalDate: newArrival, bookedDepartureDate: existingDeparture };
    } else if (existingArrival && existingDeparture && existingDeparture.getTime() === newArrival.getTime()) {
        return { bookedArrivalDate: existingArrival, bookedDepartureDate: newDeparture };
    } else {
        return null; // Dates cannot be combined without gaps
    }
}

async function resetBookingAvailabilityProcess(db, sleepMilliseconds = 0) {
    // Clear database and reset availability
    await sleep(sleepMilliseconds);

    await addOrUpdateSiteConstant(db, 'AvailableArrivalDate', null);
    await addOrUpdateSiteConstant(db, 'AvailableDepartureDate', null);
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
