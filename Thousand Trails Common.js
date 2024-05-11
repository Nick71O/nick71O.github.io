//console.log('Hello From Thousand Trails Common.js');

const callCenterHours = {
    mondayToFriday: { open: 9, close: 20 }, // 9 AM to 8 PM
    saturday: { open: 1, close: 14 }, // 10 AM to 2 PM
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
    await sendPushMessage(userKey, apiTokenCampsiteAvailability, pushoverUrl, message, '', '-1');
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

    const priority = 0;
    const sound = '';

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
        };

        // Send a POST request to Pushover API using Axios
        const response = await axios.post(pushoverUrl, messageData);
        console.log('Message sent:', response.data);
    } catch (error) {
        console.error('Error sending message:', error.response.data || error.message);
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