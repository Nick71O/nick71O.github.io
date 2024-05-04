
const baseURL = "https://members.thousandtrails.com"

async function launch() { 
    getTimestamp();
    try {
        console.log('Hello from Thousand Trails Parks');
        const db = await initializeDB();
        console.log('IndexedDB initialized successfully.');
        await logSiteConstants(db);

        const scDesiredArrivalConstant = await getSiteConstant(db, 'DesiredArrivalDate');
        const scDesiredDepartureConstant = await getSiteConstant(db, 'DesiredDepartureDate');

        if (!scDesiredArrivalConstant || !scDesiredDepartureConstant) {
            console.error('SiteConstant desired arrival or departure constant not found.');
            return; // Exit the function if constants are not found
        }

        const scDesiredArrivalDate = scDesiredArrivalConstant.value;
        const scDesiredDepartureDate = scDesiredDepartureConstant.value;

        // Calculate the number of nights
        const oneDay = 24 * 60 * 60 * 1000; // hours * minutes * seconds * milliseconds
        const dateDifference = Math.abs(new Date(scDesiredDepartureDate).getTime() - new Date(scDesiredArrivalDate).getTime());
        const scDesiredNumberOfNights = Math.round(dateDifference / oneDay);

        console.log("SiteConstants Desired Dates to Book\n   Arrival: " + scDesiredArrivalDate + "    Departure: " + scDesiredDepartureDate + "    Number of Nights: " + scDesiredNumberOfNights);

        //openTabs(scDesiredArrivalDate, scDesiredDepartureDate);

        redirectBookingPage();
    } catch (error) {
        console.error('FAILED to redirect to the Campgrounds Booking Page. siteConstants in the IndexedDB was not loaded or blank', error);
        await sleep(5000);
        console.log("Reloading Page");
        window.location.reload();
    }
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
  

async function openTabs(arrivalDate, departureDate) {
    arrivalDate = arrivalDate.replace(/\//g, "%2F");
    departureDate = departureDate.replace(/\//g, "%2F");
    var loginURL = baseURL + "/login/index"
    var bookingQueryString = "?locationid=78&arrivaldate=" + arrivalDate + "&departuredate=" + departureDate + "&adults=2&children=3&pets=0&autos=0&category=1&equiptype=3&length=27"
    var bookingURL = baseURL + "/reserve/startbooking" + bookingQueryString
    //var bookingURL = baseURL + "/login/index" + bookingQueryString

    console.log("Redirecting to the Campgrounds Booking Page");
    console.log(bookingURL);
    await sleep(500);
    window.location.replace(bookingURL);
}

async function redirectBookingPage() {
    var bookingQueryString = "?robot=78"
    var bookingURL = baseURL + "/reserve/index" + bookingQueryString

    console.log("Redirecting to the Campgrounds Booking Page");
    console.log(bookingURL);
    await sleep(500);
    window.location.replace(bookingURL);
}

launch();