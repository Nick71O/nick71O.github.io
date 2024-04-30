
const baseURL = "https://members.thousandtrails.com"

async function launch() { 
    getTimestamp();
    try {
        const db = await initializeDB();
        console.log('IndexedDB initialized successfully.');
        await logSiteConstants(db);

        const siteConstants = await getSiteConstants(db);
        const scDesiredArrivalDate = siteConstants.DesiredArrivalDate;
        const scDesiredDepartureDate = siteConstants.DesiredDepartureDate;
        console.log("SiteConstants Desired Dates to Book\n   Arrival: " + scDesiredArrivalDate + "    Departure: " + scDesiredDepartureDate);

        openTabs(scDesiredArrivalDate, scDesiredDepartureDate);

    } catch (error) {
        console.error('FAILED to redirect to the Campgrounds Booking Page. siteConstants in the IndexedDB was not loaded or blank', error);
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
  
      console.log("Redirecting to the Campgrounds Booking Page");
      console.log(bookingURL);
      await sleep(500);
      window.location.replace(bookingURL);
  }

launch();