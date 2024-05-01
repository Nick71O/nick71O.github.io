const baseURL = "https://members.thousandtrails.com"
//const selectSiteButtonXPath = "//*[@id='btnSelect0']";
//const selectSiteButtonXPath = "//*[@id='btnSelect1']";


async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

// IndexedDB library functions
async function openThousandTrailsDB() {
    try {
        const db = await initializeDB();
        console.log('DB initialized successfully.');
        await logSiteConstants(db);
        await logAvailabilityRecords(db);

        const scDesiredArrivalConstant = await getSiteConstant(db, 'DesiredArrivalDate');
        const scDesiredDepartureConstant = await getSiteConstant(db, 'DesiredDepartureDate');

        // Check if constants were retrieved successfully
        if (scDesiredArrivalConstant && scDesiredDepartureConstant) {
            const scDesiredArrivalDate = scDesiredArrivalConstant.value;
            const scDesiredDepartureDate = scDesiredDepartureConstant.value;

            // Calculate the number of nights
            const oneDay = 24 * 60 * 60 * 1000; // hours * minutes * seconds * milliseconds
            const dateDifference = Math.abs(new Date(scDesiredDepartureDate).getTime() - new Date(scDesiredArrivalDate).getTime());
            const scDesiredNumberOfNights = Math.round(dateDifference / oneDay);

            console.log("SiteConstants Desired Dates to Book\n   Arrival: " + scDesiredArrivalDate + "    Departure: " + scDesiredDepartureDate + "    Number of Nights: " + scDesiredNumberOfNights);
        } else {
            console.error('SiteConstant Desired Arrival or Departure constant not found.');
        }

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
                AvailabileBooking(availableDates, scDesiredArrivalConstant.value, scDesiredDepartureConstant.value, scBookingPreferenceConstant.value, scMinimumConsecutiveDaysConstant.value)
            } else {
                console.error('SiteConstant BookingPreference or MinimumConsecutiveDays constant not found.');
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

function isCampsiteAvailable() {
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
                // Set the flag to true and exit the loop
                buttonFound = true;
                return;
            }
        }
    });

    // Return true if buttonFound is true, false otherwise
    return buttonFound;
}


function AvailabileBooking(availableDates, arrivalDate, departureDate, bookingPreference, minimumConsecutiveDays) {
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
            var arr = getDatesInRange(availableDates, arrivalDate, departureDate);
            var startDate;
            var endDate;
            var range = [];
            var consecutiveDates = [];

            arr.sort((a, b) => a.getTime() - b.getTime());
            arr.some(function (v, i, arr) {
                if (i > 0) {
                    const tmp = new Date(arr[i - 1]);

                    if (this.consecutiveCount == 0) {
                        startDate = tmp.toLocaleDateString('en-US');
                    }

                    //console.log("tmp: " + tmp.toLocaleDateString('en-US'));
                    tmp.setDate(tmp.getDate() + 1);
                    //console.log("tmp: " + tmp.toLocaleDateString('en-US'));
                    //console.log(tmp.toLocaleDateString('en-US') + "===" + v.toLocaleDateString('en-US'));
                    if (tmp.getTime() === v.getTime()) {
                        endDate = tmp.toLocaleDateString('en-US');
                        this.consecutiveCount++;
                        //console.log("consecutiveCount: " + this.consecutiveCount + " -  " + v.toLocaleDateString('en-US'));
                    } else {
                        startDate = undefined;
                        endDate = undefined;
                        this.consecutiveCount = 0;
                        //console.log(v.toLocaleDateString('en-US'));
                    }

                }
                if (i == arr.length - 1) {
                    range = [this.consecutiveCount, startDate, endDate];
                    consecutiveDates.push(range);
                }

                if (this.consecutiveCount == 0) {
                    if (range[1] != undefined & range[2] != undefined) {
                        consecutiveDates.push(range);
                        //console.log("StartDate: " + range[1] + "    EndDate: " + range[2] + "    ConsecutiveCount: " + range[0]);
                    }
                }
                if (startDate != undefined && endDate != undefined) {
                    //console.log("StartDate: " + startDate + "    EndDate: " + endDate + "    ConsecutiveCount: " + this.consecutiveCount);
                }
                range = [this.consecutiveCount, startDate, endDate];
            }, {
                consecutiveCount: 0
            });

            console.log(consecutiveDates);
            if (consecutiveDates.length > 0) {
                consecutiveDates.sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]));

                if (minimumConsecutiveDays <= consecutiveDates[0][0]) {
                    console.log("Available Dates to Book\n   Arrival: " + consecutiveDates[0][1] + "    Departure: " + consecutiveDates[0][2] + "    Number of Nights: " + consecutiveDates[0][0]);
                    openTabs(consecutiveDates[0][1], consecutiveDates[0][2]);
                }
            }
            break;

        default:
            console.log(`Booking preference switch of "${bookingPreference}" does not have a code path`);

    }
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
    for (var dt = new Date(start); dt <= new Date(end); dt.setDate(dt.getDate() + 1)) {
        var dateString = dt.toLocaleDateString('en-US');
        if (array.includes(dateString)) {
            inRange.push(new Date(dt));
        }
    }
    return inRange;
}



openThousandTrailsDB();
