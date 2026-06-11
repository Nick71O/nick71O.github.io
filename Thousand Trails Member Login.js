/*
 * Receives and processes global variables from another script (e.g., "Thousand Trails Member Login (Browser).js").
 * @param {Object} globalVariables - Object containing global variables.
 */
function fallbackMaskSensitiveGlobalValue(value) {
  if (value === null || value === undefined || value === '') {
    return value;
  }

  const stringValue = String(value);
  if (stringValue.length <= 8) {
    return '********';
  }

  return `${stringValue.slice(0, 4)}...${stringValue.slice(-4)}`;
}

function maskSensitiveGlobalValue(value) {
  if (typeof maskSensitiveValue === 'function') {
    return maskSensitiveValue(value);
  }

  return fallbackMaskSensitiveGlobalValue(value);
}

function initializeGlobalVariables(globalVariables) {
  // Process the received globalVariables object
  console.log('memberNumber: "' + maskSensitiveGlobalValue(globalVariables.memberNumber) + '"');
  console.log('PIN: "' + maskSensitiveGlobalValue(globalVariables.PIN) + '"');
  console.log('bookingPreference: "' + globalVariables.bookingPreference + '"');
  console.log('bookingAvailabilityMapCheck: "' + globalVariables.bookingAvailabilityMapCheck + '"');
  console.log("minimumConsecutiveDays: " + globalVariables.minimumConsecutiveDays);
  console.log("availabilityCheckIntervalMinutes: " + globalVariables.availabilityCheckIntervalMinutes)
  console.log("humanVerificationReloadMinutes: " + globalVariables.humanVerificationReloadMinutes)
  console.log('reservationInputSiteType: "' + globalVariables.reservationInputSiteType + '"');
  console.log('reservationInputEquipmentType: "' + globalVariables.reservationInputEquipmentType + '"');
  console.log('reservationInputLength: "' + globalVariables.reservationInputLength + '"');
  console.log('reservationInputWithSlideouts: "' + globalVariables.reservationInputWithSlideouts + '"');
  console.log('reservationInputAdults: "' + globalVariables.reservationInputAdults + '"');
  console.log('reservationInputChildren: "' + globalVariables.reservationInputChildren + '"');
  console.log('reservationInputPets: "' + globalVariables.reservationInputPets + '"');
  console.log("desiredArrivalDate: " + globalVariables.desiredArrivalDate);
  console.log("desiredDepartureDate: " + globalVariables.desiredDepartureDate)
  console.log("desiredDatesArray: " + globalVariables.desiredDatesArray.join(", "));
  console.log("desiredSiteTypes: " + globalVariables.desiredSiteTypes.join(", "));
  console.log("bookedArrivalDate: " + globalVariables.bookedArrivalDate);
  console.log("bookedDepartureDate: " + globalVariables.bookedDepartureDate);
  console.log("bookedDatesArray: " + globalVariables.bookedDatesArray.join(", "));
  console.log("bookedSiteType: " + globalVariables.bookedSiteType);
  console.log('pushoverUserKey: "' + maskSensitiveGlobalValue(globalVariables.pushoverUserKey) + '"');
  console.log('pushoverApiTokenAvailability: "' + maskSensitiveGlobalValue(globalVariables.pushoverApiTokenAvailability) + '"');
  console.log('pushoverApiTokenReservation: "' + maskSensitiveGlobalValue(globalVariables.pushoverApiTokenReservation) + '"')
}

// Call initializeGlobalVariables function in "Thousand Trails Member Login (Browser).js"
// This function will be called from "Thousand Trails Member Login (Browser).js" and receive the globalVariables object as an argument
// If initializeGlobalVariables is called from "Thousand Trails Member Login (Browser).js" before this script is loaded,
// it will execute immediately after this code block due to asynchronous loading
if (typeof globalVariables !== 'undefined') {
  initializeGlobalVariables(globalVariables);
}

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
    startThousandTrailsAutomation(launch);
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


function getLoginSubmitButtons() {
  const buttons = getElementsByXPath(buttonXPath);
  const fallbackButtons = Array.from(document.querySelectorAll(
    '#profile-form button[type="submit"], #profile-form button.g-recaptcha, #profile-form button'
  ));

  fallbackButtons.forEach(button => {
    if (!buttons.includes(button)) {
      buttons.push(button);
    }
  });

  return buttons;
}

async function click() {
  const memberid = document.getElementById('memberid');
  const pin = document.getElementById('pin');

  if (!memberid || !pin) {
    console.error('Login form fields were not found.');
    return false;
  }

  memberid.value = globalVariables.memberNumber;
  pin.value = globalVariables.PIN;

  $elements = getLoginSubmitButtons();
  if (!$elements.length) {
    console.error('Login submit button was not found.');
    return false;
  }

  $elements[0].click();
  console.log('clicked the "Submit" button');
  getTimestamp();
  return true;
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
    if (!canContinueThousandTrailsAutomation('Thousand Trails automation stopped before reloading the login page.')) {
      return;
    }
    console.log("Reloading Page");
    window.location.reload();
    return;
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
      if (!canContinueThousandTrailsAutomation('Thousand Trails automation stopped before redirecting to the login page.')) {
        return;
      }
      //console.log("Reloading Page");
      //window.location.reload();
      await redirectLoginPage();
      return;
    }
    console.log("Sleeping...5 minute");
    await sleep(300000);
    if (!canContinueThousandTrailsAutomation('Thousand Trails automation stopped before reloading the login page.')) {
      return;
    }
    console.log("Reloading Page");
    window.location.reload();
  }

  //pull the query string that you assigned from the launch file
  //let params = new URLSearchParams(document.location.search);
  //window.console.log("parms: " + params);

  //const { arrivalDate, departureDate } = extractDatesFromQueryString(params);
  //console.log('Desired Arrival Date:', arrivalDate);
  //console.log('Desired Departure Date:', departureDate);

  try {
    const db = await initializeDB();
    console.log('DB initialized successfully.');

    if (await handleHumanVerificationIfPresent(db)) {
      return;
    }

    await deleteAllSiteConstants(db);
    await addOrUpdateSiteConstant(db, 'BookingPreference', globalVariables.bookingPreference);
    await addOrUpdateSiteConstant(db, 'BookingAvailabilityMapCheck', globalVariables.bookingAvailabilityMapCheck);
    let initialLastUsed = globalVariables.bookingAvailabilityMapCheck.toLowerCase() === 'both' ? 'single' : globalVariables.bookingAvailabilityMapCheck.toLowerCase();
    await addOrUpdateSiteConstant(db, 'LastUsedBookingAvailabilityMapCheck', initialLastUsed);
    await addOrUpdateSiteConstant(db, 'MinimumConsecutiveDays', globalVariables.minimumConsecutiveDays);
    await addOrUpdateSiteConstant(db, 'AvailabilityCheckIntervalMinutes', globalVariables.availabilityCheckIntervalMinutes);
    await addOrUpdateSiteConstant(db, 'HumanVerificationReloadMinutes', globalVariables.humanVerificationReloadMinutes || humanVerificationDefaultReloadMinutes);
    await addOrUpdateSiteConstant(db, 'ReservationInputSiteType', globalVariables.reservationInputSiteType);
    await addOrUpdateSiteConstant(db, 'ReservationInputEquipmentType', globalVariables.reservationInputEquipmentType);
    await addOrUpdateSiteConstant(db, 'ReservationInputLength', globalVariables.reservationInputLength);
    await addOrUpdateSiteConstant(db, 'ReservationInputWithSlideouts', globalVariables.reservationInputWithSlideouts);
    await addOrUpdateSiteConstant(db, 'ReservationInputAdults', globalVariables.reservationInputAdults);
    await addOrUpdateSiteConstant(db, 'ReservationInputChildren', globalVariables.reservationInputChildren);
    await addOrUpdateSiteConstant(db, 'ReservationInputPets', globalVariables.reservationInputPets);
    await addOrUpdateSiteConstant(db, 'DesiredArrivalDate', globalVariables.desiredArrivalDate);
    await addOrUpdateSiteConstant(db, 'DesiredDepartureDate', globalVariables.desiredDepartureDate);
    await addOrUpdateSiteConstant(db, 'DesiredDatesArray', JSON.stringify(globalVariables.desiredDatesArray));
    await addOrUpdateSiteConstant(db, 'DesiredSiteTypes', JSON.stringify(globalVariables.desiredSiteTypes));
    await addOrUpdateSiteConstant(db, 'BookedArrivalDate', globalVariables.bookedArrivalDate);
    await addOrUpdateSiteConstant(db, 'BookedDepartureDate', globalVariables.bookedDepartureDate);
    await addOrUpdateSiteConstant(db, 'BookedDatesArray', JSON.stringify(globalVariables.bookedDatesArray));
    await addOrUpdateSiteConstant(db, 'BookedSiteType', globalVariables.bookedSiteType);
    await addOrUpdateSiteConstant(db, 'AvailableArrivalDate', null);
    await addOrUpdateSiteConstant(db, 'AvailableDepartureDate', null);
    await addOrUpdateSiteConstant(db, 'AvailableSiteType', null);
    await addOrUpdateSiteConstant(db, 'PushoverUserKey', globalVariables.pushoverUserKey);
    await addOrUpdateSiteConstant(db, 'PushoverApiTokenAvailability', globalVariables.pushoverApiTokenAvailability);
    await addOrUpdateSiteConstant(db, 'PushoverApiTokenReservation', globalVariables.pushoverApiTokenReservation);

    await deleteAllAvailabilityRecords(db);

    const scDesiredArrivalConstant = await getSiteConstant(db, 'DesiredArrivalDate');
    const scDesiredDepartureConstant = await getSiteConstant(db, 'DesiredDepartureDate');
    const scDesiredDatesArrayConstant = await getSiteConstant(db, 'DesiredDatesArray');
    const scDesiredSiteTypesConstant = await getSiteConstant(db, 'DesiredSiteTypes');
    const scBookingPreferenceConstant = await getSiteConstant(db, 'BookingPreference');
    const scMinimumConsecutiveDaysConstant = await getSiteConstant(db, 'MinimumConsecutiveDays');
    let scBookingPreference = null;

    // Check if constants were retrieved successfully and if their values are not null or empty
    const isValidConstant = (constant) =>
      constant &&
      constant.value !== null &&
      constant.value.trim() !== '';

    if (isValidConstant(scBookingPreferenceConstant)) {
      scBookingPreference = scBookingPreferenceConstant.value.toLowerCase();
      console.log('Booking Preference:', scBookingPreference);
    }

    if (isValidConstant(scDesiredDatesArrayConstant) && (scBookingPreference === 'auto' || scBookingPreference === 'datearray')) {
      let scDesiredDatesArray = JSON.parse(scDesiredDatesArrayConstant.value);
      console.log('SiteConstant Desired Dates Array: ' + scDesiredDatesArray)
      //override MinimumConsecutiveDays because your using a datearray
      await addOrUpdateSiteConstant(db, 'MinimumConsecutiveDays', 1);
      //override BookingPreference if it was auto to be datearray for identification
      await addOrUpdateSiteConstant(db, 'BookingPreference', 'datearray');
      await insertAvailabilityRecords2(db, scDesiredDatesArray);

    } else if (isValidConstant(scDesiredArrivalConstant) && isValidConstant(scDesiredDepartureConstant) && scBookingPreference === 'consecutive') {
        //Handle consecutive booking preference
        console.log('SiteConstant Desired Arrival Date:', scDesiredArrivalConstant.value);
        console.log('SiteConstant Desired Departure Date:', scDesiredDepartureConstant.value);
        const minimumConsecutiveDays = await normalizeMinimumConsecutiveDaysForDesiredRange(
          db,
          scDesiredArrivalConstant.value,
          scDesiredDepartureConstant.value,
          scMinimumConsecutiveDaysConstant.value
        );
        await insertConsecutiveAvailabilityRecords(db, scDesiredArrivalConstant.value, scDesiredDepartureConstant.value, minimumConsecutiveDays);

    } else if (isValidConstant(scDesiredArrivalConstant) && isValidConstant(scDesiredDepartureConstant)) {
        // Fallback: handles generic (non-consecutive) date range
        console.log('SiteConstant Desired Arrival Date:', scDesiredArrivalConstant.value);
        console.log('SiteConstant Desired Departure Date:', scDesiredDepartureConstant.value);
        await insertAvailabilityRecords(db, scDesiredArrivalConstant.value, scDesiredDepartureConstant.value);

    } else {
      console.error('SiteConstant Desired Arrival\Departure or Array constant is null, empty, or not found.');
    }

    if (isValidConstant(scDesiredSiteTypesConstant)) {
      let scDesiredSiteTypes = JSON.parse(scDesiredSiteTypesConstant.value);
      console.log('SiteConstant Desired Site Types: ' + scDesiredSiteTypes)
    }

    await logSiteConstants(db);
    await logAvailabilityRecords(db);

    const availabilityRecordCount = await getObjectStoreRecordCount(db, 'Availability');
    if (availabilityRecordCount === 0) {
      stopThousandTrailsAutomation(
        'No Dates To Check',
        'Thousand Trails automation stopped. No availability records could be generated from the configured desired dates.'
      );
      return;
    }

  } catch (error) {
    console.error('Error performing operations:', error);
  }

  await sleep(500);
  if (!canContinueThousandTrailsAutomation('Thousand Trails automation stopped before submitting the login form.')) {
    return;
  }
  const submitted = await click();
  if (!submitted) {
    console.log("Sleeping...30 seconds");
    await sleep(30000);
    if (!canContinueThousandTrailsAutomation('Thousand Trails automation stopped before reloading the login page.')) {
      return;
    }
    console.log("Reloading Page");
    window.location.reload();
  }
}

async function redirectLoginPage() {
  var loginURL = baseURL + "/login/index";

  console.log("Redirecting to the Login Page");
  console.log(loginURL);
  await sleep(500);
  if (!canContinueThousandTrailsAutomation('Thousand Trails automation stopped before redirecting to the login page.')) {
    return;
  }
  window.location.replace(loginURL);
}
