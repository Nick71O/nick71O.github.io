/*
 * Receives and processes global variables from another script (e.g., "Thousand Trails Member Login (Browser).js").
 * @param {Object} globalVariables - Object containing global variables.
 */
function initializeGlobalVariables(globalVariables) {
  // Process the received globalVariables object
  console.log("memberNumber: " + globalVariables.memberNumber);
  console.log("PIN: " + globalVariables.PIN);
  console.log('bookingPreference: "' + globalVariables.bookingPreference + '"');
  console.log("minimumConsecutiveDays: " + globalVariables.minimumConsecutiveDays);
  console.log("bookedArrivalDate: " + globalVariables.bookedArrivalDate);
  console.log("bookedDepartureDate: " + globalVariables.bookedDepartureDate);

  //launch() will be called after initializing global variables at the root of this file
}

// Call initializeGlobalVariables function in "Thousand Trails Member Login (Browser).js"
// This function will be called from "Thousand Trails Member Login (Browser).js" and receive the globalVariables object as an argument
// If initializeGlobalVariables is called from "Thousand Trails Member Login (Browser).js" before this script is loaded,
// it will execute immediately after this code block due to asynchronous loading
if (typeof globalVariables !== 'undefined') {
  initializeGlobalVariables(globalVariables);
}


const baseURL = "https://members.thousandtrails.com";

// XPath of button to click
var buttonXPath = "//*[@id='profile-form']/div[5]/button";

var $elements;

function getElementsByXPath(xpath, parent) {
  let results = [];
  let query = document.evaluate(xpath, parent || document,
    null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
  for (let i = 0, length = query.snapshotLength; i < length; ++i) {
    results.push(query.snapshotItem(i));
  }
  return results;
}

function getTimestamp() {
  var nowDate = new Date();
  var date = nowDate.toDateString();
  var time = nowDate.toLocaleTimeString();
  var timestamp = '--' + date + ', ' + time + '--';
  console.log(timestamp);
  return timestamp;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function click() {
  var foundButton = false;
  //window.console.log('searching page for the "Select Site" button');

  var memberid = document.getElementById('memberid');
  var pin = document.getElementById('pin');
  memberid.value = globalVariables.memberNumber;
  pin.value = globalVariables.PIN;

  $elements = getElementsByXPath(buttonXPath);
  $elements.forEach(($element) => {
    var evt = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: 20,
    });
    $element.dispatchEvent(evt);
    foundButton = true;
    console.log('clicked the "Submit" button');
  })

  getTimestamp();
}

function extractDatesFromQueryString(queryString) {
  const params = new URLSearchParams(queryString);

  const arrivalDate = params.get('arrivaldate');
  const departureDate = params.get('departuredate');

  return { arrivalDate, departureDate };
}

async function launch() {
  console.log('Hello from Thousand Trails Member Login');
  getTimestamp();

  //check for fatal site error
  //403 (Forbidden), 502 Bad Gateway, 504 Gateway Time-out
  const errorCode = document.title.substring(0, 3);
  const errorCodes = ["403", "502", "504"]
  if (errorCodes.includes(errorCode)) {
    console.log("ERROR: " + document.title);
    console.log("Sleeping for 3 minutes...");
    await sleep(180000);
    console.log("Reloading Page");
    window.location.reload();
  }
  //newer CloudFront errors
  if (document.title.toLowerCase() === "error: the request could not be satisfied") {
    console.log("CloudFront - " + document.title);
    //403 (Forbidden), 502 Bad Gateway, 504 Gateway Time-out
    if (document.body.innerText.toLowerCase().includes("403 error") || document.body.innerText.toLowerCase().includes("502 error") || document.body.innerText.toLowerCase().includes("504 error")) {

      // Clear session cookies
      //document.cookie.split(";").forEach(function (cookie) {
      //  document.cookie = cookie.replace(/^ +/, "")
      //    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      //});
      console.log("Sleeping...5 minute");
      await sleep(300000);
      //console.log("Reloading Page");
      //window.location.reload();
      redirectLoginPage();
    }
    console.log("Sleeping...5 minute");
    await sleep(300000);
    console.log("Reloading Page");
    window.location.reload();
  }

  //pull the query string that you assigned from the launch file
  let params = new URLSearchParams(document.location.search);
  window.console.log("parms: " + params);

  const { arrivalDate, departureDate } = extractDatesFromQueryString(params);
  console.log('Arrival Date:', arrivalDate);
  console.log('Departure Date:', departureDate);

  try {
    const db = await initializeDB();
    console.log('DB initialized successfully.');

    await deleteAllSiteConstants(db);
    await updateSiteConstantsDates(db, arrivalDate, departureDate);
    await addOrUpdateSiteConstant(db, 'BookingPreference', globalVariables.bookingPreference);
    await addOrUpdateSiteConstant(db, 'MinimumConsecutiveDays', globalVariables.minimumConsecutiveDays);
    await addOrUpdateSiteConstant(db, 'BookedArrivalDate', globalVariables.bookedArrivalDate);
    await addOrUpdateSiteConstant(db, 'BookedDepartureDate', globalVariables.bookedDepartureDate);
    await addOrUpdateSiteConstant(db, 'AvailableArrivalDate', null);
    await addOrUpdateSiteConstant(db, 'AvailableDepartureDate', null);

    await deleteAllAvailabilityRecords(db);
    const desiredArrivalConstant = await getSiteConstant(db, 'DesiredArrivalDate');
    const desiredDepartureConstant = await getSiteConstant(db, 'DesiredDepartureDate');
    if (desiredArrivalConstant && desiredDepartureConstant) {
      console.log('Desired Arrival Date:', desiredArrivalConstant.value);
      console.log('Desired Departure Date:', desiredDepartureConstant.value)
      await insertAvailabilityRecords(db, desiredArrivalConstant.value, desiredDepartureConstant.value);
    } else {
      console.error('Desired arrival or departure constant not found.');
    }

    await logSiteConstants(db);
    await logAvailabilityRecords(db);

  } catch (error) {
    console.error('Error performing operations:', error);
  }


  if (params != "") {
    localStorage.setItem("bookingQueryString", params);
  }

  await sleep(500);
  click();
}

async function redirectLoginPage() {
  var loginURL = baseURL + "/login/index";

  console.log("Redirecting to the Login Page");
  console.log(loginURL);
  await sleep(500);
  window.location.replace(loginURL);
}


console.log("-=~=- Logging into Thousand Trails -=~=-");
launch();


