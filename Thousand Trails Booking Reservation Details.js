const baseURL = "https://members.thousandtrails.com"

var clickCount = 0;

// IndexedDB library functions
async function openThousandTrailsDB() {
    try {
        console.log('Hello from Thousand Trails Booking Reservation Details');
        const db = await initializeDB();
        console.log('DB initialized successfully.');
        await logSiteConstants(db);
        await logAvailabilityRecords(db);

        const scDesiredArrivalConstant = await getSiteConstant(db, 'DesiredArrivalDate');
        const scDesiredDepartureConstant = await getSiteConstant(db, 'DesiredDepartureDate');
        const scProcessArrivalConstant = await getSiteConstant(db, 'ProcessArrivalDate');
        const scProcessDepartureConstant = await getSiteConstant(db, 'ProcessDepartureDate');
        const scAvailabileArrivalConstant = await getSiteConstant(db, 'AvailabileArrivalDate');
        const scAvailabileDepartureConstant = await getSiteConstant(db, 'AvailabileDepartureDate');
        let scDesiredArrivalDate = null;
        let scDesiredDepartureDate = null;
        let scProcessArrivalDate = null;
        let scProcessDepartureDate = null;
        let scAvailabileArrivalDate = null;
        let scAvailabileDepartureDate = null;

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

        if (scProcessArrivalConstant && scProcessDepartureConstant &&
            scProcessArrivalConstant.value !== null && scProcessDepartureConstant.value !== null &&
            scProcessArrivalConstant.value.trim() !== '' && scProcessDepartureConstant.value.trim() !== '') {

            scProcessArrivalDate = scProcessArrivalConstant.value;
            scProcessDepartureDate = scProcessDepartureConstant.value;

            // Calculate the number of nights
            const oneDay = 24 * 60 * 60 * 1000; // hours * minutes * seconds * milliseconds
            const dateDifference = Math.abs(new Date(scProcessDepartureDate).getTime() - new Date(scProcessArrivalDate).getTime());
            const scProcessNumberOfNights = Math.round(dateDifference / oneDay);

            console.log("SiteConstants Process Dates to Book\n   Arrival: " + scProcessArrivalDate + "    Departure: " + scProcessDepartureDate + "    Number of Nights: " + scProcessNumberOfNights);
        } else {
            console.log('SiteConstant Process Arrival or Departure constant is null, empty, or not found.');
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
            console.log('SiteConstant Availabile Arrival or Departure constant is null, empty, or not found.');
        }


        //if (scAvailabileArrivalConstant.value !== null && scAvailabileDepartureConstant.value !== null) {
        
        //} else {
            var nextAvailabilityDate = await getNextAvailabilityDate(db);
            if (nextAvailabilityDate) {
                console.log('Next Availability Date:', nextAvailabilityDate);

                // Check if the elements exist before performing actions
                var checkinInput = document.getElementById("checkin");
                var checkoutInput = document.getElementById("checkout");
                var btnStep2 = document.getElementById("btnStep2");

                if (checkinInput && checkoutInput && btnStep2) {
                    checkinInput.value = nextAvailabilityDate.arrivalDate;
                    checkoutInput.value = nextAvailabilityDate.departureDate;

                    btnStep2.click();
                    //btnStep2.addEventListener("click", function() {
                    //    console.log("You clicked the Choose Campsite button!");
                    //});
                } else {
                    console.error("Booking input elements not found!");
                }
                //openTabs(nextAvailabilityDate.arrivalDate, nextAvailabilityDate.departureDate);

                //await addOrUpdateSiteConstant(db, 'ProcessArrivalDate', nextAvailabilityDate.arrivalDate);
                //await addOrUpdateSiteConstant(db, 'ProcessDepartureDate', nextAvailabilityDate.departureDate);
                //redirectBookingPage();
            }
            else {
                //await addOrUpdateSiteConstant(db, 'ProcessArrivalDate', null);
                //await addOrUpdateSiteConstant(db, 'ProcessDepartureDate', null);
                await logSiteConstants(db);
                await logAvailabilityRecords(db);

                console.log('Goto Step 2');

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


async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Define a function to set up the event listener for the "Choose Campsite" button
function setupEventListener() {
    var btnStep2 = document.getElementById("btnStep2");

    if (btnStep2) {
        btnStep2.addEventListener("click", function() {
            console.log("You clicked the Choose Campsite button!");
        });
    } else {
        console.error("Button not found!");
    }
}

// Call the function when the DOM content is fully loaded
document.addEventListener("DOMContentLoaded", function() {
    setupEventListener();
});


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
