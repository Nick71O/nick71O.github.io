const baseURL = "https://members.thousandtrails.com"

// XPath of button to click
//const selectSiteButtonXPath = "//*[@id='btnSelect0']";
//const selectSiteButtonXPath = "//*[@id='btnSelect1']";

var clickCount = 0;

// IndexedDB library functions
async function openThousandTrailsDB() {
    try {
        const db = await initializeDB();
        console.log('DB initialized successfully.');
        await logSiteConstants(db);
        await logAvailabilityRecords(db);

        const scDesiredArrivalConstant = await getSiteConstant(db, 'DesiredArrivalDate');
        const scDesiredDepartureConstant = await getSiteConstant(db, 'DesiredDepartureDate');
        const scAvailabileArrivalConstant = await getSiteConstant(db, 'AvailabileArrivalDate');
        const scAvailabileDepartureConstant = await getSiteConstant(db, 'AvailabileDepartureDate');
        const scDesiredArrivalDate = null;
        const scDesiredDepartureDate = null;
        const scAvailabileArrivalDate = null;
        const scAvailabileDepartureDate = null;

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

        if (scAvailabileArrivalConstant && scAvailabileDepartureConstant &&
            scAvailabileArrivalConstant.value !== null && scAvailabileDepartureConstant.value !== null &&
            scAvailabileArrivalConstant.value.trim() !== '' && scAvailabileDepartureConstant.value.trim() !== '') {

            scAvailabileArrivalDate = scAvailabileArrivalConstant.value;
            scAvailabileDepartureDate = scAvailabileDepartureConstant.value;

            // Calculate the number of nights
            const oneDay = 24 * 60 * 60 * 1000; // hours * minutes * seconds * milliseconds
            const dateDifference = Math.abs(new Date(scAvailabileDepartureDate).getTime() - new Date(scAvailabileArrivalDate).getTime());
            const scAvailabileNumberOfNights = Math.round(dateDifference / oneDay);

            console.log("SiteConstants Availabile Dates to Book\n   Arrival: " + scAvailabileArrivalDate + "    Departure: " + scAvailabileDepartureDate + "    Number of Nights: " + scAvailabileNumberOfNights);
        } else {
            console.error('SiteConstant Availabile Arrival or Departure constant is null, empty, or not found.');
        }


        if (scAvailabileArrivalConstant.value !== null && scAvailabileDepartureConstant.value !== null) {
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

            var nextAvailabilityDate = await getNextAvailabilityDate(db);
            if (nextAvailabilityDate) {
                console.log('Next Availability Date:', nextAvailabilityDate);
                openTabs(nextAvailabilityDate.arrivalDate, nextAvailabilityDate.departureDate);
            }
            else {
                await logAvailabilityRecords(db);

                console.log('Load processAvailabilityTable');
                const availableDates = await processAvailabilityTable(db);
                console.log('Available Dates:', availableDates);

                const scBookingPreferenceConstant = await getSiteConstant(db, 'BookingPreference');
                const scMinimumConsecutiveDaysConstant = await getSiteConstant(db, 'MinimumConsecutiveDays');

                if (scBookingPreferenceConstant && scMinimumConsecutiveDaysConstant) {
                    await AvailableBooking(availableDates, scDesiredArrivalConstant.value, scDesiredDepartureConstant.value, scBookingPreferenceConstant.value, scMinimumConsecutiveDaysConstant.value)
                } else {
                    console.error('SiteConstant BookingPreference or MinimumConsecutiveDays constant not found.');

                    //sleep, clear database and try again
                    console.log("\nSleeping...4 minutes");
                    resetBookingAvailabilityProcess(db, 237000)
                }
            }
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


async function processAvailabilityTable(db) {
    console.log('Hello from processAvailabilityTable()');

    const transaction = db.transaction(['Availability'], 'readonly');
    const objectStore = transaction.objectStore('Availability');

    const availableDates = [];

    return new Promise((resolve, reject) => {
        const request = objectStore.openCursor();

        request.onsuccess = function (event) {
            const cursor = event.target.result;

            if (cursor) {
                if (cursor.value.Available === true) { // Check availability
                    availableDates.push(cursor.value.ArrivalDate);
                }
                cursor.continue();
            } else {
                //console.log('Available Dates:', availableDates);
                resolve(availableDates);
            }
        };

        request.onerror = function (event) {
            reject(event.target.error);
        };
    });
}


async function resetBookingAvailabilityProcess(db, sleepMilliseconds = 0) {
    // Clear database and reset availability
    await sleep(sleepMilliseconds);

    await addOrUpdateSiteConstant(db, 'AvailabileArrivalDate', null);
    await addOrUpdateSiteConstant(db, 'AvailabileDepartureDate', null);
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


async function AvailableBooking(availableDates, arrivalDate, departureDate, bookingPreference, minimumConsecutiveDays) {
    //bookingPreference switch: none | trailing | leading | consecutive
    switch (bookingPreference.toLowerCase()) {
        case "trailing":
            console.log("Found Arrival Date: " + availableDates.contains(arrivalDate.toLocaleDateString('en-US')))
            if (availableDates.length > 0) {
                var foundArrivalDate;
                var foundDepartureDate;
                var foundNumberOfNights = 0;
                if (availableDates.contains(arrivalDate.toLocaleDateString('en-US'))) {
                    foundArrivalDate = arrivalDate;
                    console.log("foundArrivalDate: " + foundArrivalDate);
                    var dateArray = getDates(arrivalDate, departureDate);
                    console.log("dateArray.length: " + dateArray.length);
                    console.log("dateArray: " + dateArray);
                    for (i = 0; i < dateArray.length; i++) {
                        if (availableDates.contains(dateArray[i].toLocaleDateString('en-US'))) {
                            console.log("dateArray[" + i + "]: " + dateArray[i]);
                            foundDepartureDate = dateArray[i];
                            if (foundArrivalDate.toLocaleDateString('en-US') == foundDepartureDate.toLocaleDateString('en-US')) {
                                foundDepartureDate.setDate(foundDepartureDate.getDate() + 1);
                            }
                            foundNumberOfNights = i + 1;
                            console.log("foundDepartureDate: " + foundDepartureDate);
                            console.log("foundNumberOfNights: " + foundNumberOfNights);
                        }
                        else {
                            i = dateArray.length;
                        }
                    }
                    if (foundNumberOfNights > 0) {
                        console.log("Available Dates to Book\n   Arrival: " + foundArrivalDate.toLocaleDateString('en-US', formatDateOptions) + "    Departure: " + foundDepartureDate.toLocaleDateString('en-US', formatDateOptions) + "    Number of Nights: " + foundNumberOfNights);
                        openTabs(foundArrivalDate, foundDepartureDate);
                    }
                }
            }
            break;

        case "leading":
            console.log("Found Departure Date: " + availableDates.contains(departureDate.toLocaleDateString('en-US')))
            if (availableDates.length > 0) {
                var foundArrivalDate;
                var foundDepartureDate;
                var foundNumberOfNights = 0;
                if (availableDates.contains(departureDate.toLocaleDateString('en-US'))) {
                    foundDepartureDate = departureDate;
                    console.log("foundDepartureDate: " + foundDepartureDate);
                    var dateArray = getDates(arrivalDate, departureDate);
                    console.log("dateArray.length: " + dateArray.length);
                    console.log("dateArray: " + dateArray);
                    for (i = dateArray.length - 1; i >= 0; i--) {
                        if (availableDates.contains(dateArray[i].toLocaleDateString('en-US'))) {
                            console.log("dateArray[" + i + "]: " + dateArray[i]);
                            foundArrivalDate = dateArray[i];
                            if (foundArrivalDate.toLocaleDateString('en-US') == foundDepartureDate.toLocaleDateString('en-US')) {
                                foundArrivalDate.setDate(foundArrivalDate.getDate() - 1);
                            }
                            foundNumberOfNights = i + 1;
                            console.log("foundArrivalDate: " + foundArrivalDate);
                            console.log("foundNumberOfNights: " + foundNumberOfNights);
                        }
                        else {
                            i = -1;
                        }
                    }
                    if (foundNumberOfNights > 0) {
                        console.log("Available Dates to Book\n   Arrival: " + foundArrivalDate.toLocaleDateString('en-US', formatDateOptions) + "    Departure: " + foundDepartureDate.toLocaleDateString('en-US', formatDateOptions) + "    Number of Nights: " + foundNumberOfNights);
                        openTabs(foundArrivalDate, foundDepartureDate);
                    }
                }
            }
            break;

        case "consecutive":
            console.log('AvailableBooking - Consecutive');
            console.log('Available Dates:', availableDates);
            console.log('Arrival Date:', arrivalDate);
            console.log('Departure Date:', departureDate);

            /*
            availableDates = [
                '05/01/2024', '05/02/2024', '05/03/2024', '05/04/2024', '05/05/2024', '05/06/2024',
                '05/07/2024', '05/08/2024', '05/09/2024', '05/12/2024', '05/13/2024', '05/14/2024',
                '05/15/2024', '05/16/2024', '05/17/2024', '05/18/2024', '05/19/2024', '05/20/2024',
                '05/21/2024', '05/22/2024', '05/23/2024', '05/27/2024', '05/28/2024', '05/29/2024',
                '05/30/2024', '06/02/2024', '06/03/2024', '06/04/2024', '06/05/2024', '06/10/2024',
                '06/11/2024', '06/17/2024', '06/20/2024', '06/25/2024', '06/26/2024', '07/02/2024',
                '07/09/2024'
            ];
            arrivalDate = '05/04/2024';
            departureDate = '06/18/2024';

            console.log('Available Dates:', availableDates);
            console.log('Arrival Date:', arrivalDate);
            console.log('Departure Date:', departureDate);
            */

            const availableDatesInRange = getDatesInRange(availableDates, arrivalDate, departureDate);
            console.log('Available Dates In Range:', availableDatesInRange);

            const dates = availableDatesInRange.map(dateStr => new Date(dateStr));

            let currentRange = [];
            let allRanges = [];

            for (let i = 0; i < dates.length; i++) {
                if (i === 0 || dates[i].getTime() !== dates[i - 1].getTime() + 86400000) {
                    if (currentRange.length > 0) {
                        allRanges.push(currentRange);
                    }
                    currentRange = [dates[i]];
                } else {
                    currentRange.push(dates[i]);
                }
            }

            if (currentRange.length > 0) {
                allRanges.push(currentRange);
            }

            console.log("All Consecutive Date Ranges:");
            allRanges.forEach(range => {
                const arrivalDate = range[0].toLocaleDateString('en-US', formatDateOptions);
                const departureDate = new Date(range[range.length - 1].getTime() + 86400000).toLocaleDateString('en-US', formatDateOptions); // Add 1 day to get the next day
                const numberOfNights = range.length; // Number of nights is the length of the range

                console.log("   Arrival:", arrivalDate, "Departure:", departureDate, "Number of Nights:", numberOfNights);
            });

            if (allRanges.length > 0) {
                const longestRange = allRanges.filter(range => range.length >= minimumConsecutiveDays)
                    .reduce((a, b) => a.length > b.length ? a : b, []);

                if (longestRange.length >= minimumConsecutiveDays) {
                    const arrivalDate = longestRange[0].toLocaleDateString('en-US', formatDateOptions);
                    const departureDate = new Date(longestRange[longestRange.length - 1].getTime() + 86400000).toLocaleDateString('en-US', formatDateOptions); // Add 1 day to get the next day
                    const numberOfNights = longestRange.length; // Number of nights is the length of the range

                    console.log("\nLongest Consecutive Date Range with Minimum of", minimumConsecutiveDays, "Nights:");
                    console.log("   Arrival:", arrivalDate, "Departure:", departureDate, "Number of Nights:", numberOfNights);
                    await addOrUpdateSiteConstant(db, 'AvailabileArrivalDate', arrivalDate);
                    await addOrUpdateSiteConstant(db, 'AvailabileDepartureDate', departureDate);
                    openTabs(arrivalDate, departureDate);
                } else {
                    console.log("No consecutive dates found with a minimum of", minimumConsecutiveDays, "nights.");
                }
            } else {
                console.log("No consecutive dates found.");
            }

            break;

        default:
            console.log(`Booking preference switch of "${bookingPreference}" does not have a code path`);

    }
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

function getDates(start, end) {
    var arr = [];
    for (var dt = new Date(start); dt <= new Date(end); dt.setDate(dt.getDate() + 1)) {
        arr.push(new Date(dt));
    }
    return arr;
}

function getDatesInRange(array, start, end) {
    var inRange = [];
    console.log('Start Date:', start);
    console.log('End Date:', end);
    for (var dt = new Date(start); dt <= new Date(end); dt.setDate(dt.getDate() + 1)) {
        var dateString = dt.toLocaleDateString('en-us', formatDateOptions);
        console.log('Processing Date:', dateString);
        if (array.includes(dateString)) {
            inRange.push(new Date(dt));
        }
    }
    console.log('Dates in Range:', inRange);
    return inRange;
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
