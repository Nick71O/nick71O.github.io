//console.log('Hello From Thousand Trails Common.js');

//called to confirm hours on 5/15/24
const callCenterHours = {
    mondayToFriday: { open: { hours: 8, minutes: 30 }, close: { hours: 20, minutes: 30 } }, // 8:30 AM to 8:30 PM EST
    saturday: { open: { hours: 9, minutes: 30 }, close: { hours: 18, minutes: 0 } }, // 9:30 AM to 6 PM EST
    sunday: { open: { hours: 9, minutes: 30 }, close: { hours: 18, minutes: 0 } }, // 9:30 AM to 6 PM EST
};

const baseURL = "https://members.thousandtrails.com"
// Pushover API endpoint for sending messages
const pushoverUrl = 'https://api.pushover.net/1/messages.json';


async function getPushoverKeys(db) {
    // Pushover API credentials
    const userKey = await getSiteConstant(db, 'PushoverUserKey');
    const apiTokenAvailability = await getSiteConstant(db, 'PushoverApiTokenAvailability');
    const apiTokenReservation = await getSiteConstant(db, 'PushoverApiTokenReservation');

    if (!userKey || !userKey.value.trim()) {
        console.error('Error: PushoverUserKey is null or blank.');
    }
    if (!apiTokenAvailability || !apiTokenAvailability.value.trim()) {
        console.error('Error: PushoverApiTokenAvailability is null or blank.');
    }
    if (!apiTokenReservation || !apiTokenReservation.value.trim()) {
        console.error('Error: PushoverApiTokenReservation is null or blank.');
    }

    if (userKey && userKey.value.trim() &&
        apiTokenAvailability && apiTokenAvailability.value.trim() &&
        apiTokenReservation && apiTokenReservation.value.trim()) {
        return {
            userKey: userKey.value.trim(),
            apiTokenAvailability: apiTokenAvailability.value.trim(),
            apiTokenReservation: apiTokenReservation.value.trim()
        };
    } else {
        return null;
    }
}

// Function to push site availability message
async function pushSiteAvailabilityMessage(db, message) {
    const pushoverKeys = await getPushoverKeys(db);
    if (pushoverKeys) {
        await sendPushMessage(pushoverKeys.userKey, pushoverKeys.apiTokenAvailability, pushoverUrl, message, '', -1);
    }
}

// Function to push book site message
async function pushBookSiteMessage(db, message) {
    const pushoverKeys = await getPushoverKeys(db);
    if (pushoverKeys) {
        const openSound = 'echo';
        const openPriority = 1;
        const closedSound = 'none';
        const closedPriority = 0;

        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const hourOfDay = now.getHours();
        const minuteOfHour = now.getMinutes();

        let priority = 0;
        let sound = '';

        // Set priority and sound based on call center hours
        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
            const { open, close } = callCenterHours.mondayToFriday;
            if (
                (hourOfDay > open.hours || (hourOfDay === open.hours && minuteOfHour >= open.minutes)) &&
                (hourOfDay < close.hours || (hourOfDay === close.hours && minuteOfHour < close.minutes))
            ) {
                sound = openSound;
                priority = openPriority;
            }
        } else if (dayOfWeek === 6) { // Saturday
            const { open, close } = callCenterHours.saturday;
            if (
                (hourOfDay > open.hours || (hourOfDay === open.hours && minuteOfHour >= open.minutes)) &&
                (hourOfDay < close.hours || (hourOfDay === close.hours && minuteOfHour < close.minutes))
            ) {
                sound = openSound;
                priority = openPriority;
            }
        } else if (dayOfWeek === 0) { // Sunday
            const { open, close } = callCenterHours.sunday;
            if (
                (hourOfDay > open.hours || (hourOfDay === open.hours && minuteOfHour >= open.minutes)) &&
                (hourOfDay < close.hours || (hourOfDay === close.hours && minuteOfHour < close.minutes))
            ) {
                sound = openSound;
                priority = openPriority;
            }
        } else { // Outside of call center hours
            sound = closedSound;
            priority = closedPriority;
        }

        await sendPushMessage(pushoverKeys.userKey, pushoverKeys.apiTokenReservation, pushoverUrl, message, sound, priority);
    }
}

// Function to push site booked message
async function pushSiteBookedMessage(db, message) {
    const pushoverKeys = await getPushoverKeys(db);
    if (pushoverKeys) {
        await sendPushMessage(pushoverKeys.userKey, pushoverKeys.apiTokenReservation, pushoverUrl, message, '', 0);
    }
}

// Function to send a message using Pushover API
async function sendPushMessage(userKey, apiToken, pushoverUrl, message, sound = '', priority = '', ttl = '') {
    //const ttl = 3600; // TTL in seconds (1 hour)
    try {
        // Message data to send
        const messageData = {
            token: apiToken,
            user: userKey,
            message: message,
            sound: sound,
            priority: priority,
            ttl: ttl,
            html: 1
        };

        // Send a POST request to Pushover API using Axios
        const response = await axios.post(pushoverUrl, messageData);
        console.log('Message sent:', response.data);
    } catch (error) {
        console.error('Error sending message:', error.response.data || error.message);
    }
}

function composeMessageToSend(
    messageType,
    scBookingPreference,
    scDesiredArrivalDate,
    scDesiredDepartureDate,
    scDesiredDatesArray,
    scAvailableArrivalDate,
    scAvailableDepartureDate,
    scAvailableSiteType,
    scBookedArrivalDate,
    scBookedDepartureDate,
    scBookedDatesArray,
    scBookedSiteType,
    availableDateArray,
    reservationError
) {
    const messageBuilder = [];

    messageBuilder.push('Thousand Trails - Lake & Shore');
    let availabileDatesTitle = 'Available Dates to Book';

    // Switch to handle different message types
    switch (messageType) {
        case 'step1':
            //messageBuilder.push('Step 1: Some specific message for Step 1');
            break;
        case 'step2':
            //messageBuilder.push('Step 2: Some specific message for Step 2');
            break;
        case 'step3':
            messageBuilder.push('<b>Campsite is available for booking!</b>');
            break;
        case 'step4':
            messageBuilder.push('<b>Reservation Confirmed!</b>');
            availabileDatesTitle = 'Booked';
            break;
        default:
        //messageBuilder.push('Default message for unknown step');
    }

    // Append available dates to book
    if (scAvailableArrivalDate !== null && scAvailableDepartureDate !== null) {
        let bookedDatesInRange = getAllDatesInRangeOrArray(null, scAvailableArrivalDate, scAvailableDepartureDate);
        //console.log('Booked Dates In Range:', bookedDatesInRange);
        let allConsecutiveRanges = getConsecutiveDateRanges(bookedDatesInRange);
        //console.log('allConsecutiveRanges: ', allConsecutiveRanges);
        const bookedDateRangeMessage = buildDateRangeMessage(`\n<u>${availabileDatesTitle}:</u>`, allConsecutiveRanges);
        messageBuilder.push(bookedDateRangeMessage);
        if (scAvailableSiteType) {
            messageBuilder.push(`${scAvailableSiteType}`);
        }
    }

    // Append available dates from array
    if (availableDateArray !== null) {
        messageBuilder.push(concatenateAvailableDatesToString(availableDateArray));
    }

    // Append desired dates to book
    if (scDesiredDatesArray && scBookingPreference === 'datearray') {
        let desiredDatesInRange = getAllDatesInRangeOrArray(scDesiredDatesArray, null, null);
        //console.log('Desired Dates In Range:', desiredDatesInRange);
        let allConsecutiveRanges = getConsecutiveDateRanges(desiredDatesInRange);
        //console.log('allConsecutiveRanges: ', allConsecutiveRanges);
        const desiredDateRangeMessage = buildDateRangeMessage('\n<u>Desired Dates to Book:</u>', allConsecutiveRanges);
        messageBuilder.push(desiredDateRangeMessage);
    } else if (scDesiredArrivalDate && scDesiredDepartureDate) {
        let desiredDatesInRange = getAllDatesInRangeOrArray(null, scDesiredArrivalDate, scDesiredDepartureDate);
        //console.log('Desired Dates In Range:', desiredDatesInRange);
        let allConsecutiveRanges = getConsecutiveDateRanges(desiredDatesInRange);
        //console.log('allConsecutiveRanges: ', allConsecutiveRanges);
        const desiredDateRangeMessage = buildDateRangeMessage('\n<u>Desired Dates to Book:</u>', allConsecutiveRanges);
        messageBuilder.push(desiredDateRangeMessage);
    } 

    // Append existing booked reservation if available
    if (scBookedDatesArray && scBookingPreference === 'datearray') {
        let bookedDatesInRange = getAllDatesInRangeOrArray(scBookedDatesArray, null, null);
        //console.log('Booked Dates In Range:', bookedDatesInRange);
        let allConsecutiveRanges = getConsecutiveDateRanges(bookedDatesInRange);
        //console.log('allConsecutiveRanges: ', allConsecutiveRanges);
        const bookedDateRangeMessage = buildDateRangeMessage('\n<u>Existing Booked Reservations:</u>', allConsecutiveRanges);
        messageBuilder.push(bookedDateRangeMessage);
        if (scBookedSiteType) {
            messageBuilder.push(`${scBookedSiteType}`);
        }
    } else if (scBookedArrivalDate && scBookedDepartureDate) {
        let bookedDatesInRange = getAllDatesInRangeOrArray(null, scBookedArrivalDate, scBookedDepartureDate);
        //console.log('Booked Dates In Range:', bookedDatesInRange);
        let allConsecutiveRanges = getConsecutiveDateRanges(bookedDatesInRange);
        //console.log('allConsecutiveRanges: ', allConsecutiveRanges);
        const bookedDateRangeMessage = buildDateRangeMessage('\n<u>Existing Booked Reservations:</u>', allConsecutiveRanges);
        messageBuilder.push(bookedDateRangeMessage);
        if (scBookedSiteType) {
            messageBuilder.push(`${scBookedSiteType}`);
        }
    } 

    messageBuilder.push('\nThousand Trails: (888) 551-9102');

    // Append reservation error if defined
    if (reservationError !== null && reservationError !== undefined) {
        const trimmedError = reservationError.trim();
        messageBuilder.push(`\n<b>Error Received:</b> ${trimmedError}`);
    }

    return messageBuilder.join('\n'); // Convert array to string using newline separator
}

function buildDateRangeMessage(title, allConsecutiveRanges) {
    const messageBuilder = [title];

    if (allConsecutiveRanges.length === 0) {
        messageBuilder.push('    None');
    } else {
        allConsecutiveRanges.forEach(range => {
            const arrivalDate = range[0].toLocaleDateString('en-US', formatDateOptions);
            const departureDate = new Date(range[range.length - 1].getTime() + 86400000).toLocaleDateString('en-US', formatDateOptions); // Add 1 day to get the next day
            const numberOfNights = range.length; // Number of nights is the length of the range

            const nightsLabel = numberOfNights === 1 ? 'Night' : 'Nights';
            messageBuilder.push(`    ${arrivalDate} - ${departureDate} (${numberOfNights} ${nightsLabel})`);
        });
    }

    return messageBuilder.join('\n');
}

function getAllDatesInRangeOrArray(array, start, end) {
    const inRange = [];

    if (!start && !end) {
        if (array && array.length > 0) {
            inRange.push(...array.map(dateString => new Date(dateString)));
        }
    } else {
        const startDate = new Date(start);
        const endDate = new Date(end);

        for (let dt = new Date(startDate); dt < endDate; dt.setDate(dt.getDate() + 1)) {
            inRange.push(new Date(dt));
        }
    }

    return inRange;
}

function getConsecutiveDateRanges(dateStrArray) {
    const dates = dateStrArray
        .filter(str => str && !isNaN(new Date(str))) // Remove empty or invalid strings
        .map(str => new Date(str));

    let currentRange = [];
    let allRanges = [];

    for (let i = 0; i < dates.length; i++) {
        if (i === 0 || dates[i].getTime() !== dates[i - 1].getTime() + 86400000) {
            if (currentRange.length > 0) {
                allRanges.push(currentRange);
            }
            currentRange = [dates[i]];
        } else {
            currentRange.push(dates[i]);
        }
    }

    if (currentRange.length > 0) {
        allRanges.push(currentRange);
    }

    return allRanges;
}

function concatenateAvailableDatesToString(datesArray) {
    let concatenatedString = 'Currently Available Dates: ';
    if (!Array.isArray(datesArray) || datesArray.length === 0) {
        concatenatedString += '<b>None</b>';
    } else {
        datesArray.forEach((date, index) => {
            concatenatedString += date;
            if (index < datesArray.length - 1) {
                concatenatedString += ', ';
            }
        });
    }
    return concatenatedString;
}

async function resetBookingAvailabilityProcess(db) {
    // Clear database and reset availability
    await addOrUpdateSiteConstant(db, 'AvailableArrivalDate', null);
    await addOrUpdateSiteConstant(db, 'AvailableDepartureDate', null);
    await resetAvailabilityTable(db);
}

async function availabilityCheckIntervalSleep(db) {
    const scAvailabilityCheckIntervalMinutesConstant = await getSiteConstant(db, 'AvailabilityCheckIntervalMinutes');
    let scAvailabilityCheckIntervalMinutes = 5;

    if (scAvailabilityCheckIntervalMinutesConstant !== null && scAvailabilityCheckIntervalMinutesConstant !== undefined) {
        const intervalMinutes = parseInt(scAvailabilityCheckIntervalMinutesConstant.value, 10);

        if (!isNaN(intervalMinutes)) {
            scAvailabilityCheckIntervalMinutes = intervalMinutes;
            //console.log(`Availability check interval updated to ${scAvailabilityCheckIntervalMinutes} minutes.`);
        } else {
            console.error('Invalid value for availability check interval in site constants.');
        }
    } else {
        console.log('Availability check interval not found in site constants. Using default value.');
    }

    const processAvailabilityElapseTime = await getProcessAvailabilityElapseTime(db);
    console.log(`Process Availability Elapse Time: ${processAvailabilityElapseTime} seconds`);

    const availabilityCheckIntervalInMillis = scAvailabilityCheckIntervalMinutes * 60 * 1000;
    const remainingTimeInMillis = availabilityCheckIntervalInMillis - (processAvailabilityElapseTime * 1000);

    const remainingMinutes = Math.floor(remainingTimeInMillis / (1000 * 60));
    const remainingSeconds = Math.floor((remainingTimeInMillis % (1000 * 60)) / 1000);

    let message = `\nSleeping... ${remainingMinutes} minutes`;
    if (remainingSeconds > 0) {
        message += ` and ${remainingSeconds} seconds`;
    }
    console.log(message);

    await sleep(remainingTimeInMillis);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function isValidDate(dateString) {
    // Check if the input is a valid date
    return dateString && !isNaN(Date.parse(dateString));
}

function getTimestamp() {
    var nowDate = new Date();
    var date = nowDate.toDateString();
    var time = nowDate.toLocaleTimeString();
    var timestamp = '--' + date + ', ' + time + '--';
    console.log(timestamp);
    return timestamp;
}