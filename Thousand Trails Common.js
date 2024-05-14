//console.log('Hello From Thousand Trails Common.js');

const callCenterHours = {
    mondayToFriday: { open: 9, close: 20 }, // 9 AM to 8 PM
    saturday: { open: 10, close: 14 }, // 10 AM to 2 PM
    sunday: { open: 12, close: 14 }, // 12 PM to 2 PM
};

const baseURL = "https://members.thousandtrails.com"
// Pushover API endpoint for sending messages
const pushoverUrl = 'https://api.pushover.net/1/messages.json';

// Pushover API credentials
const userKey = 'uhd4fsc2u9vtgo2xmeud2m3b2afssc';
const apiTokenCampsiteAvailability = 'ap4vd6fzg5gk6d8baewc5ph67qbsxn';
const apiTokenCampsiteHackr = 'azjfxgydofw9k6dpm3zyebcz6of4qw';


// Function to push site availability message
async function pushSiteAvailabilityMessage(message) {
    await sendPushMessage(userKey, apiTokenCampsiteAvailability, pushoverUrl, message, '', -1);
}

// Function to push book site message
async function pushBookSiteMessage(message) {
    const openSound = 'echo';
    const openPriority = 1;
    const closedSound = 'none';
    const closedPriority = 0;
    
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const hourOfDay = now.getHours();

    let priority = 0;
    let sound = '';

    // Set priority and sound based on call center hours
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
        if (hourOfDay >= callCenterHours.mondayToFriday.open && hourOfDay < callCenterHours.mondayToFriday.close) {
            sound = openSound;
            priority = openPriority;
        }
    } else if (dayOfWeek === 6) { // Saturday
        if (hourOfDay >= callCenterHours.saturday.open && hourOfDay < callCenterHours.saturday.close) {
            sound = openSound;
            priority = openPriority;
        }
    } else if (dayOfWeek === 0) { // Sunday
        if (hourOfDay >= callCenterHours.sunday.open && hourOfDay < callCenterHours.sunday.close) {
            sound = openSound;
            priority = openPriority;
        }
    } else { // Outside of call center hours
        sound = closedSound;
        priority = closedPriority;
    }

    await sendPushMessage(userKey, apiTokenCampsiteHackr, pushoverUrl, message, sound, priority);
}

// Function to push site booked message
async function pushSiteBookedMessage(message) {
    await sendPushMessage(userKey, apiTokenCampsiteAvailability, pushoverUrl, message, '', 0);
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
    scDesiredArrivalDate,
    scDesiredDepartureDate,
    scAvailableArrivalDate,
    scAvailableDepartureDate,
    scBookedArrivalDate,
    scBookedDepartureDate,
    availableDateArray,
    reservationError
) {
    const messageBuilder = [];

    messageBuilder.push('Thousand Trails - Lake & Shore');

    // Switch to handle different message types
    switch (messageType) {
        case 'step1':
            //messageBuilder.push('Step 1: Some specific message for Step 1');
            break;
        case 'step2':
            //messageBuilder.push('Step 2: Some specific message for Step 2');
            break;
        case 'step3':
            messageBuilder.push('Campsite is available for booking!\n');
            break;
        case 'step4':
            messageBuilder.push('Campsite is booked!\n');
            break;
        default:
            //messageBuilder.push('Default message for unknown step');
    }

    // Append availabile dates to book
    if (scAvailableArrivalDate !== null && scAvailableDepartureDate !== null) {
        const oneDay = 24 * 60 * 60 * 1000; // hours * minutes * seconds * milliseconds
        const dateDifference = Math.abs(new Date(scAvailableDepartureDate).getTime() - new Date(scAvailableArrivalDate).getTime());
        const scAvailabileNumberOfNights = Math.round(dateDifference / oneDay);

        messageBuilder.push(`Availabile Dates to Book:\nArrival: ${scAvailableArrivalDate}    Departure: ${scAvailableDepartureDate}    Number of Nights: ${scAvailabileNumberOfNights}`);
    }

    // Append available dates from array
    if (availableDateArray !== null) {
        messageBuilder.push(concatenateAvailableDatesToString(availableDateArray));
    }

    // Append desired dates to book
    if (scDesiredArrivalDate !== null && scDesiredDepartureDate !== null) {
        const oneDay = 24 * 60 * 60 * 1000; // hours * minutes * seconds * milliseconds
        const dateDifference = Math.abs(new Date(scDesiredDepartureDate).getTime() - new Date(scDesiredArrivalDate).getTime());
        const scDesiredNumberOfNights = Math.round(dateDifference / oneDay);
    
        messageBuilder.push(`\nDesired Dates to Book:\nArrival: ${scDesiredArrivalDate}    Departure: ${scDesiredDepartureDate}    Number of Nights: ${scDesiredNumberOfNights}`);
    }

    // Append existing booked reservation if available
    if (scBookedArrivalDate !== null && scBookedDepartureDate !== null) {
        const oneDay = 24 * 60 * 60 * 1000; // hours * minutes * seconds * milliseconds
        const dateDifference = Math.abs(new Date(scBookedDepartureDate).getTime() - new Date(scBookedArrivalDate).getTime());
        const scBookedNumberOfNights = Math.round(dateDifference / oneDay);

        messageBuilder.push(`\nExisting Booked Reservation:\nArrival: ${scBookedArrivalDate}    Departure: ${scBookedDepartureDate}    Number of Nights: ${scBookedNumberOfNights}`);
    }

    messageBuilder.push('\nTo book, call: 888-551-9102');

    // Append reservation error if defined
    if (reservationError !== null && reservationError !== undefined) {
        const trimmedError = reservationError.trim();
        messageBuilder.push(`\nError Received: ${trimmedError}`);
    }

    return messageBuilder.join('\n'); // Convert array to string using newline separator
}


function concatenateAvailableDatesToString(datesArray) {
    let concatenatedString = 'Currently Available Dates: ';
    if (datesArray.length === 0) {
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

async function availabilityCheckIntervalSleep(db) {
    const scAvailabilityCheckIntervalMinutesConstant = await getSiteConstant(db, 'AvailabilityCheckIntervalMinutes');
    let scAvailabilityCheckIntervalMinutes = 5;

    if (scAvailabilityCheckIntervalMinutesConstant !== null && scAvailabilityCheckIntervalMinutesConstant !== undefined) {
        const intervalMinutes = parseInt(scAvailabilityCheckIntervalMinutesConstant.value, 10);

        if (!isNaN(intervalMinutes)) {
            scAvailabilityCheckIntervalMinutes = intervalMinutes;
            console.log(`Availability check interval updated to ${scAvailabilityCheckIntervalMinutes} minutes.`);
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

async function resetBookingAvailabilityProcess(db) {
    // Clear database and reset availability
    await addOrUpdateSiteConstant(db, 'AvailableArrivalDate', null);
    await addOrUpdateSiteConstant(db, 'AvailableDepartureDate', null);
    await resetAvailabilityTable(db);
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