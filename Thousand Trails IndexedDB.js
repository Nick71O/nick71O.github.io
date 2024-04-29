console.log('Hello From Thousand Trails IndexedDB.js');

const dbName = 'ThousandTrailsDB';
const dbVersion = 2;
let db;

// Function to initialize IndexedDB and return a promise
function initializeDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);

        request.onupgradeneeded = function (event) {
            db = event.target.result;
            // Your upgrade logic here
            if (!db.objectStoreNames.contains('SiteConstants')) {
                const siteConstantsStore = db.createObjectStore('SiteConstants', { keyPath: 'key' });
                siteConstantsStore.createIndex('value', 'value');
            }

            if (!db.objectStoreNames.contains('Availability')) {
                const availabilityStore = db.createObjectStore('Availability', { autoIncrement: true });
                availabilityStore.createIndex('ArrivalDate', 'ArrivalDate');
                availabilityStore.createIndex('DepartureDate', 'DepartureDate');
                availabilityStore.createIndex('Checked', 'Checked');
            }
        };

        request.onsuccess = function (event) {
            db = event.target.result;
            console.log('Database opened successfully.');
            resolve(db); // Resolve the promise with the opened db
        };

        request.onerror = function (event) {
            console.error('Error opening database:', event.target.error);
            reject(event.target.error); // Reject the promise on error
        };
    });
}





// Helper function for error logging
function logError(errorType, errorMessage) {
    console.error(`Error (${errorType}):`, errorMessage);
}

// Call the function with new dates
//const newArrivalDate = '05/10/2024';
//const newDepartureDate = '05/15/2024';
//updateSiteConstantsDates(newArrivalDate, newDepartureDate);


async function updateSiteConstantsDates(db, newArrivalDate, newDepartureDate) {
    try {
        const transaction = db.transaction(['SiteConstants'], 'readwrite');
        const siteConstantsStore = transaction.objectStore('SiteConstants');

        const siteConstantsRequest = siteConstantsStore.get('SiteConstants');

        siteConstantsRequest.onsuccess = async function (event) {
            const siteConstantsData = event.target.result;

            if (siteConstantsData) {
                // Update the DesiredArrivalDate and DesiredDepartureDate
                siteConstantsData.DesiredArrivalDate = newArrivalDate;
                siteConstantsData.DesiredDepartureDate = newDepartureDate;

                const updateRequest = siteConstantsStore.put(siteConstantsData); // Remove 'SiteConstants' parameter

                updateRequest.onsuccess = function () {
                    console.log('SiteConstants updated with new dates.');
                };

                updateRequest.onerror = function (event) {
                    logError('Update SiteConstants', event.target.error);
                };
            } else {
                // If SiteConstants record doesn't exist, insert it
                const newSiteConstantsData = {
                    key: 'SiteConstants',
                    value: {
                        DesiredArrivalDate: newArrivalDate,
                        DesiredDepartureDate: newDepartureDate,
                        BookingPreference: 'None',
                        MinimumConsecutiveDays: '4'
                    }
                };

                const addRequest = siteConstantsStore.add(newSiteConstantsData);

                addRequest.onsuccess = function () {
                    console.log('New SiteConstants record added.');
                };

                addRequest.onerror = function (event) {
                    logError('Add SiteConstants', event.target.error);
                };
            }
        };

        siteConstantsRequest.onerror = function (event) {
            logError('Fetch SiteConstants', event.target.error);
        };

        transaction.oncomplete = function () {
            console.log('Transaction completed.');
        };

        transaction.onerror = function (event) {
            logError('Transaction', event.target.error);
        };

    } catch (error) {
        console.error('Error updating SiteConstants:', error);
    }
}


async function deleteAllAvailabilityRecords(db) {
    try {
        const transaction = db.transaction(['Availability'], 'readwrite');
        const objectStore = transaction.objectStore('Availability');

        const request = objectStore.clear();

        request.onsuccess = function () {
            console.log('All records deleted from the Availability table.');
        };

        request.onerror = function (event) {
            logError('Delete Records', event.target.error);
        };

        transaction.oncomplete = function () {
            console.log('Transaction completed.');
        };

        transaction.onerror = function (event) {
            logError('Transaction', event.target.error);
        };
    } catch (error) {
        console.error('Error deleting records:', error);
    }
}

async function insertAvailabilityRecords(db) {
    try {
        const transaction = db.transaction(['SiteConstants', 'Availability'], 'readonly');
        const siteConstantsStore = transaction.objectStore('SiteConstants');
        const availabilityStore = transaction.objectStore('Availability');

        const siteConstantsRequest = siteConstantsStore.get('SiteConstants');

        const siteConstantsData = await new Promise((resolve, reject) => {
            siteConstantsRequest.onsuccess = function (event) {
                resolve(event.target.result);
            };

            siteConstantsRequest.onerror = function (event) {
                reject(event.target.error);
            };
        });

        if (siteConstantsData) {
            const desiredArrivalDate = new Date(siteConstantsData.DesiredArrivalDate);
            const desiredDepartureDate = new Date(siteConstantsData.DesiredDepartureDate);

            // Calculate days between DesiredArrivalDate and DesiredDepartureDate
            const dateDifference = Math.abs(desiredDepartureDate - desiredArrivalDate);
            const daysDifference = Math.ceil(dateDifference / (1000 * 60 * 60 * 24));

            console.log('desiredArrivalDate' + desiredArrivalDate);
            console.log('desiredDepartureDate' + desiredDepartureDate);
            console.log('dateDifference' + dateDifference);
            console.log('daysDifference' + daysDifference);

            // Insert a new row for each day between DesiredArrivalDate and DesiredDepartureDate
            for (let i = 0; i <= daysDifference; i++) {
                const currentDate = new Date(desiredArrivalDate);
                currentDate.setDate(currentDate.getDate() + i);

                const nextDay = new Date(currentDate);
                nextDay.setDate(nextDay.getDate() + 1);

                const newRecord = {
                    ArrivalDate: currentDate.toLocaleDateString(),
                    DepartureDate: nextDay.toLocaleDateString(),
                    Checked: null // Leave Checked blank (null)
                };

                availabilityStore.add(newRecord);
            }

            console.log('Availability records inserted successfully.');
        } else {
            logError('Fetch SiteConstants', 'SiteConstants not found.');
        }

        transaction.oncomplete = function () {
            console.log('Transaction completed.');
        };

        transaction.onerror = function (event) {
            logError('Transaction', event.target.error);
        };
    } catch (error) {
        console.error('Error inserting availability records:', error);
    }
}


async function logSiteConstants(db) {
    try {
        const transaction = db.transaction(['SiteConstants'], 'readonly');
        const objectStore = transaction.objectStore('SiteConstants');

        const getAllRequest = objectStore.getAll();

        getAllRequest.onsuccess = function (event) {
            const records = event.target.result;
            console.log('SiteConstants records:');
            records.forEach(record => {
                console.log(record);
            });
        };

        getAllRequest.onerror = function (event) {
            logError('Fetch SiteConstants Records', event.target.error);
        };

        transaction.oncomplete = function () {
            console.log('Transaction completed.');
        };

        transaction.onerror = function (event) {
            logError('Transaction', event.target.error);
        };
    } catch (error) {
        console.error('Error fetching SiteConstants records:', error);
    }
}


async function logAvailabilityRecords(db) {
    try {
        const transaction = db.transaction(['Availability'], 'readonly');
        const objectStore = transaction.objectStore('Availability');

        const getAllRequest = objectStore.getAll();

        getAllRequest.onsuccess = function (event) {
            const records = event.target.result;
            console.log('Availability records:');
            records.forEach(record => {
                console.log(record);
            });
        };

        getAllRequest.onerror = function (event) {
            logError('Fetch Availability Records', event.target.error);
        };

        transaction.oncomplete = function () {
            console.log('Transaction completed.');
        };

        transaction.onerror = function (event) {
            logError('Transaction', event.target.error);
        };
    } catch (error) {
        console.error('Error fetching availability records:', error);
    }
}
