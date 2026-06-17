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
        const campgroundBookingUrl = await updateConfiguredCampgroundUrls(db);
        if (!campgroundBookingUrl) {
            stopThousandTrailsAutomation(
                'Campground URL Not Found',
                'Thousand Trails automation stopped. Campground booking URL could not be discovered from the parks page.'
            );
            return;
        }

        await redirectBookingPage(db);
    } catch (error) {
        console.error('FAILED to redirect to the Campgrounds Booking Page. siteConstants in the IndexedDB was not loaded or blank', error);
        console.log("Sleeping...5 seconds before reloading the parks page after redirect error");
        await sleep(5000);
        if (!canContinueThousandTrailsAutomation('Thousand Trails automation stopped before reloading the parks page.')) {
            return;
        }
        console.log("Reloading Page");
        window.location.reload();
    }
}


async function redirectBookingPage(db) {
    var bookingURL = await getCampgroundBookingUrl(db);
    if (!bookingURL) {
        console.error('Campground booking URL is missing. Cannot redirect to the Campgrounds Booking Page.');
        return;
    }

    console.log("Redirecting to the Campgrounds Booking Page");
    console.log(bookingURL);
    const parksRedirectDelayMilliseconds = await getParksRedirectBookingDelayMilliseconds(db);
    console.log(`Throttling...${formatDelayMillisecondsForLog(parksRedirectDelayMilliseconds)} before selecting campground`);
    await sleep(parksRedirectDelayMilliseconds);
    if (!canContinueThousandTrailsAutomation('Thousand Trails automation stopped before redirecting to the booking page.')) {
        return;
    }
    window.location.replace(bookingURL);
}

async function updateConfiguredCampgroundUrls(db) {
    const campgroundName = await getConfiguredCampgroundName(db);
    if (!campgroundName) {
        console.error('CampgroundName SiteConstant is required. Cannot discover campground URLs.');
        await clearConfiguredCampgroundUrls(db);
        return '';
    }

    const campgroundLink = findCampgroundLink(campgroundName);

    if (!campgroundLink) {
        console.error(`Campground link not found for "${campgroundName}". Cannot discover campground booking URL.`);
        await clearConfiguredCampgroundUrls(db);
        return '';
    }

    const bookingLink = campgroundLink.closest('li')?.querySelector('a.btn-book[href]');
    if (!bookingLink) {
        console.error(`Booking link not found for "${campgroundName}". Cannot discover campground booking URL.`);
        await clearConfiguredCampgroundUrls(db);
        return '';
    }

    const campgroundUrl = normalizeCampgroundHref(campgroundLink.getAttribute('href'));
    const bookingUrl = normalizeCampgroundBookingUrl(bookingLink.getAttribute('href'));
    console.log(`Campground: ${campgroundName}`);
    console.log(`Campground URL: ${campgroundUrl}`);
    console.log(`Campground Booking URL: ${bookingUrl}`);
    await addOrUpdateSiteConstant(db, 'CampgroundUrl', campgroundUrl);
    await addOrUpdateSiteConstant(db, 'CampgroundBookingUrl', bookingUrl);
    await addOrUpdateSiteConstant(db, 'CampgroundEditReservationUrl', '');
    return bookingUrl;
}

async function clearConfiguredCampgroundUrls(db) {
    await addOrUpdateSiteConstant(db, 'CampgroundUrl', '');
    await addOrUpdateSiteConstant(db, 'CampgroundBookingUrl', '');
    await addOrUpdateSiteConstant(db, 'CampgroundEditReservationUrl', '');
}

function findCampgroundLink(campgroundName) {
    const normalizedName = normalizeCampgroundText(campgroundName);
    const campgroundLinks = Array.from(document.querySelectorAll('a[href]'));

    return campgroundLinks.find(link => {
        const linkName = normalizeCampgroundText(link.textContent);

        return linkName === normalizedName;
    });
}

function normalizeCampgroundText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function normalizeCampgroundHref(value) {
    try {
        return new URL(value, 'https://thousandtrails.com').href;
    } catch (error) {
        return String(value || '').trim();
    }
}
