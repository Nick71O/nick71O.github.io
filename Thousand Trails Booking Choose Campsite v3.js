   // dynamically load additional scripts
   loadScript('https://nick71o.github.io/Thousand%20Trails%20IndexedDB.js')
   .then(() => {
       // IndexedDB script has been successfully loaded
       return loadScript('https://nick71o.github.io/Thousand%20Trails%20Common.js');
   })
   .then(() => {
       // Common script has been successfully loaded
       return loadScript('https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js');
   })
   .then(() => {
       // Now you can safely use functions or variables from the loaded scripts here
       launch();
   })
   .catch(error => {
       // Handle errors if any script fails to load
       console.error('Error loading scripts:', error);
   });


function loadScript(src) {
   return new Promise((resolve, reject) => {
       const script = document.createElement('script');
       script.src = src;
       script.defer = true;

       script.onload = () => {
           console.log(`Script loaded: ${src}`);
           resolve();
       };

       script.onerror = () => {
           console.error(`Error loading script: ${src}`);
           reject(new Error(`Error loading script: ${src}`));
       };

       document.head.appendChild(script);
   });
}



// XPath of button to click
//const selectSiteButtonXPath = "//*[@id='btnSelect0']";
//const selectSiteButtonXPath = "//*[@id='btnSelect1']";

var clickCount = 0;

// IndexedDB library functions
async function launch() {
    try {
        console.log('Hello from Thousand Trails Booking Choose Campsite');
        getTimestamp();
 
        const db = await initializeDB();
        console.log('DB initialized successfully.');
        await logSiteConstants(db);
        await logAvailabilityRecords(db);
  
        const scDesiredArrivalConstant = await getSiteConstant(db, 'DesiredArrivalDate');
        const scDesiredDepartureConstant = await getSiteConstant(db, 'DesiredDepartureDate');
        const scDesiredDatesArrayConstant = await getSiteConstant(db, 'DesiredDatesArray');
        const scDesiredSiteTypesConstant = await getSiteConstant(db, 'DesiredSiteTypes');         
        const scBookingPreferenceConstant = await getSiteConstant(db, 'BookingPreference');
        const scBookedArrivalConstant = await getSiteConstant(db, 'BookedArrivalDate');
        const scBookedDepartureConstant = await getSiteConstant(db, 'BookedDepartureDate');
        const scBookedDatesArrayConstant = await getSiteConstant(db, 'BookedDatesArray');
        const scBookedSiteTypeConstant = await getSiteConstant(db, 'BookedSiteType');
        const scAvailableArrivalConstant = await getSiteConstant(db, 'AvailableArrivalDate');
        const scAvailableDepartureConstant = await getSiteConstant(db, 'AvailableDepartureDate')
        const scAvailableSiteTypeConstant = await getSiteConstant(db, 'AvailableSiteType');
        let scDesiredArrivalDate = null;
        let scDesiredDepartureDate = null;
        let scDesiredDatesArray = null;
        let scDesiredSiteTypes = null;
        let scBookingPreference = null;
        let scBookedArrivalDate = null;
        let scBookedDepartureDate = null;
        let scBookedDatesArray = null;
        let scBookedSiteType = null;
        let scAvailableArrivalDate = null;
        let scAvailableDepartureDate = null;
        let scAvailableSiteType = null;
 
        // Determine cursor direction based on availability mode
        const availabilityModeConstant = await getSiteConstant(db, 'BookingAvailabilityMapCheck');
        const lastUsedConstant = await getSiteConstant(db, 'LastUsedBookingAvailabilityMapCheck');

        const mode = availabilityModeConstant?.value?.toLowerCase() || 'single';
        const lastUsed = lastUsedConstant?.value?.toLowerCase() || 'single';

        let resolvedMode = mode;
        if (mode === 'both') {
            resolvedMode = lastUsed === 'single' ? 'double' : 'single';
        }

        console.log(`BookingAvailabilityMapCheck - (resolvedMode: ${resolvedMode})`);

        // Check if constants were retrieved successfully and if their values are not null or empty
        const isValidConstant = (constant) =>
            constant &&
            constant.value !== null &&
            constant.value.trim() !== '';
 
        if (isValidConstant(scBookingPreferenceConstant)) {
            scBookingPreference = scBookingPreferenceConstant.value.toLowerCase();
            console.log('Booking Preference:', scBookingPreference);
        }
 
        if (isValidConstant(scDesiredArrivalConstant) && isValidConstant(scDesiredDepartureConstant)) {
            scDesiredArrivalDate = scDesiredArrivalConstant.value;
            scDesiredDepartureDate = scDesiredDepartureConstant.value;
            //console.log("SiteConstants Desired Dates to Book\n   Arrival: " + scDesiredArrivalDate + "    Departure: " + scDesiredDepartureDate);
        }
 
        if (isValidConstant(scDesiredDatesArrayConstant) && scBookingPreference === 'datearray') {
            scDesiredDatesArray = JSON.parse(scDesiredDatesArrayConstant.value);
            //console.log('SiteConstant Desired Dates Array: ' + scDesiredDatesArray)
        }
 
        if (hasValidDates(scDesiredDatesArray) && scBookingPreference === 'datearray') {
            let desiredDatesInRange = getAllDatesInRangeOrArray(scDesiredDatesArray, null, null);
            //console.log('Desired Dates In Range:', desiredDatesInRange);
            let allConsecutiveRanges = getConsecutiveDateRanges(desiredDatesInRange);
            //console.log('allConsecutiveRanges: ', allConsecutiveRanges);
            const desiredDateRangeMessage = buildDateRangeMessage('Desired Dates to Book:', allConsecutiveRanges);
            console.log(desiredDateRangeMessage);
        } else if (scDesiredArrivalDate && scDesiredDepartureDate) {
            let desiredDatesInRange = getAllDatesInRangeOrArray(null, scDesiredArrivalDate, scDesiredDepartureDate);
            //console.log('Desired Dates In Range:', desiredDatesInRange);
            let allConsecutiveRanges = getConsecutiveDateRanges(desiredDatesInRange);
            //console.log('allConsecutiveRanges: ', allConsecutiveRanges);
            const desiredDateRangeMessage = buildDateRangeMessage('Desired Dates to Book:', allConsecutiveRanges);
            console.log(desiredDateRangeMessage);
        } else {
            console.error('SiteConstant Desired Arrival, Departure or Array constant is null, empty, or not found.');
        }
 
        if (isValidConstant(scDesiredSiteTypesConstant)) {
            scDesiredSiteTypes = JSON.parse(scDesiredSiteTypesConstant.value);
            console.log('SiteConstant Desired Site Types: ' + scDesiredSiteTypes);
        }
 
        if (isValidConstant(scBookedArrivalConstant) && isValidConstant(scBookedDepartureConstant)) {
            scBookedArrivalDate = scBookedArrivalConstant.value;
            scBookedDepartureDate = scBookedDepartureConstant.value;
            //console.log("SiteConstants Booked Dates\n   Arrival: " + scBookedArrivalDate + "    Departure: " + scBookedDepartureDate);
        }
 
        if (isValidConstant(scBookedDatesArrayConstant) && scBookingPreference === 'datearray') {
            scBookedDatesArray = JSON.parse(scBookedDatesArrayConstant.value);
            //console.log('SiteConstant Booked Dates Array: ' + scBookedDatesArray)
        }
 
        if (hasValidDates(scBookedDatesArray) && scBookingPreference === 'datearray') {
            let bookedDatesInRange = getAllDatesInRangeOrArray(scBookedDatesArray, null, null);
            //console.log('Booked Dates In Range:', bookedDatesInRange);
            let allConsecutiveRanges = getConsecutiveDateRanges(bookedDatesInRange);
            //console.log('allConsecutiveRanges: ', allConsecutiveRanges);
            const bookedDateRangeMessage = buildDateRangeMessage('Existing Booked Reservations:', allConsecutiveRanges);
            console.log(bookedDateRangeMessage);
        } else if (scBookedArrivalDate && scBookedDepartureDate) {
            let bookedDatesInRange = getAllDatesInRangeOrArray(null, scBookedArrivalDate, scBookedDepartureDate);
            //console.log('Booked Dates In Range:', bookedDatesInRange);
            let allConsecutiveRanges = getConsecutiveDateRanges(bookedDatesInRange);
            //console.log('allConsecutiveRanges: ', allConsecutiveRanges);
            const bookedDateRangeMessage = buildDateRangeMessage('Existing Booked Reservations:', allConsecutiveRanges);
            console.log(bookedDateRangeMessage);
        } else {
            console.log('SiteConstant Booked Arrival, Departure or Array constant is null, empty, or not found.');
        }
 
        if (isValidConstant(scBookedSiteTypeConstant)) {
            scBookedSiteType = scBookedSiteTypeConstant.value;
            console.log('SiteConstant Booked Site Type: ' + scBookedSiteType);
        }
 
        if (isValidConstant(scAvailableArrivalConstant) && isValidConstant(scAvailableDepartureConstant)) {
            scAvailableArrivalDate = scAvailableArrivalConstant.value;
            scAvailableDepartureDate = scAvailableDepartureConstant.value;
        
            let bookedDatesInRange = getAllDatesInRangeOrArray(null, scAvailableArrivalDate, scAvailableDepartureDate);
            //console.log('Booked Dates In Range:', bookedDatesInRange);
            let allConsecutiveRanges = getConsecutiveDateRanges(bookedDatesInRange);
            //console.log('allConsecutiveRanges: ', allConsecutiveRanges);
            const bookedDateRangeMessage = buildDateRangeMessage('Availabile Dates to Book:', allConsecutiveRanges);
            console.log(bookedDateRangeMessage);
        } else {
            console.log('SiteConstant Availabile Arrival or Departure constant is null, empty, or not found.');
        }
 
        if (isValidConstant(scAvailableSiteTypeConstant)) {
            scAvailableSiteType = scAvailableSiteTypeConstant.value;
            console.log('SiteConstant Available Site Type: ' + scAvailableSiteType);
        }
      
        if (scAvailableArrivalDate !== null && scAvailableDepartureDate !== null) {
 
       } else {
            // Gather Available Dates
            const bookingArrivalDate = new Date(document.getElementById('cartCheckin').innerHTML);
            const bookingDepartureDate = new Date(document.getElementById('cartCheckout').innerHTML);
            const bookingNumberOfNights = document.getElementById('cartNoOfNights').innerHTML;

            console.log(`Booking Page Desired Dates to Book\n   Arrival: ${bookingArrivalDate.toLocaleDateString('en-us', formatDateOptions)}    Departure: ${bookingDepartureDate.toLocaleDateString('en-us', formatDateOptions)}    Number of Nights: ${bookingNumberOfNights}`);

            // if (bookingNumberOfNights === '1' || bookingNumberOfNights === '2') {
            if (parseInt(bookingNumberOfNights) >= 1) {
                const formattedArrival = bookingArrivalDate.toLocaleDateString('en-us', formatDateOptions);
                const formattedDeparture = bookingDepartureDate.toLocaleDateString('en-us', formatDateOptions);

                console.log(`Load getAvailabilityRecord(${formattedArrival}, ${formattedDeparture})`);

                const availabilityRecord = await getAvailabilityRecord(db, formattedArrival, formattedDeparture);

                if (availabilityRecord) {
                    console.log('availabilityRecord found:', availabilityRecord);
                    console.log('Load updateAvailabilityRecord');
                    //check if the book campsite button is available
                    const isCampsiteAvailableResult = isCampsiteAvailable(scDesiredSiteTypes, 'none');
                    console.log('Is campsite available:', isCampsiteAvailableResult.buttonFound);
                    if (isCampsiteAvailableResult.buttonFound) {
                        console.log(`${isCampsiteAvailableResult.matchedSiteType} Campsite is Available for ${availabilityRecord.ArrivalDate}`);

                        if (hasValidDates(scBookedDatesArray) && scBookingPreference === 'consecutive') {
                            await addOrUpdateSiteConstant(db, 'AvailableArrivalDate', bookingArrivalDate.toLocaleDateString('en-us', formatDateOptions));
                            await addOrUpdateSiteConstant(db, 'AvailableDepartureDate', bookingDepartureDate.toLocaleDateString('en-us', formatDateOptions));
                        }
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
                    await updateAvailabilityRecord(db, availabilityRecord, isCampsiteAvailableResult.buttonFound, currentTimeStamp);

                    // For multi-night bookings, this promotes additional rows in the Availability table,
                    // but only if the main record is already marked Available === true.
                    // Starting from the day after the main arrival date up to (but not including) the departure date,
                    // it finds matching rows by ArrivalDate. If Available is false, it updates the row to:
                    // Available = true, and Checked = the same timestamp from the primary record.
                    if (resolvedMode === 'double' && parseInt(bookingNumberOfNights) > 1 && availabilityRecord.Available === true) {
                        const arrival = new Date(availabilityRecord.ArrivalDate);
                        const departure = new Date(availabilityRecord.DepartureDate);
                        const format = (d) => d.toLocaleDateString('en-us', formatDateOptions);
                        const checkedValue = availabilityRecord.Checked;

                        console.log(`\n➡️ Multi-night booking detected: ${format(arrival)} to ${format(departure)}`);
                        console.log(`   Promoting intermediate rows where Available = false (Checked = ${checkedValue})`);

                        const transaction = db.transaction(['Availability'], 'readwrite');
                        const availabilityStore = transaction.objectStore('Availability');
                        const index = availabilityStore.index('ArrivalDate');

                        let current = new Date(arrival);
                        current.setDate(current.getDate() + 1); // Start at the day after arrival

                        while (current < departure) {
                            const currentFormatted = format(current);
                            console.log(`🔍 Looking for Availability row with ArrivalDate = ${currentFormatted}`);

                            await new Promise((resolve, reject) => {
                                const cursorRequest = index.openCursor(IDBKeyRange.only(currentFormatted));

                                cursorRequest.onsuccess = function (event) {
                                    const cursor = event.target.result;
                                    if (cursor) {
                                        const record = cursor.value;

                                        if (record.Available === false) {
                                            console.log(`🔄 Promoting row id ${record.id} (ArrivalDate = ${record.ArrivalDate})`);
                                            record.Available = true;
                                            record.Checked = checkedValue;

                                            const updateRequest = cursor.update(record);
                                            updateRequest.onsuccess = () => {
                                                console.log(`✅ Updated row id ${record.id}`);
                                                resolve();
                                            };
                                            updateRequest.onerror = (e) => {
                                                console.error(`❌ Failed to update row id ${record.id}:`, e.target.error);
                                                reject(e.target.error);
                                            };
                                        } else {
                                            console.log(`✔️ Row id ${record.id} already available. No update made.`);
                                            resolve();
                                        }
                                    } else {
                                        console.log(`⚠️ No Availability record found for ${currentFormatted}`);
                                        resolve();
                                    }
                                };

                                cursorRequest.onerror = function (event) {
                                    console.error(`❌ Cursor error for ${currentFormatted}:`, event.target.error);
                                    reject(event.target.error);
                                };
                            });

                            current.setDate(current.getDate() + 1);
                        }

                        console.log('🎯 Finished promoting intermediate availability rows.\n');
                    }

                }
                else {
                    console.log('availabilityRecord not found for arrival date:', bookingArrivalDate);
                }
           }
       }
       if (scAvailableArrivalDate !== null && scAvailableDepartureDate !== null) {
            //check if the book campsite button is available and click it
            console.log('\n');
            getTimestamp();
            window.console.log('\nSearching page for the "Select Site" button');
            const isCampsiteAvailableResult = isCampsiteAvailable(scDesiredSiteTypes, 'rapid');
            if (isCampsiteAvailableResult.buttonFound) {
                clickCount = clickCount + 1;
                console.log(`Selected "${isCampsiteAvailableResult.matchedSiteType}" Campsite (click count: ${clickCount})`);
 
                // Calculate the number of nights
                var oneDay = 24 * 60 * 60 * 1000; // hours * minutes * seconds * milliseconds
                var dateDifference = Math.abs(new Date(scAvailableDepartureDate).getTime() - new Date(scAvailableArrivalDate).getTime());
                const scAvailabileNumberOfNights = Math.round(dateDifference / oneDay);
 
                PlayAlert();
                await sleep(3000);
                var reservationError = document.getElementById('reservationError').innerText;
                if (reservationError !== null && reservationError !== undefined) {
                    reservationError = reservationError.trim(); // Trim whitespace
                    console.log(`\nError Received: ${reservationError}`);
                }
 
                // Call the sendPushMessage function with the required parameters
                pushBookSiteMessage(db, composeMessageToSend('step3', scBookingPreference, scDesiredArrivalDate, scDesiredDepartureDate, scDesiredDatesArray,
                 scAvailableArrivalDate, scAvailableDepartureDate, scAvailableSiteType, scBookedArrivalDate, scBookedDepartureDate, scBookedDatesArray, 
                 scBookedSiteType, null, reservationError));
             
 
                if (reservationError == "Unable to process your request.") {
                    console.log("Sleeping...1 minute");
                    await sleep(59000);
                    console.log("Reloading Page");
                    window.location.reload();
                }
 
                if (clickCount <= 49) {
                    getTimestamp();
                    console.log("Sleeping...1 minutes");
                    await sleep(60000);
                    var bookingURL = baseURL + "/reserve/step3"
                    console.log("Redirecting to Step 3 - Enter Payment (Bug that allows booking)");
                    console.log(bookingURL);
                    await sleep(500);
                    window.location.replace(bookingURL);
                    /*
                    console.log("Sleeping...3 minutes");
                    await sleep(177000);
                    launch();
                    */
                }
                else {
                    console.log("Reloading Page");
                    console.log("Sleeping...3 minutes");
                    await sleep(177000);
                    window.location.reload();
                }
            } else {
                console.log('\n"Select Site" button was not found on the page; reset and try again.');
                //sleep, clear database and try again
                await availabilityCheckIntervalSleep(db);
                await resetBookingAvailabilityProcess(db);
                launch();
            }
 
       }else{
           redirectBookingPage();
       }


   } catch (error) {
       console.error('ERROR: In Thousand Trails Start Booking v3 that uses IndexedDB.', error);
       console.log("Sleeping...30 seconds");
       await sleep(30000);
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
   const transaction = db.transaction(['Availability'], 'readwrite');
   const availabilityStore = transaction.objectStore('Availability');

   return new Promise((resolve, reject) => {
       const request = availabilityStore.openCursor();

       request.onsuccess = function (event) {
           const cursor = event.target.result;
           if (cursor) {
               const record = cursor.value;
               console.log('If (' + new Date(record.ArrivalDate).getTime() + ' === ' + new Date(arrivalDate).getTime() + ')');
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

async function getAvailabilityRecord(db, arrivalDate, departureDate) {
    console.log('Searching for record with both ArrivalDate and DepartureDate');

    const transaction = db.transaction(['Availability'], 'readonly');
    const availabilityStore = transaction.objectStore('Availability');

    return new Promise((resolve, reject) => {
        const request = availabilityStore.openCursor();

        request.onsuccess = function (event) {
            const cursor = event.target.result;
            if (cursor) {
                const record = cursor.value;

                const recordArrival = new Date(record.ArrivalDate).getTime();
                const recordDeparture = new Date(record.DepartureDate).getTime();
                const inputArrival = new Date(arrivalDate).getTime();
                const inputDeparture = new Date(departureDate).getTime();

                console.log(`Checking record: Arrival ${record.ArrivalDate}, Departure ${record.DepartureDate}`);

                if (recordArrival === inputArrival && recordDeparture === inputDeparture) {
                    console.log('Matching record found:', record);
                    resolve(record);
                    return;
                }

                cursor.continue();
            } else {
                console.log('No matching record found.');
                resolve(null);
            }
        };

        request.onerror = function (event) {
            console.error('Error fetching availability:', event.target.error);
            reject(event.target.error);
        };
    });
}

//Open the ThousandTrailsDB, 'Availability' table, retrieve all the rows that the 'Checked' column is null or empty string, order by 'ArrivalDate' ascending. 
//Pick the first row and place the values into a string want the following format  "arrivaldate=" + arrivalDate + "&departuredate=" + departureDate.
//If there are no more rows returned, but the 'Availability' table has more than 0 rows it is time to process the AvailabilityTable.
async function getNextAvailabilityDate(db) {
   //console.log('Hello from getNextAvailabilityDate()');

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

/**
 * Checks for an available campsite matching one of the desired site types.
 * Optionally clicks the "Select Site" button based on clickMode.
 *
 * @param {Array<string>} scDesiredSiteTypes - Array of preferred site types
 * @param {'none'|'once'|'rapid'} clickMode - Click behavior: 'none', 'once', or 'rapid'
 * @returns {{ buttonFound: boolean, matchedSiteType: string|null }}
 */
function isCampsiteAvailable(scDesiredSiteTypes, clickMode = 'none') {
    const siteTitles = document.querySelectorAll('.site-title.desktop');
    let buttonFound = false;
    let matchedSiteType = null;

    for (let title of siteTitles) {
        const text = title.textContent.trim();

        for (let desired of scDesiredSiteTypes) {
            if (text.startsWith(desired)) {
                const selectButton = title.closest('.site').querySelector('.select-site');

                if (selectButton) {
                    buttonFound = true;
                    matchedSiteType = desired;

                    if (clickMode === 'once') {
                        selectButton.click();
                    } else if (clickMode === 'rapid') {
                        console.log(`Rapid-clicking "${desired}" Select Site button...`);
                        for (let i = 0; i < 20; i++) {
                            try {
                                selectButton.click();
                            } catch (e) {
                                console.error(`Click #${i + 1} failed:`, e);
                            }
                        }
                    }

                    return { buttonFound, matchedSiteType };
                }
            }
        }
    }

    return { buttonFound, matchedSiteType };
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


// Function to play the alert sound in response to a user click
function PlayAlert() {
   // Log a message to indicate that the function is being executed
   console.log('PlayAlert function is being executed.');

   // Attempt to get the element with ID 'playButton'
   var playButton = document.getElementById('playButton');

   // Check if the element exists and log its status
   if (playButton) {
       console.log('playButton element found:', playButton);

       // Create an Audio object for the alert sound
       var alertSound = new Audio('https://www.soundjay.com/misc/wind-chime-1.mp3');

       // Add a click event listener to the playButton element
       playButton.addEventListener('click', function () {
           try {
               // Attempt to play the alert sound
               alertSound.play();
           } catch (error) {
               // Handle any errors that occur during playback
               console.error('Error playing alert sound:', error);
           }
       });
   } else {
       console.error('playButton element not found.');
   }
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
 