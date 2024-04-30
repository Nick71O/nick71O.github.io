console.log('Hello From Thousand Trails IndexedDB.js');

const formatDateOptions = { month: '2-digit', day: '2-digit', year: 'numeric' };
const dbName = 'ThousandTrailsDB';
const dbVersion = 6;
let db;

// Function to initialize IndexedDB and return a promise
function initializeDB() {
    console.log('Hello from initializeDB()');
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);

        request.onupgradeneeded = function (event) {
            console.log('onupgradeneeded event triggered.');
            db = event.target.result;

            // Log object store names and indexes for debugging
            console.log('Object Store Names:', db.objectStoreNames);
            db.objectStoreNames.forEach(storeName => {
                const store = event.target.transaction.objectStore(storeName);
                console.log(`Indexes for ${storeName}:`, store.indexNames);
            });
            
            if (!db.objectStoreNames.contains("SiteConstants")) {
                console.log('Creating SiteConstants object store.');
                const siteConstantsStore = db.createObjectStore("SiteConstants", { autoIncrement: true });
                siteConstantsStore.createIndex("name", "name", { unique: true });
                siteConstantsStore.createIndex("value", "value", { unique: false });
                console.log("SiteConstants table created successfully.");
            }

            if (!db.objectStoreNames.contains('Availability')) {
                console.log('Creating Availability object store.');
                const availabilityStore = db.createObjectStore('Availability', { autoIncrement: true });
                availabilityStore.createIndex('ArrivalDate', 'ArrivalDate');
                availabilityStore.createIndex('DepartureDate', 'DepartureDate');
                availabilityStore.createIndex('Available', 'Available');
                availabilityStore.createIndex('Checked', 'Checked');
                console.log("Availability table created successfully.");
            }
        };

        request.onsuccess = function (event) {
            console.log('onsuccess event triggered.');
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

// Add or update an entry in the SiteConstants table based on name
async function addOrUpdateSiteConstant(db, name, value) {
    const transaction = db.transaction("SiteConstants", "readwrite");
    const store = transaction.objectStore("SiteConstants");

    try {
        const getAllRequest = store.getAll(); // Retrieve all constants
        const constants = await getAllRequest;

        const existingConstant = constants.find(constant => constant.name === name);

        if (existingConstant) {
            // Update existing constant
            existingConstant.value = value;
            const updateRequest = store.put(existingConstant);
            await updateRequest;
            console.log(`Constant "${name}" updated successfully.`);
        } else {
            // Add new constant with auto-generated ID
            const newConstant = { name: name, value: value };
            const addRequest = store.add(newConstant);
            const addedId = await addRequest;
            console.log(`Constant "${name}" added successfully with ID: ${addedId}`);
        }
    } catch (error) {
        console.error(`Error adding or updating constant "${name}":`, error);
    }
}




// retrieve an entry from the SiteConstants table based on name
async function getSiteConstant(db, name) {
    const transaction = db.transaction("SiteConstants", "readonly");
    const store = transaction.objectStore("SiteConstants");

    try {
        const constant = await store.get(name);
        if (constant) {
            console.log(`Retrieved Constant "${name}":`, constant);
        } else {
            console.error(`Constant "${name}" not found.`);
        }
    } catch (error) {
        console.error(`Error getting constant "${name}":`, error);
    }
}

async function updateSiteConstantsDates(db, newArrivalDate, newDepartureDate) {
    const desiredArrivalDate = new Date(newArrivalDate);
    const desiredDepartureDate = new Date(newDepartureDate);

    await addOrUpdateSiteConstant(db, 'DesiredArrivalDate', desiredArrivalDate.toLocaleDateString('en-us', formatDateOptions));
    await addOrUpdateSiteConstant(db, 'DesiredDepartureDate', desiredDepartureDate.toLocaleDateString('en-us', formatDateOptions));
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
        const transaction = db.transaction('Availability', 'readwrite');
        const availabilityStore = transaction.objectStore('Availability');

        const desiredArrivalConstant = await getSiteConstant(db, 'DesiredArrivalDate');
        const desiredDepartureConstant = await getSiteConstant(db, 'DesiredDepartureDate');

        // Check if constants were retrieved successfully
        if (!desiredArrivalConstant || !desiredDepartureConstant) {
            console.error('Desired arrival or departure constant not found.');
            return; // Exit the function if constants are not found
        }

        const desiredArrivalDate = new Date(desiredArrivalConstant.value);
        const desiredDepartureDate = new Date(desiredDepartureConstant.value);

        const dateDifference = Math.abs(desiredDepartureDate - desiredArrivalDate);
        const daysDifference = Math.ceil(dateDifference / (1000 * 60 * 60 * 24));

        console.log(`Desired Arrival Date: ${desiredArrivalDate.toLocaleDateString('en-us', formatDateOptions)}`);
        console.log(`Desired Departure Date: ${desiredDepartureDate.toLocaleDateString('en-us', formatDateOptions)}`);
        console.log(`Days Difference: ${daysDifference}`);

        for (let i = 0; i < daysDifference; i++) {
            const currentDate = new Date(desiredArrivalDate);
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


// Retrieve all entries from the SiteConstants table and log them to the console
async function logSiteConstants(db) {
    try {
        const transaction = db.transaction("SiteConstants", "readonly");
        const store = transaction.objectStore("SiteConstants");

        const getRequest = store.getAll();

        getRequest.onsuccess = function (event) {
            const constants = event.target.result;
            if (constants && constants.length > 0) {
                console.log("SiteConstants records:");
                constants.forEach((constant) => {
                    console.log(`Name: "${constant.name}", Value: "${constant.value}"`);
                });
            } else {
                console.log("No SiteConstants found.");
            }
        };

        getRequest.onerror = function (event) {
            console.error("Error getting all SiteConstants records:", event.target.error);
        };
    } catch (error) {
        console.error("Error retrieving SiteConstants records:", error);
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
