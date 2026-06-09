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

async function launch() { 
    getTimestamp();
    try {
        console.log('Hello from Thousand Trails Parks');

        if (await handleUnexpectedLoginPageIfPresent({ reason: 'Member login page detected while loading parks.' })) {
            return;
        }

        const db = await initializeDB();
        console.log('IndexedDB initialized successfully.');
        if (await handleHumanVerificationIfPresent(db)) {
            return;
        }

        await logSiteConstants(db);

        await redirectBookingPage();
    } catch (error) {
        console.error('FAILED to redirect to the Campgrounds Booking Page. siteConstants in the IndexedDB was not loaded or blank', error);
        await sleep(5000);
        if (!canContinueThousandTrailsAutomation('Thousand Trails automation stopped before reloading the parks page.')) {
            return;
        }
        console.log("Reloading Page");
        window.location.reload();
    }
}


async function redirectBookingPage() {
    var bookingQueryString = "?robot=78"
    var bookingURL = baseURL + "/reserve/index" + bookingQueryString

    console.log("Redirecting to the Campgrounds Booking Page");
    console.log(bookingURL);
    await sleep(500);
    if (!canContinueThousandTrailsAutomation('Thousand Trails automation stopped before redirecting to the booking page.')) {
        return;
    }
    window.location.replace(bookingURL);
}
