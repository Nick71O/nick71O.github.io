console.log('Hello From Thousand Trails Common.js');

// dynamically load additional scripts
loadScript('https://nick71o.github.io/Thousand%20Trails%20IndexedDB.js')
    /*
    .then(() => {
        // IndexedDB script has been successfully loaded
        return loadScript('https://nick71o.github.io/Thousand%20Trails%20Common.js');
    })
    */
    .then(() => {
        // Common script has been successfully loaded
        return loadScript('https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js');
    })
    .then(() => {
        // Axios script has been successfully loaded
        // Now you can safely use functions or variables from the loaded scripts here
    })
    .catch(error => {
        // Handle errors if any script fails to load
        console.error('Error loading scripts:', error);
    });



function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.defer = true; // Add the defer attribute

        script.onload = () => {
            console.log(`Script loaded: ${src}`);
            resolve(); // Resolve the promise when the script is loaded
        };

        script.onerror = () => {
            console.error(`Error loading script: ${src}`);
            reject(new Error(`Error loading script: ${src}`));
        };

        document.head.appendChild(script);
    });
}


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