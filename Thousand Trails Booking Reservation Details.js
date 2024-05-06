const baseURL = "https://members.thousandtrails.com"

var clickCount = 0;

// IndexedDB library functions
async function openThousandTrailsDB() {
    console.log('Hello from Thousand Trails Booking Reservation Details');
    getTimestamp();

    //check for fatal site error
    //502 Bad Gateway, 504 Gateway Time-out
    if (document.title.substring(0, 3) == "502" || document.title.substring(0, 3) == "504") {
        console.log("ERROR: " + document.title);
        console.log("Sleeping...3 minute");
        await sleep(180000);
        console.log("Reloading Page");
        window.location.reload();
    }

    //if the page loses its login credentials it loads a login screen at the same url
    const invalidLoginDiv = document.getElementById('invalidLogin');
    if (invalidLoginDiv && invalidLoginDiv.textContent.trim() === 'Invalid Login Parameters Entered.') {
        // Perform your action here, such as showing a modal, redirecting, or displaying an alert
        alert('Invalid login parameters. Please try again.');

        console.log("Sleeping...30 seconds");
        await sleep(30000);
        redirectLoginPage();
    }

    try {
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
            const scProcessNumberOfNights = Math.round(dateDifference / oneDay);

            console.log("SiteConstants Booked Dates\n   Arrival: " + scBookedArrivalDate + "    Departure: " + scBookedDepartureDate + "    Number of Nights: " + scProcessNumberOfNights);
        } else {
            console.log('SiteConstant Booked Arrival or Departure constant is null, empty, or not found.');
        }

        if (scAvailabileArrivalConstant && scAvailabileDepartureConstant &&
            scAvailabileArrivalConstant.value !== null && scAvailabileDepartureConstant.value !== null &&
            scAvailabileArrivalConstant.value.trim() !== '' && scAvailabileDepartureConstant.value.trim() !== '') {

            scAvailableArrivalDate = scAvailabileArrivalConstant.value;
            scAvailableDepartureDate = scAvailabileDepartureConstant.value;

            // Calculate the number of nights
            const oneDay = 24 * 60 * 60 * 1000; // hours * minutes * seconds * milliseconds
            const dateDifference = Math.abs(new Date(scAvailableDepartureDate).getTime() - new Date(scAvailableArrivalDate).getTime());
            const scAvailabileNumberOfNights = Math.round(dateDifference / oneDay);

            console.log("SiteConstants Availabile Dates to Book\n   Arrival: " + scAvailableArrivalDate + "    Departure: " + scAvailableDepartureDate + "    Number of Nights: " + scAvailabileNumberOfNights);
        } else {
            console.log('SiteConstant Availabile Arrival or Departure constant is null, empty, or not found.');
        }


        //if (scAvailabileArrivalConstant.value !== null && scAvailabileDepartureConstant.value !== null) {

        //} else {
        var nextAvailabilityDate = await getNextAvailabilityDate(db);
        if (nextAvailabilityDate) {
            console.log('Next Availability Date:', nextAvailabilityDate);

            //openTabs(nextAvailabilityDate.arrivalDate, nextAvailabilityDate.departureDate);

            inputBookingReservationDetails(nextAvailabilityDate.arrivalDate, nextAvailabilityDate.departureDate);
        }
        else {
            await logSiteConstants(db);
            await logAvailabilityRecords(db);

            console.log('Goto Step 2');

            console.log('Load processAvailabilityTable');
            const availableDates = await processAvailabilityTable(db);
            console.log('Available Dates:', availableDates);

            const scBookingPreferenceConstant = await getSiteConstant(db, 'BookingPreference');
            const scMinimumConsecutiveDaysConstant = await getSiteConstant(db, 'MinimumConsecutiveDays');

            if (scBookingPreferenceConstant && scMinimumConsecutiveDaysConstant) {
                const { availableArrivalDate, availableDepartureDate } = await AvailableBooking(db, availableDates, scDesiredArrivalConstant.value, scDesiredDepartureConstant.value, scBookedArrivalConstant.value, scBookedDepartureConstant.value, scBookingPreferenceConstant.value, scMinimumConsecutiveDaysConstant.value);
                if (availableArrivalDate && availableDepartureDate) {
                    console.log("Available Arrival Date:", availableArrivalDate);
                    console.log("Available Departure Date:", availableDepartureDate);

                    inputBookingReservationDetails(availableArrivalDate, availableDepartureDate);
                } else {
                    console.log("No available dates found.");
                    console.log("Available Arrival Date:", availableArrivalDate);
                    console.log("Available Departure Date:", availableDepartureDate);
                }

                //sleep, clear database and try again
                console.log("\nSleeping...5 minutes");
                resetBookingAvailabilityProcess(db, 297000)
            } else {
                console.error('SiteConstant BookingPreference or MinimumConsecutiveDays constant not found.');
            }

        }
        //}

    } catch (error) {
        console.error('ERROR: In Thousand Trails Booking Reservation Details', error);
        await sleep(5000);
        console.log("Reloading Page");
        window.location.reload();
    }
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


async function AvailableBooking(db, availableDates, arrivalDate, departureDate, bookedArrivalDate, bookedDepartureDate, bookingPreference, minimumConsecutiveDays) {
    let availableArrivalDate = null;
    let availableDepartureDate = null;

    //bookingPreference switch: none | trailing | leading | consecutive | leadingtrailing
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

            console.log("\nAll Consecutive Date Ranges:");
            allRanges.forEach(range => {
                const arrivalDate = range[0].toLocaleDateString('en-US', formatDateOptions);
                const departureDate = new Date(range[range.length - 1].getTime() + 86400000).toLocaleDateString('en-US', formatDateOptions); // Add 1 day to get the next day
                const numberOfNights = range.length; // Number of nights is the length of the range

                console.log("   Arrival:", arrivalDate, "Departure:", departureDate, "Number of Nights:", numberOfNights);
            });

            if (allRanges.length > 0) {
                console.log("\n")
                getTimestamp();

                const longestRange = allRanges.filter(range => range.length >= minimumConsecutiveDays)
                    .reduce((a, b) => a.length > b.length ? a : b, []);

                if (longestRange.length >= minimumConsecutiveDays) {
                    availableArrivalDate = longestRange[0].toLocaleDateString('en-US', formatDateOptions);
                    availableDepartureDate = new Date(longestRange[longestRange.length - 1].getTime() + 86400000).toLocaleDateString('en-US', formatDateOptions); // Add 1 day to get the next day
                    const availableNumberOfNights = longestRange.length; // Number of nights is the length of the range

                    console.log("\nLongest Consecutive Date Range with Minimum of", minimumConsecutiveDays, "Nights:");
                    console.log("   Arrival:", availableArrivalDate, "Departure:", availableDepartureDate, "Number of Nights:", availableNumberOfNights);
                    
                    await addOrUpdateSiteConstant(db, 'AvailableArrivalDate', availableArrivalDate);
                    await addOrUpdateSiteConstant(db, 'AvailableDepartureDate', availableDepartureDate);

                } else {
                    console.log("\nNo consecutive dates found with a minimum of", minimumConsecutiveDays, "nights.");
                }
            } else {
                console.log("\nNo consecutive dates found.");
            }

            break;

        case "leadingtrailing":
            console.log('AvailableBooking - Leading\Trailing');
            console.log('Available Dates:', availableDates);
            console.log('Arrival Date:', arrivalDate);
            console.log('Departure Date:', departureDate);

            //bookedArrivalDate = '05/04/2024';
            //bookedDepartureDate = '05/16/2024';

            availableDates = [
                '05/01/2024', '05/02/2024', '05/03/2024', '05/04/2024', '05/05/2024', '05/06/2024',
                '05/07/2024', '05/08/2024', '05/09/2024', '05/12/2024', '05/13/2024', '05/14/2024',
                '05/15/2024', '05/16/2024', '05/17/2024', '05/18/2024', '05/19/2024', '05/20/2024',
                '05/21/2024', '05/22/2024', '05/23/2024', '05/27/2024', '05/28/2024', '05/29/2024',
                '05/30/2024', '06/02/2024', '06/03/2024', '06/04/2024', '06/05/2024', '06/10/2024',
                '06/11/2024', '06/17/2024', '06/20/2024', '06/25/2024', '06/26/2024', '07/02/2024',
                '07/09/2024'
            ];

            arrivalDate = '05/01/2024';
            departureDate = '07/04/2024';

            console.log('Available Dates:', availableDates);
            console.log('Arrival Date:', arrivalDate);
            console.log('Departure Date:', departureDate);
            console.log('Booked Arrival Date:', bookedArrivalDate);
            console.log('Booked Departure Date:', bookedDepartureDate);

            let leadingArrivalDate = null;
            let leadingDepartureDate = null;
            let leadingNumberOfNights = 0;

            let trailingDepartureDate = null;
            let trailingArrivalDate = null;
            let trailingNumberOfNights = 0;

            // Finding leading dates
            let currentIndex = availableDates.indexOf(bookedArrivalDate);
            let currentLeadingArrival = bookedArrivalDate;
            let currentLeadingDeparture = bookedArrivalDate;
            let currentLeadingCount = 1;

            while (currentIndex > 0 && availableDates[currentIndex - 1] === addDays(currentLeadingArrival, -1)) {
                currentLeadingArrival = availableDates[currentIndex - 1];
                currentLeadingCount++;
                currentIndex--;
            }

            leadingArrivalDate = currentLeadingArrival;
            leadingDepartureDate = currentLeadingDeparture;
            leadingNumberOfNights = currentLeadingCount;

            // Finding trailing dates
            currentIndex = availableDates.indexOf(bookedDepartureDate);
            let currentTrailingArrival = bookedDepartureDate;
            let currentTrailingDeparture = bookedDepartureDate;
            let currentTrailingCount = 1;

            while (currentIndex < availableDates.length - 1 && availableDates[currentIndex + 1] === addDays(currentTrailingDeparture, 1)) {
                currentTrailingDeparture = availableDates[currentIndex + 1];
                currentTrailingCount++;
                currentIndex++;
            }

            trailingArrivalDate = currentTrailingArrival;
            trailingDepartureDate = currentTrailingDeparture;
            trailingNumberOfNights = currentTrailingCount;

            // Determine which date range is longer
            availableArrivalDate = leadingNumberOfNights >= trailingNumberOfNights ? leadingArrivalDate : trailingArrivalDate;
            availableDepartureDate = leadingNumberOfNights >= trailingNumberOfNights ? leadingDepartureDate : trailingDepartureDate;
            const availableNumberOfNights = leadingNumberOfNights >= trailingNumberOfNights ? leadingNumberOfNights : trailingNumberOfNights;

            console.log("\nLeading Date Range:");
            console.log("   Arrival:", leadingArrivalDate, "Departure:", leadingDepartureDate, "Number of Nights:", leadingNumberOfNights);

            console.log("\nTrailing Date Range:");
            console.log("   Arrival:", trailingArrivalDate, "Departure:", trailingDepartureDate, "Number of Nights:", trailingNumberOfNights);

            if (!leadingArrivalDate || !trailingArrivalDate) {
                console.log("\nNo consecutive leading or trailing date range found.");
            }

            console.log("\nAvailabile Date Range:");
            console.log("   Arrival:", availableArrivalDate, "Departure:", availableDepartureDate, "Number of Nights:", availableNumberOfNights);
            
            await addOrUpdateSiteConstant(db, 'AvailableArrivalDate', availableArrivalDate);
            await addOrUpdateSiteConstant(db, 'AvailableDepartureDate', availableDepartureDate);

            break;

        default:
            console.log(`Booking preference switch of "${bookingPreference}" does not have a code path`);

    }

    // Return the available dates or null if not found
    return { availableArrivalDate, availableDepartureDate };
}


async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getTimestamp() {
    var nowDate = new Date();
    var date = nowDate.toDateString();
    var time = nowDate.toLocaleTimeString();
    var timestamp = '--' + date + ', ' + time + '--';
    console.log(timestamp);
    return timestamp;
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
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
    //console.log('Start Date:', start);
    //console.log('End Date:', end);
    for (var dt = new Date(start); dt <= new Date(end); dt.setDate(dt.getDate() + 1)) {
        var dateString = dt.toLocaleDateString('en-us', formatDateOptions);
        //console.log('Processing Date:', dateString);
        if (array.includes(dateString)) {
            inRange.push(new Date(dt));
        }
    }
    //console.log('Dates in Range:', inRange);
    return inRange;
}

// Define a function to set up the event listener for the "Choose Campsite" button
function setupEventListener() {
    var btnStep2 = document.getElementById("btnStep2");

    if (btnStep2) {
        btnStep2.addEventListener("click", function () {
            console.log("You clicked the Choose Campsite button!");
        });
    } else {
        console.error("Button not found!");
    }
}

// Call the function when the DOM content is fully loaded
document.addEventListener("DOMContentLoaded", function () {
    setupEventListener();
});

async function inputBookingReservationDetails(arrivalDate, departureDate) {
    // Check if the elements exist before performing actions
    var checkinInput = document.getElementById("checkin");
    var checkoutInput = document.getElementById("checkout");
    var btnStep2 = document.getElementById("btnStep2");
    var campingTypeSelect = document.getElementById("campingType");
    var equipmentTypeSelect = document.getElementById("equipmentType");
    var adultsSelect = document.getElementById("adults");
    var kidsSelect = document.getElementById("kids");
    var lengthInput = document.getElementById("length");
    var slideoutsNoRadio = document.getElementById("slideoutsNo");

    if (checkinInput && checkoutInput && btnStep2 && campingTypeSelect && equipmentTypeSelect && adultsSelect && kidsSelect && lengthInput && slideoutsNoRadio) {
        checkinInput.value = arrivalDate;
        checkoutInput.value = departureDate;

        // Select RV from the campingType dropdown
        for (var i = 0; i < campingTypeSelect.options.length; i++) {
            if (campingTypeSelect.options[i].text === "RV Site") {
                campingTypeSelect.selectedIndex = i;
                break;
            }
        }

        // Select Travel Trailer from the equipmentType dropdown
        for (var j = 0; j < equipmentTypeSelect.options.length; j++) {
            if (equipmentTypeSelect.options[j].text === "Travel Trailer") {
                equipmentTypeSelect.selectedIndex = j;
                break;
            }
        }

        // Select 2 from the adults dropdown
        for (var k = 0; k < adultsSelect.options.length; k++) {
            if (adultsSelect.options[k].text === "2") {
                adultsSelect.selectedIndex = k;
                break;
            }
        }

        // Select 3 from the kids dropdown
        for (var l = 0; l < kidsSelect.options.length; l++) {
            if (kidsSelect.options[l].text === "3") {
                kidsSelect.selectedIndex = l;
                break;
            }
        }

        // Set the length to 27
        lengthInput.value = "27";

        // Select "No" for With Slideouts
        slideoutsNoRadio.checked = true;

        btnStep2.click();
        // btnStep2.addEventListener("click", function() {
        //     console.log("You clicked the Choose Campsite button!");
        // });
    } else {
        console.error("Booking input elements not found!");

        console.log("Sleeping...30 seconds");
        await sleep(30000);
        redirectLoginPage();
    }
}



async function resetBookingAvailabilityProcess(db, sleepMilliseconds = 0) {
    // Clear database and reset availability
    await sleep(sleepMilliseconds);

    await addOrUpdateSiteConstant(db, 'AvailableArrivalDate', null);
    await addOrUpdateSiteConstant(db, 'AvailableDepartureDate', null);
    await resetAvailabilityTable(db);

    openThousandTrailsDB();
}

async function redirectLoginPage() {
    var loginURL = baseURL + "/login/index";

    console.log("Redirecting to the Login Page");
    console.log(loginURL);
    await sleep(500);
    window.location.replace(loginURL);
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


openThousandTrailsDB();