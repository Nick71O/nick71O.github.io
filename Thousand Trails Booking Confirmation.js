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
        const scDesiredDatesArrayConstant = await getSiteConstant(db, 'DesiredDatesArray');
        const scBookingPreferenceConstant = await getSiteConstant(db, 'BookingPreference');
        const scBookedArrivalConstant = await getSiteConstant(db, 'BookedArrivalDate');
        const scBookedDepartureConstant = await getSiteConstant(db, 'BookedDepartureDate');
        const scAvailabileArrivalConstant = await getSiteConstant(db, 'AvailableArrivalDate');
        const scAvailabileDepartureConstant = await getSiteConstant(db, 'AvailableDepartureDate')
        let scDesiredArrivalDate = null;
        let scDesiredDepartureDate = null;
        let scDesiredDatesArray = null;
        let scBookingPreference = null;
        let scBookedArrivalDate = null;
        let scBookedDepartureDate = null;
        let scAvailableArrivalDate = null;
        let scAvailableDepartureDate = null;

        // Check if constants were retrieved successfully and if their values are not null or empty
        const isValidConstant = (constant) =>
            constant &&
            constant.value !== null &&
            constant.value.trim() !== '';

        if (isValidConstant(scDesiredArrivalConstant) && isValidConstant(scDesiredDepartureConstant)) {
            scDesiredArrivalDate = scDesiredArrivalConstant.value;
            scDesiredDepartureDate = scDesiredDepartureConstant.value;
            //console.log("SiteConstants Desired Dates to Book\n   Arrival: " + scDesiredArrivalDate + "    Departure: " + scDesiredDepartureDate);
        }

        if (isValidConstant(scBookingPreferenceConstant)) {
            scBookingPreference = scBookingPreferenceConstant.value.toLowerCase();
            console.log('Booking Preference:', scBookingPreference);
        }

        if (isValidConstant(scDesiredDatesArrayConstant) && scBookingPreference === 'datearray') {
            scDesiredDatesArray = JSON.parse(scDesiredDatesArrayConstant.value);
            //console.log('SiteConstant Desired Dates Array: ' + scDesiredDatesArray)
        }

        if (scDesiredDatesArray && scBookingPreference === 'datearray') {
            let desiredDatesInRange = getAllDatesInRangeOrArray(scDesiredDatesArray, null, null);
            //console.log('Desired Dates In Range:', desiredDatesInRange);
            let allConsecutiveRanges = getConsecutiveDateRanges(desiredDatesInRange);
            //console.log('allConsecutiveRanges: ', allConsecutiveRanges);
            const desiredDateRangeMessage = buildDateRangeMessage('Desired Dates to Book:', allConsecutiveRanges);
            console.log(desiredDateRangeMessage);
        } else if (scDesiredArrivalDate && scDesiredDepartureDate) {
            let desiredDatesInRange = getAllDatesInRangeOrArray(null, scDesiredArrivalDate, scDesiredDepartureDate);
            //console.log('Desired Dates In Range:', desiredDatesInRange);
            let allConsecutiveRanges = getConsecutiveDateRanges(desiredDatesInRange);
            //console.log('allConsecutiveRanges: ', allConsecutiveRanges);
            const desiredDateRangeMessage = buildDateRangeMessage('Desired Dates to Book:', allConsecutiveRanges);
            console.log(desiredDateRangeMessage);
        } else {
            console.error('SiteConstant Desired Arrival, Departure or Array constant is null, empty, or not found.');
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

        const bookingPreference = scBookingPreferenceConstant.value.toLowerCase();
        console.log('Booking Preference:', bookingPreference);
        if (scDesiredDatesArrayConstant && scDesiredDatesArrayConstant.value !== null && bookingPreference === 'datearray') {

            // Remove the booked dates from the desired dates array so they are not booked a 2nd time
            await removeBookedDatesFromDesiredDatesArray(db, scDesiredDatesArrayConstant, scAvailableArrivalDate, scAvailableDepartureDate);

            // Remove the booked dates from the availability table so they are not booked a 2nd time
            await removeBookedDatesFromAvailability(db, scAvailableArrivalDate, scAvailableDepartureDate);

        } else {
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

                //bookingPreference switch: auto | consecutive | leadingtrailing | datearray
                if (bookingPreference === 'consecutive') {
                    await addOrUpdateSiteConstant(db, 'BookingPreference', 'leadingtrailing');
                }

            } else {
                console.log('Dates cannot be combined without gaps.');
            }
        }

        // Call the sendPushMessage function with the required parameters
        pushSiteBookedMessage(db, composeMessageToSend('step4', scBookingPreference, scDesiredArrivalDate, scDesiredDepartureDate, scDesiredDatesArray,
             scAvailableArrivalDate, scAvailableDepartureDate, scBookedArrivalDate, scBookedDepartureDate, null, null));


        //clear database, sleep and start looking for the next booking
        console.log("\nSleeping...4 minutes");
        await sleep(240000);
        await resetBookingAvailabilityProcess(db);

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

async function removeBookedDatesFromDesiredDatesArray(db, scDesiredDatesArrayConstant, bookedArrivalDate, bookedDepartureDate) {
    try {
        if (!scDesiredDatesArrayConstant || !scDesiredDatesArrayConstant.value) {
            console.error('Desired dates array constant not found or empty.');
            return;
        }

        const desiredDatesArray = JSON.parse(scDesiredDatesArrayConstant.value);

        if (!Array.isArray(desiredDatesArray)) {
            console.error('Desired dates array is not an array.');
            return;
        }

        const arrivalDate = new Date(bookedArrivalDate);
        const departureDate = new Date(bookedDepartureDate);

        console.log('Original Desired Dates Array:', desiredDatesArray);

        const updatedDatesArray = desiredDatesArray.filter(dateString => {
            const currentDate = new Date(dateString);
            return !(currentDate >= arrivalDate && currentDate < departureDate);
        });

        console.log('Updated Desired Dates Array:', updatedDatesArray);

        // Update the site constant with the filtered array
        await addOrUpdateSiteConstant(db, 'DesiredDatesArray', JSON.stringify(updatedDatesArray));
    } catch (error) {
        console.error('Error removing booked dates from desired dates array:', error);
    }
}

async function redirectBookingPage() {
    var bookingQueryString = "?robot=78"
    var bookingURL = baseURL + "/reserve/index" + bookingQueryString

    console.log("Redirecting to the Campgrounds Booking Page");
    console.log(bookingURL);
    await sleep(500);
    window.location.replace(bookingURL);
}
