console.log('Hello From Thousand Trails Common.js');


// Function to send a message using Pushover API
async function sendMessage(userKey, apiToken, pushoverUrl, message, sound = '') {
    try {
        // Message data to send
        const messageData = {
            token: apiToken,
            user: userKey,
            message: message,
            sound: sound,
        };

        // Send a POST request to Pushover API using Axios
        const response = await axios.post(pushoverUrl, messageData);
        console.log('Message sent:', response.data);
    } catch (error) {
        console.error('Error sending message:', error.response.data || error.message);
    }
}

//priority