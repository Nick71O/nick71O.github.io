const baseURL = "https://members.thousandtrails.com"
const selectSiteButtonXPath = "//*[@id='btnSelect0']";
//const arrivalDateXPath = "//*[@id='cartCheckin']";
//const departureDateXPath = "//*[@id='cartCheckout']";
//const numberOfNightsXPath = "//*[@id='cartNoOfNights']";
const currentTimeStamp = formatDateTime(Date.now());

const selectButtonElements = getElementsByXPath(selectSiteButtonXPath);
//const arrivalDateElements = getElementsByXPath(arrivalDateXPath);
//const departureDateElements = getElementsByXPath(departureDateXPath);
//const numberOfNightsElements = getElementsByXPath(numberOfNightsXPath);

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

        const siteConstants = await getSiteConstants(db);
        const scDesiredArrivalDate = siteConstants.DesiredArrivalDate;
        const scDesiredDepartureDate = siteConstants.DesiredDepartureDate;
        console.log("SiteConstants Desired Dates to Book\n   Arrival: " + scDesiredArrivalDate + "    Departure: " + scDesiredDepartureDate);

        var bookingArrivalDate = (new Date(document.getElementById('cartCheckin').innerHTML));
        var bookingDepartureDate = (new Date(document.getElementById('cartCheckout').innerHTML));
        var bookingNumberOfNights = document.getElementById('cartNoOfNights').innerHTML;
        console.log("Booking Page Desired Dates to Book\n   Arrival: " + bookingArrivalDate.toLocaleDateString('en-us', formatDateOptions) + "    Departure: " + bookingDepartureDate.toLocaleDateString('en-us', formatDateOptions) + "    Number of Nights: " + bookingNumberOfNights);

        console.log('If (' + bookingNumberOfNights + ' === 1)');
        if (bookingNumberOfNights === '1') {
            //console.log('Load getAvailabilityRecord(' + bookingArrivalDate.toLocaleDateString('en-us', formatDateOptions) + ')');
            //var availabilityRecord = await getAvailabilityRecord(db, bookingArrivalDate.toLocaleDateString('en-us', formatDateOptions));
            console.log('Load getAvailabilityRecord(' + bookingArrivalDate + ')');
            const availabilityRecord = await getAvailabilityRecord(db, bookingArrivalDate);

            if (availabilityRecord) {
                console.log('availabilityRecord found:', availabilityRecord);
                console.log('Load updateAvailabilityRecord');
                await updateAvailabilityRecord(db, availabilityRecord, currentTimeStamp);
            }
            else {
                console.log('availabilityRecord not found for arrival date:', bookingArrivalDate);
            }
        }

        var nextAvailabilityDate = await getNextAvailabilityDate(db);
        if (nextAvailabilityDate) {
            console.log('Next Availability Date:', nextAvailabilityDate);
            openTabs(nextAvailabilityDate.arrivalDate.toLocaleDateString('en-us', formatDateOptions), nextAvailabilityDate.departureDate.toLocaleDateString('en-us', formatDateOptions));
        }
        else {
            console.log('Load processAvailabilityTable');
            await processAvailabilityTable(db);
        }

    } catch (error) {
        console.error('Error performing operations:', error);
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
                console.log('If (' + record.ArrivalDate + ' === ' + arrivalDate + ')');
                if (record.ArrivalDate === arrivalDate) { // Match found
                    resolve(record); // Resolve with the matched record
                    return; // Stop further iteration
                }
                cursor.continue(); // Continue to the next record
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
                console.log('record.Checked === ' + record.Checked + ')');
                if ((record.Checked === null || record.Checked === '') && new Date(record.ArrivalDate) < lowestArrivalDate) {
                    console.log("getNextAvailabilityDate() Find Lowest Arrival Date\n   Arrival: " + record.ArrivalDate + "    Departure: " + record.DepartureDate);
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




async function updateAvailabilityRecord(db, record, checkedTimeStamp) {
    const transaction = db.transaction(['Availability'], 'readwrite');
    const availabilityStore = transaction.objectStore('Availability');

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
    const transaction = db.transaction(['Availability'], 'readonly');
    const objectStore = transaction.objectStore('Availability');

    const index = objectStore.index('Available');

    const availableDates = [];

    return new Promise((resolve, reject) => {
        const request = index.openCursor(IDBKeyRange.only(true));

        request.onsuccess = function (event) {
            const cursor = event.target.result;

            if (cursor) {
                availableDates.push(cursor.value.ArrivalDate);
                cursor.continue();
            } else {
                console.log('Available Dates:', availableDates);
                resolve(availableDates);
            }
        };

        request.onerror = function (event) {
            reject(event.target.error);
        };
    });
}

openThousandTrailsDB();
