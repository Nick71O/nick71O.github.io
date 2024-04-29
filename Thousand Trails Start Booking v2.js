const selectSiteButtonXPath = "//*[@id='btnSelect0']";
const arrivalDateXPath = "//*[@id='cartCheckin']";
const departureDateXPath = "//*[@id='cartCheckout']";
const numberOfNightsXPath = "//*[@id='cartNoOfNights']";
const currentTimeStamp = formatDateTime(Date.now());

const selectButtonElements = getElementsByXPath(selectSiteButtonXPath);
const arrivalDateElements = getElementsByXPath(arrivalDateXPath);
const departureDateElements = getElementsByXPath(departureDateXPath);
const numberOfNightsElements = getElementsByXPath(numberOfNightsXPath);

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
        const arrivalDate = siteConstants.DesiredArrivalDate;
        const departureDate = siteConstants.DesiredDepartureDate;

        const availabilityRecord = await getAvailabilityRecord(db, arrivalDate);

        if (numberOfNightsElements.length === 1 && availabilityRecord) {
            await updateAvailabilityRecord(db, availabilityRecord, currentTimeStamp);
        }

        const nextAvailabilityDate = await getNextAvailabilityDate(db);

        if (!nextAvailabilityDate) {
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
    const index = availabilityStore.index('ArrivalDate');

    return new Promise((resolve, reject) => {
        const request = index.get(arrivalDate);

        request.onsuccess = function (event) {
            resolve(event.target.result);
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
    const availabilityStore = transaction.objectStore('Availability');
    const index = availabilityStore.index('Available');

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
