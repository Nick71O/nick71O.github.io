console.log('Hello From Thousand Trails IndexedDB.js');
/*
const commonScript = document.createElement('script');
commonScript.src = 'https://nick71o.github.io/Thousand%20Trails%20Common.js';
document.head.appendChild(commonScript);

const axiosScript = document.createElement('script');
axiosScript.src = 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js';
document.head.appendChild(axiosScript);
*/

const formatDateOptions = { month: '2-digit', day: '2-digit', year: 'numeric' };
const dbName = 'ThousandTrailsDB';
const dbVersion = 10;
let db;

// Function to initialize IndexedDB and return a promise
function initializeDB() {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(dbName, dbVersion);

        request.onupgradeneeded = function (event) {
            const db = event.target.result;

            if (!db.objectStoreNames.contains('SiteConstant')) {
                const siteConstantsStore = db.createObjectStore('SiteConstant', { keyPath: 'id', autoIncrement: true });
                siteConstantsStore.createIndex('name', 'name', { unique: false });
                siteConstantsStore.createIndex('value', 'value', { unique: false });
            }
        

            if (!db.objectStoreNames.contains('Availability')) {
                const availabilityStore = db.createObjectStore('Availability', { autoIncrement: true });
                availabilityStore.createIndex('ArrivalDate', 'ArrivalDate', { unique: false });
                availabilityStore.createIndex('DepartureDate', 'DepartureDate', { unique: false });
                availabilityStore.createIndex('Available', 'Available', { unique: false });
                availabilityStore.createIndex('Checked', 'Checked', { unique: false });
            }
        };

        request.onsuccess = function (event) {
            const db = event.target.result;
            resolve(db); // Resolve the promise with the opened db
        };

        request.onerror = function (event) {
            reject(event.target.error); // Reject the promise on error
        };
    });
}


// Helper function for error logging
function logError(errorType, errorMessage) {
    console.error(`Error (${errorType}):`, errorMessage);
}


// retrieve an entry from the SiteConstant table based on name
async function getSiteConstant(db, name) {
    try {
        //console.log('Trying to retrieve constant:', name);
        const transaction = db.transaction('SiteConstant', 'readonly');
        const siteConstantsStore = transaction.objectStore('SiteConstant');
        const index = siteConstantsStore.index('name');

        const request = index.get(name);

        return new Promise((resolve, reject) => {
            request.onsuccess = function (event) {
                const constant = event.target.result;
                if (constant) {
                    //console.log(`Retrieved Constant "${name}", "${constant.value}":`, constant);
                    resolve(constant); // Resolve the promise with the retrieved constant
                } else {
                    //console.error(`Constant "${name}" not found.`);
                    resolve(null); // Resolve with null if constant is not found
                }
            };

            request.onerror = function (event) {
                console.error(`Error getting constant "${name}":`, event.target.error);
                reject(event.target.error); // Reject the promise on error
            };
        });
    } catch (error) {
        console.error('Error in getSiteConstant:', error);
        return null; // Return null in case of any other error
    }
}
/*
async function getSiteConstant(db, name) {
    try {
        console.log('Trying to retrieve constant:', name);
        const transaction = db.transaction('SiteConstant', 'readonly');
        const siteConstantsStore = transaction.objectStore('SiteConstant');
        const request = siteConstantsStore.openCursor();

        return new Promise((resolve, reject) => {
            request.onsuccess = function (event) {
                const cursor = event.target.result;
                if (cursor) {
                    const constant = cursor.value;
                    if (constant.name === name) {
                        console.log(`Retrieved Constant "${name}", "${constant.value}":`, constant);
                        resolve(constant); // Resolve the promise with the retrieved constant
                    } else {
                        cursor.continue(); // Continue to the next entry
                    }
                } else {
                    console.error(`Constant "${name}" not found.`);
                    resolve(null); // Resolve with null if constant is not found
                }
            };

            request.onerror = function (event) {
                console.error(`Error getting constant "${name}":`, event.target.error);
                reject(event.target.error); // Reject the promise on error
            };
        });
    } catch (error) {
        console.error('Error in getSiteConstant:', error);
        return null; // Return null in case of any other error
    }
}
*/

// Add or update an entry in the SiteConstant table based on name
async function addOrUpdateSiteConstant(db, name, value) {
    try {
        const existingConstant = await getSiteConstant(db, name);
        const transaction = db.transaction('SiteConstant', 'readwrite');
        const siteConstantsStore = transaction.objectStore('SiteConstant');

        if (existingConstant) {
            if (existingConstant.value !== value) {
                existingConstant.value = value;
                const updateRequest = siteConstantsStore.put(existingConstant);
                updateRequest.onsuccess = () => {
                    console.log(`SiteConstant '${name}' updated successfully.`);
                    transaction.commit(); // Commit the transaction after successful update
                };
                updateRequest.onerror = (event) => {
                    console.error('Error updating SiteConstant:', event.target.error);
                    transaction.abort(); // Abort transaction on error
                };
            } else {
                console.log(`SiteConstant '${name}' already contains the same value. No update needed.`);
                transaction.commit(); // Commit the transaction since no update is needed
            }
        } else {
            const newConstant = { name, value };
            const addRequest = siteConstantsStore.add(newConstant);
            addRequest.onsuccess = () => {
                console.log(`SiteConstant '${name}' added successfully.`);
                transaction.commit(); // Commit the transaction after successful addition
            };
            addRequest.onerror = (event) => {
                console.error('Error adding SiteConstant:', event.target.error);
                transaction.abort(); // Abort transaction on error
            };
        }
    } catch (error) {
        console.error(`Error adding or updating SiteConstant '${name}':`, error);
        console.error('Error stack trace:', error.stack);
        throw error;
    }
}
/*
async function addOrUpdateSiteConstant(db, name, value) {
    try {
        const existingConstant = await getSiteConstant(db, name);
        const transaction = db.transaction('SiteConstant', 'readwrite');
        const siteConstantsStore = transaction.objectStore('SiteConstant');

        if (existingConstant) {
            if (existingConstant.value !== value) {
                existingConstant.value = value;
                await new Promise((resolve, reject) => {
                    const updateRequest = siteConstantsStore.put(existingConstant);
                    updateRequest.onsuccess = () => resolve();
                    updateRequest.onerror = () => reject(updateRequest.error);
                });
                console.log(`SiteConstant '${name}' updated successfully.`);
            } else {
                console.log(`SiteConstant '${name}' already contains the same value. No update needed.`);
            }
        } else {
            const newConstant = { name, value };
            await new Promise((resolve, reject) => {
                const addRequest = siteConstantsStore.add(newConstant);
                addRequest.onsuccess = () => resolve();
                addRequest.onerror = () => reject(addRequest.error);
            });
            console.log(`SiteConstant '${name}' added successfully.`);
        }
    } catch (error) {
        console.error(`Error adding or updating SiteConstant '${name}':`, error);
        console.error('Error stack trace:', error.stack);
        throw error;
    }
}
*/

async function updateSiteConstantsDates(db, newArrivalDate, newDepartureDate) {
    const desiredArrivalDate = new Date(newArrivalDate);
    const desiredDepartureDate = new Date(newDepartureDate);

    // Ensure that the values passed are serializable
    const formattedArrivalDate = desiredArrivalDate.toLocaleDateString('en-us', formatDateOptions);
    const formattedDepartureDate = desiredDepartureDate.toLocaleDateString('en-us', formatDateOptions);

    await addOrUpdateSiteConstant(db, 'DesiredArrivalDate', formattedArrivalDate);
    await addOrUpdateSiteConstant(db, 'DesiredDepartureDate', formattedDepartureDate);
}


// Delete all records from the SiteConstant object store
async function deleteAllSiteConstants(db) {
    deleteAllRecords(db, 'SiteConstant');
}

// Delete all records from the Availability object store
async function deleteAllAvailabilityRecords(db) {
    deleteAllRecords(db, 'Availability');
}

async function deleteAllRecords(db, objectStoreName) {
    try {
        const objectStoreNames = db.objectStoreNames;
        if (objectStoreNames.contains(objectStoreName)) {
            const transaction = db.transaction([objectStoreName], 'readwrite');
            const objectStore = transaction.objectStore(objectStoreName);

            const request = objectStore.clear();

            request.onsuccess = function () {
                console.log(`All records deleted from the ${objectStoreName} table.`);
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
        } else {
            console.error(`Object store '${objectStoreName}' not found.`);
        }
    } catch (error) {
        console.error(`Error deleting records from ${objectStoreName}:`, error);
    }
}

async function resetAvailabilityTable(db) {
    try {
        const transaction = db.transaction('Availability', 'readwrite');
        const availabilityStore = transaction.objectStore('Availability');

        const cursorRequest = availabilityStore.openCursor();

        cursorRequest.onsuccess = function (event) {
            const cursor = event.target.result;
            if (cursor) {
                const record = cursor.value;
                record.Available = false;
                record.Checked = null;

                const updateRequest = cursor.update(record);
                updateRequest.onsuccess = function () {
                    cursor.continue(); // Move to the next record
                };
                updateRequest.onerror = function (event) {
                    console.error('Error updating record:', event.target.error);
                };
            } else {
                console.log('Availability table reset completed.');
            }
        };

        cursorRequest.onerror = function (event) {
            console.error('Error opening cursor:', event.target.error);
        };

        transaction.oncomplete = function () {
            console.log('Transaction completed.');
        };

        transaction.onerror = function (event) {
            console.error('Transaction error:', event.target.error);
        };
    } catch (error) {
        console.error('Error resetting Availability table:', error);
    }
}


async function insertAvailabilityRecords(db, desiredArrivalDate, desiredDepartureDate) {
    try {
        const transaction = db.transaction('Availability', 'readwrite');
        const availabilityStore = transaction.objectStore('Availability');

        // Convert arrival and departure dates to Date objects
        const desiredArrivalDateObj = new Date(desiredArrivalDate);
        const desiredDepartureDateObj = new Date(desiredDepartureDate);

        const dateDifference = Math.abs(desiredDepartureDateObj - desiredArrivalDateObj);
        const daysDifference = Math.ceil(dateDifference / (1000 * 60 * 60 * 24));

        console.log(`Desired Arrival Date: ${desiredArrivalDateObj.toLocaleDateString('en-us', formatDateOptions)}`);
        console.log(`Desired Departure Date: ${desiredDepartureDateObj.toLocaleDateString('en-us', formatDateOptions)}`);
        console.log(`Days Difference: ${daysDifference}`);

        for (let i = 0; i < daysDifference; i++) {
            const currentDate = new Date(desiredArrivalDateObj);
            currentDate.setDate(currentDate.getDate() + i);

            const nextDay = new Date(currentDate);
            nextDay.setDate(nextDay.getDate() + 1);

            const newRecord = {
                ArrivalDate: currentDate.toLocaleDateString('en-us', formatDateOptions),
                DepartureDate: nextDay.toLocaleDateString('en-us', formatDateOptions),
                Available: false,
                Checked: null
            };

            availabilityStore.add(newRecord);
        }

        console.log('Availability records inserted successfully.');

        transaction.oncomplete = function () {
            console.log('Transaction completed.');
        };

        transaction.onerror = function (event) {
            console.error('Transaction error:', event.target.error);
        };
    } catch (error) {
        console.error('Error inserting availability records:', error);
    }
}


// Retrieve all entries from the SiteConstant table and log them to the console
async function logSiteConstants(db) {
    try {
        const transaction = db.transaction('SiteConstant', 'readonly');
        const store = transaction.objectStore('SiteConstant');

        const getRequest = store.getAll();

        getRequest.onsuccess = function (event) {
            const constants = event.target.result;
            if (constants && constants.length > 0) {
                console.log('SiteConstant records:');
                constants.forEach(constant => {
                    console.log(constant);
                });
                //constants.forEach((constant) => {
                //    console.log(`Name: "${constant.name}", Value: "${constant.value}"`);
                //});
            } else {
                console.log('No SiteConstant found.');
            }
        };

        getRequest.onerror = function (event) {
            console.error('Error getting all SiteConstant records:', event.target.error);
        };
    } catch (error) {
        console.error('Error retrieving SiteConstant records:', error);
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
