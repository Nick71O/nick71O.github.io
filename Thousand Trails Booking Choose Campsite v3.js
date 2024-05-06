const baseURL = "https://members.thousandtrails.com"

// XPath of button to click
//const selectSiteButtonXPath = "//*[@id='btnSelect0']";
//const selectSiteButtonXPath = "//*[@id='btnSelect1']";

var clickCount = 0;

// IndexedDB library functions
async function openThousandTrailsDB() {
    try {
        console.log('Hello from Thousand Trails Booking Choose Campsite');
        const db = await initializeDB();
        console.log('DB initialized successfully.');
        await logSiteConstants(db);
        await logAvailabilityRecords(db);

        const scDesiredArrivalConstant = await getSiteConstant(db, 'DesiredArrivalDate');
        const scDesiredDepartureConstant = await getSiteConstant(db, 'DesiredDepartureDate');
        const scProcessArrivalConstant = await getSiteConstant(db, 'BookedArrivalDate');
        const scProcessDepartureConstant = await getSiteConstant(db, 'BookedDepartureDate');
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

        if (scProcessArrivalConstant && scProcessDepartureConstant &&
            scProcessArrivalConstant.value !== null && scProcessDepartureConstant.value !== null &&
            scProcessArrivalConstant.value.trim() !== '' && scProcessDepartureConstant.value.trim() !== '') {

            scBookedArrivalDate = scProcessArrivalConstant.value;
            scBookedDepartureDate = scProcessDepartureConstant.value;

            // Calculate the number of nights
            const oneDay = 24 * 60 * 60 * 1000; // hours * minutes * seconds * milliseconds
            const dateDifference = Math.abs(new Date(scBookedDepartureDate).getTime() - new Date(scBookedArrivalDate).getTime());
            const scProcessNumberOfNights = Math.round(dateDifference / oneDay);

            console.log("SiteConstants Process Dates to Book\n   Arrival: " + scBookedArrivalDate + "    Departure: " + scBookedDepartureDate + "    Number of Nights: " + scProcessNumberOfNights);
        } else {
            console.log('SiteConstant Process Arrival or Departure constant is null, empty, or not found.');
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



        if (scAvailableArrivalDate !== null && scAvailableDepartureDate !== null) {
            //check if the book campsite button is available and click it
            window.console.log('searching page for the "Select Site" button');
            const isCampsiteAvailableResult = isCampsiteAvailable(true);
            if (isCampsiteAvailableResult) {
                clickCount = clickCount + 1;
                console.log('clicked the "Select Site" button ' + clickCount + ' times');

                PlayAlert();
                await sleep(3000);
                var reservationError = document.getElementById('reservationError').innerText;
                if (reservationError != undefined) {
                    console.log('ERROR:\n' + reservationError);
                }
                if (reservationError == "Unable to process your request.") {
                    console.log("Sleeping...1 minute");
                    await sleep(59000);
                    console.log("Reloading Page");
                    window.location.reload();
                }

                console.log("Sleeping...3 minutes");
                await sleep(177000);
                if (clickCount <= 49) {
                    getTimestamp();
                    openThousandTrailsDB();
                }
                else {
                    console.log("Reloading Page");
                    window.location.reload();
                }
            } else {

                console.log('"Select Site" button was not found on the page; reset and try again.');
                //sleep, clear database and try again
                console.log("\nSleeping...2 minutes");
                resetBookingAvailabilityProcess(db, 117000)
            }


        } else {
            //Gather Available Dates
            var bookingArrivalDate = (new Date(document.getElementById('cartCheckin').innerHTML));
            var bookingDepartureDate = (new Date(document.getElementById('cartCheckout').innerHTML));
            var bookingNumberOfNights = document.getElementById('cartNoOfNights').innerHTML;
            console.log("Booking Page Desired Dates to Book\n   Arrival: " + bookingArrivalDate.toLocaleDateString('en-us', formatDateOptions) + "    Departure: " + bookingDepartureDate.toLocaleDateString('en-us', formatDateOptions) + "    Number of Nights: " + bookingNumberOfNights);

            console.log('If (' + bookingNumberOfNights + ' === 1)');
            if (bookingNumberOfNights === '1') {
                console.log('Load getAvailabilityRecord(' + bookingArrivalDate.toLocaleDateString('en-us', formatDateOptions) + ')');
                const availabilityRecord = await getAvailabilityRecord(db, bookingArrivalDate.toLocaleDateString('en-us', formatDateOptions));
                //console.log('Load getAvailabilityRecord(' + bookingArrivalDate + ')');
                //const availabilityRecord = await getAvailabilityRecord(db, bookingArrivalDate);

                if (availabilityRecord) {
                    console.log('availabilityRecord found:', availabilityRecord);
                    console.log('Load updateAvailabilityRecord');
                    //check if the book campsite button is available
                    const isCampsiteAvailableResult = isCampsiteAvailable();
                    console.log('Is campsite available:', isCampsiteAvailableResult);
                    if (isCampsiteAvailableResult) {
                        console.log('Campsite is Available for ' + availabilityRecord.ArrivalDate);
                    }

                    /*
                    //Can't use the XPath to find the select campsite button as it moves above/below the handicapped site button and the XPath changes
                    const selectButtonElements = getElementsByXPath(selectSiteButtonXPath);
                    var campsiteAvailable = false;
                    if (selectButtonElements.length > 0) {
                        console.log('Campsite is Available for ' + availabilityRecord.ArrivalDate);
                        campsiteAvailable = true;
                    }
                    */

                    const currentTimeStamp = formatDateTime(Date.now());
                    await updateAvailabilityRecord(db, availabilityRecord, isCampsiteAvailableResult, currentTimeStamp);
                }
                else {
                    console.log('availabilityRecord not found for arrival date:', bookingArrivalDate);
                }
            }

            redirectBookingPage();
        }

    } catch (error) {
        console.error('ERROR: In Thousand Trails Start Booking v2 that uses IndexedDB.', error);
        await sleep(5000);
        console.log("Reloading Page");
        window.location.reload();
    }
}



async function getSiteConstants(db) {
    const transaction = db.transaction(['SiteConstants'], 'readonly');
    const siteConstantsStore = transaction.objectStore('SiteConstants');

    return new Promise((resolve, reject) => {
        const request = siteConstantsStore.get('SiteConstants');

        request.onsuccess = function (event) {
            resolve(event.target.result);
        };

        request.onerror = function (event) {
            reject(event.target.error);
        };
    });
}


async function getAvailabilityRecord(db, arrivalDate) {
    console.log('Hello from getAvailabilityRecord()');
    const transaction = db.transaction(['Availability'], 'readonly');
    const availabilityStore = transaction.objectStore('Availability');

    return new Promise((resolve, reject) => {
        const request = availabilityStore.openCursor();

        request.onsuccess = function (event) {
            const cursor = event.target.result;
            if (cursor) {
                const record = cursor.value;
                //console.log('If (' + new Date(record.ArrivalDate).getTime() + ' === ' + new Date(arrivalDate).getTime() + ')');
                if (new Date(record.ArrivalDate).getTime() === new Date(arrivalDate).getTime()) {
                    console.log('Record:', record);
                    resolve(record); // Resolve with the matched record
                    return;
                }
                cursor.continue();
            } else {
                resolve(null); // Resolve with null if no match found
            }
        };

        request.onerror = function (event) {
            console.error('Error fetching records:', event.target.error); // Log the error
            reject(event.target.error);
        };
    });
}


//Open the ThousandTrailsDB, 'Availability' table, retrieve all the rows that the 'Checked' column is null or empty string, order by 'ArrivalDate' ascending. 
//Pick the first row and place the values into a string want the following format  "arrivaldate=" + arrivalDate + "&departuredate=" + departureDate.
//If there are no more rows returned, but the 'Availability' table has more than 0 rows it is time to process the AvailabilityTable.
async function getNextAvailabilityDate(db) {
    console.log('Hello from getNextAvailabilityDate()');

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['Availability'], 'readonly');
        const availabilityStore = transaction.objectStore('Availability');
        const request = availabilityStore.index('ArrivalDate').openCursor();

        let lowestArrivalDate = Infinity;
        let nextAvailability = null;

        request.onsuccess = function (event) {
            const cursor = event.target.result;

            if (cursor) {
                const record = cursor.value;
                //console.log('record.Checked === ' + record.Checked + ')');
                if ((record.Checked === null || record.Checked === '') && new Date(record.ArrivalDate) < lowestArrivalDate) {
                    //console.log("getNextAvailabilityDate() Find Lowest Arrival Date\n   Arrival: " + record.ArrivalDate + "    Departure: " + record.DepartureDate);
                    lowestArrivalDate = new Date(record.ArrivalDate);
                    nextAvailability = {
                        arrivalDate: record.ArrivalDate,
                        departureDate: record.DepartureDate
                    };
                }
                cursor.continue(); // Move to the next record
            } else {
                // Resolve with the nextAvailability or null if no suitable record found
                if (nextAvailability !== null) {
                    console.log("getNextAvailabilityDate() FOUND Lowest Arrival Date\n   Arrival: " + nextAvailability.arrivalDate + "    Departure: " + nextAvailability.departureDate);
                    resolve({ arrivalDate: nextAvailability.arrivalDate, departureDate: nextAvailability.departureDate });
                } else {
                    resolve(null);
                }
            }
        };

        request.onerror = function (event) {
            reject(event.target.error);
        };
    });
}


async function updateAvailabilityRecord(db, record, campsiteAvailable, checkedTimeStamp) {
    const transaction = db.transaction(['Availability'], 'readwrite');
    const availabilityStore = transaction.objectStore('Availability');

    record.Available = campsiteAvailable;
    record.Checked = checkedTimeStamp;

    return new Promise((resolve, reject) => {
        const request = availabilityStore.put(record);

        request.onsuccess = function () {
            resolve();
        };

        request.onerror = function (event) {
            reject(event.target.error);
        };
    });
}


async function resetBookingAvailabilityProcess(db, sleepMilliseconds = 0) {
    // Clear database and reset availability
    await sleep(sleepMilliseconds);

    await addOrUpdateSiteConstant(db, 'BookedArrivalDate', null);
    await addOrUpdateSiteConstant(db, 'BookedDepartureDate', null);
    await addOrUpdateSiteConstant(db, 'AvailableArrivalDate', null);
    await addOrUpdateSiteConstant(db, 'AvailableDepartureDate', null);
    await resetAvailabilityTable(db);

    openThousandTrailsDB();
}


function isCampsiteAvailable(clickButton = false) {
    // Find all elements with class "site-title desktop"
    const siteTitles = document.querySelectorAll('.site-title.desktop');

    // Flag to track if the button is found
    let buttonFound = false;

    // Loop through each element to find the one with exact text "Site: "
    siteTitles.forEach(title => {
        if (title.textContent.trim() === 'Site:') {
            // Find the "Select Site" button within this element's parent
            const selectButton = title.closest('.site').querySelector('.select-site');
            if (selectButton) {
                // Set the flag to true and optionally click the button
                buttonFound = true;
                if (clickButton) {
                    selectButton.click(); // Click the button
                }
                return; // Exit the loop and the enclosing function
            }
        }
    });

    // Return true if buttonFound is true, false otherwise
    return buttonFound;
}

async function redirectBookingPage() {
    var bookingQueryString = "?robot=78"
    var bookingURL = baseURL + "/reserve/index" + bookingQueryString

    console.log("Redirecting to the Campgrounds Booking Page");
    console.log(bookingURL);
    await sleep(500);
    window.location.replace(bookingURL);
}

async function openTabs(arrivalDate, departureDate) {
    arrivalDate = arrivalDate.replace(/\//g, "%2F");
    departureDate = departureDate.replace(/\//g, "%2F");
    var loginURL = baseURL + "/login/index"
    var bookingQueryString = "?locationid=78&arrivaldate=" + arrivalDate + "&departuredate=" + departureDate + "&adults=2&children=3&pets=0&autos=0&category=1&equiptype=3&length=27"
    var bookingURL = baseURL + "/reserve/startbooking" + bookingQueryString

    console.log("Redirecting to the Campgrounds Booking Page");
    console.log(bookingURL);
    await sleep(500);
    window.location.replace(bookingURL);
}

// Function to get elements by XPath
function getElementsByXPath(xpath, parent) {
    let results = [];
    let query = document.evaluate(xpath, parent || document,
        null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (let i = 0, length = query.snapshotLength; i < length; ++i) {
        results.push(query.snapshotItem(i));
    }
    return results;
}


function isValidDate(dateString) {
    // Check if the input is a valid date
    return dateString && !isNaN(Date.parse(dateString));
}

function PlayAlert() {
    var alertsound = new Audio('https://www.soundjay.com/misc/wind-chime-1.mp3');
    alertsound.play();
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to format date and time
function formatDateTime(date) {
    const options = {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    return new Date(date).toLocaleString('en-US', options);
}

openThousandTrailsDB();
