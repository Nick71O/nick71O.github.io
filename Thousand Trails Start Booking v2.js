﻿const selectSiteButtonXPath = "//*[@id='btnSelect0']";
//const arrivalDateXPath = "//*[@id='cartCheckin']";
//const departureDateXPath = "//*[@id='cartCheckout']";
//const numberOfNightsXPath = "//*[@id='cartNoOfNights']";
const currentTimeStamp = formatDateTime(Date.now());

const selectButtonElements = getElementsByXPath(selectSiteButtonXPath);
//const arrivalDateElements = getElementsByXPath(arrivalDateXPath);
//const departureDateElements = getElementsByXPath(departureDateXPath);
//const numberOfNightsElements = getElementsByXPath(numberOfNightsXPath);

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
        console.log("Booking Page Desired Dates to Book\n   Arrival: " + bookingArrivalDate.toLocaleDateString('en-US') + "    Departure: " + bookingDepartureDate.toLocaleDateString('en-US') + "    Number of Nights: " + bookingNumberOfNights);

        const availabilityRecord = await getAvailabilityRecord(db, bookingArrivalDate);

        console.log('If (' + bookingNumberOfNights + ' = 1 && availabilityRecord: ' + availabilityRecord + ')');
        if (bookingNumberOfNights === 1 && availabilityRecord) {
            console.log('Load updateAvailabilityRecord');
            await updateAvailabilityRecord(db, availabilityRecord, currentTimeStamp);
        }

        const nextAvailabilityDate = await getNextAvailabilityDate(db);
        console.log('nextAvailabilityDate: ', nextAvailabilityDate);

        if (!nextAvailabilityDate) {
            console.log('Load processAvailabilityTable');
            await processAvailabilityTable(db);
        }

        console.log('Next Availability Date:', nextAvailabilityDate);

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
    const transaction = db.transaction(['Availability'], 'readonly');
    const availabilityStore = transaction.objectStore('Availability');
    const index = availabilityStore.index('Checked');

    return new Promise((resolve, reject) => {
        const request = index.openCursor(IDBKeyRange.only(null), 'next'); // Only get records with 'Checked' as null

        request.onsuccess = function (event) {
            const cursor = event.target.result;

            if (cursor) {
                const record = cursor.value;
                const nextAvailability = {
                    arrivalDate: record.ArrivalDate,
                    departureDate: record.DepartureDate
                };
                resolve(nextAvailability);
            } else {
                // No more rows with 'Checked' as null, check if there are more rows
                const countRequest = availabilityStore.count();

                countRequest.onsuccess = function (event) {
                    const rowCount = event.target.result;
                    if (rowCount > 0) {
                        // Time to process the AvailabilityTable
                        processAvailabilityTable(db).then(() => {
                            resolve(null); // Return null as no next availability date to check
                        }).catch(error => {
                            reject(error);
                        });
                    } else {
                        // No more rows and no rows with 'Checked' as null
                        resolve(null);
                    }
                };

                countRequest.onerror = function (event) {
                    reject(event.target.error);
                };
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

async function getNextAvailabilityDate(db) {
    const transaction = db.transaction(['Availability'], 'readonly');
    const availabilityStore = transaction.objectStore('Availability');
    const index = availabilityStore.index('Checked');

    return new Promise((resolve, reject) => {
        const request = index.openCursor(null, 'next');

        request.onsuccess = function (event) {
            const cursor = event.target.result;

            console.log('cursor: ', cursor);
            if (cursor) {
                if (!cursor.value.Checked || cursor.value.Checked === '') {
                    const arrivalDate = cursor.value.ArrivalDate;
                    const departureDate = cursor.value.DepartureDate;
                    const nextAvailability = `arrivaldate=${arrivalDate}&departuredate=${departureDate}`;
                    resolve(nextAvailability);
                } else {
                    cursor.continue();
                }
            } else {
                resolve(null);
            }
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
