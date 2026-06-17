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
const pushoverTimeoutMillis = 10000;
const humanVerificationDefaultReloadMinutes = 65;
const memberLoginSubmitDefaultDelaySeconds = 10;
const parksRedirectBookingDefaultDelaySeconds = 15;
const reservationDetailsChooseCampsiteDefaultDelaySeconds = 35;
const chooseCampsiteNoSiteRedirectDefaultDelaySeconds = 25;
const chooseCampsiteSelectSiteDefaultDelaySeconds = 25;
const enterPaymentBookReservationDefaultDelaySeconds = 45;
const humanVerificationNotificationStorageKey = 'ThousandTrailsHumanVerificationLastNotification';
const humanVerificationResumePollMillis = 3000;
const availabilitySummaryNotificationSignatureConstant = 'LastAvailabilitySummaryNotificationSignature';
const unconfiguredSelectableSiteTypesNotificationSignatureConstant = 'LastUnconfiguredSelectableSiteTypesNotificationSignature';
const thousandTrailsAutomationStorageKey = 'ThousandTrailsAutomationRunState';
const humanVerificationNotificationControl = window.thousandTrailsHumanVerificationNotificationControl || {
    sentForPage: false,
    sendInProgress: false
};
const thousandTrailsAutomationControl = window.thousandTrailsAutomationControl || {
    isInitialized: false,
    isRunning: true,
    launchInProgress: false,
    launchFunction: null,
    activeSleep: null
};
window.thousandTrailsHumanVerificationNotificationControl = humanVerificationNotificationControl;
window.thousandTrailsAutomationControl = thousandTrailsAutomationControl;

function isSensitiveLogName(name) {
    const normalizedName = String(name || '').toLowerCase();
    return normalizedName.includes('token') ||
        normalizedName.includes('secret') ||
        normalizedName.includes('password') ||
        normalizedName.includes('userkey') ||
        normalizedName.includes('apikey');
}

function maskSensitiveValue(value) {
    if (value === null || value === undefined || value === '') {
        return value;
    }

    const stringValue = String(value);
    if (stringValue.length <= 8) {
        return '********';
    }

    return `${stringValue.slice(0, 4)}...${stringValue.slice(-4)}`;
}

function initializeThousandTrailsAutomationControl() {
    thousandTrailsAutomationControl.isRunning = getStoredThousandTrailsAutomationRunState();
    injectThousandTrailsAutomationOverlayStyles();
    ensureThousandTrailsAutomationOverlay();
    updateThousandTrailsAutomationOverlay();
    thousandTrailsAutomationControl.isInitialized = true;
}

function startThousandTrailsAutomation(launchFunction) {
    initializeThousandTrailsAutomationControl();

    if (typeof launchFunction === 'function') {
        thousandTrailsAutomationControl.launchFunction = launchFunction;
    }

    if (!isThousandTrailsAutomationRunning() || thousandTrailsAutomationControl.launchInProgress) {
        updateThousandTrailsAutomationOverlay();
        return;
    }

    const functionToLaunch = launchFunction || thousandTrailsAutomationControl.launchFunction;

    if (typeof functionToLaunch !== 'function') {
        console.error('Unable to start Thousand Trails automation. Launch function is missing.');
        return;
    }

    thousandTrailsAutomationControl.launchInProgress = true;
    Promise.resolve(functionToLaunch())
        .catch(error => {
            console.error('An error occurred while launching Thousand Trails automation:', error);
        })
        .finally(() => {
            thousandTrailsAutomationControl.launchInProgress = false;
            if (!thousandTrailsAutomationControl.activeSleep) {
                clearThousandTrailsAutomationMessage();
            }
        });
}

function restartThousandTrailsAutomation(launchFunction) {
    if (!canContinueThousandTrailsAutomation('Thousand Trails automation stopped before restarting.')) {
        return;
    }

    window.setTimeout(() => startThousandTrailsAutomation(launchFunction), 0);
}

function isThousandTrailsAutomationRunning() {
    initializeThousandTrailsAutomationControlIfNeeded();
    return thousandTrailsAutomationControl.isRunning;
}

function canContinueThousandTrailsAutomation(message = 'Thousand Trails automation stopped.') {
    if (isThousandTrailsAutomationRunning()) {
        return true;
    }

    if (message) {
        console.log(message);
    }
    setThousandTrailsAutomationMessage('Stopped');
    return false;
}

function setThousandTrailsAutomationRunning(isRunning) {
    thousandTrailsAutomationControl.isRunning = isRunning;
    persistThousandTrailsAutomationRunState(isRunning);
    updateThousandTrailsAutomationOverlay();
}

function stopThousandTrailsAutomation(message = 'Stopped', logMessage = 'Thousand Trails automation stopped.') {
    initializeThousandTrailsAutomationControlIfNeeded();
    setThousandTrailsAutomationRunning(false);
    cancelActiveThousandTrailsAutomationSleep();
    setThousandTrailsAutomationMessage(message);

    if (logMessage) {
        console.log(logMessage);
    }
}

function completeThousandTrailsAutomation(message = 'No Dates Remain') {
    stopThousandTrailsAutomation(message, 'Thousand Trails automation complete. No desired dates remain.');
}

function toggleThousandTrailsAutomationRunStop() {
    const shouldRun = !isThousandTrailsAutomationRunning();

    if (shouldRun) {
        setThousandTrailsAutomationRunning(true);
        setThousandTrailsAutomationMessage('');
        startThousandTrailsAutomation(thousandTrailsAutomationControl.launchFunction);
        return;
    }

    stopThousandTrailsAutomation();
}

function initializeThousandTrailsAutomationControlIfNeeded() {
    if (!thousandTrailsAutomationControl.isInitialized) {
        initializeThousandTrailsAutomationControl();
    }
}

function ensureThousandTrailsAutomationOverlay() {
    let overlay = document.getElementById('ttAutomationOverlay');
    if (overlay) {
        return overlay;
    }

    overlay = document.createElement('div');
    overlay.id = 'ttAutomationOverlay';

    const runStopButton = document.createElement('button');
    runStopButton.id = 'ttAutomationRunStopButton';
    runStopButton.type = 'button';
    runStopButton.addEventListener('click', toggleThousandTrailsAutomationRunStop);

    const messageReadout = document.createElement('div');
    messageReadout.id = 'ttAutomationMessage';
    messageReadout.setAttribute('aria-live', 'polite');

    overlay.appendChild(runStopButton);
    overlay.appendChild(messageReadout);

    const parent = document.body || document.documentElement;
    parent.appendChild(overlay);
    return overlay;
}

function injectThousandTrailsAutomationOverlayStyles() {
    if (document.getElementById('ttAutomationOverlayStyles')) {
        return;
    }

    const css = `
        #ttAutomationOverlay {
            position: fixed;
            top: 65px;
            left: 35px;
            z-index: 5000;
            width: 154px;
            padding: 8px;
            box-sizing: border-box;
            background-color: rgba(245, 245, 245, 0.84);
            border: 1px solid darkgray;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
            color: #111;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 16px;
            line-height: 1.3;
        }
        #ttAutomationRunStopButton {
            display: block;
            width: 100%;
            height: 34px;
            padding: 0 10px;
            background-color: #dd1d1d;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 18px;
            font-weight: 700;
            text-align: center;
        }
        #ttAutomationRunStopButton.run {
            background-color: #007bff;
        }
        #ttAutomationRunStopButton:hover {
            filter: brightness(0.92);
        }
        #ttAutomationMessage {
            min-height: 20px;
            margin-top: 10px;
            color: #111;
            font-size: 16px;
            text-align: center;
            line-height: 1.2;
            overflow: hidden;
            white-space: nowrap;
        }
    `;
    const style = document.createElement('style');
    style.id = 'ttAutomationOverlayStyles';
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
}

function getStoredThousandTrailsAutomationRunState() {
    try {
        const storedState = localStorage.getItem(thousandTrailsAutomationStorageKey);
        if (storedState === null) {
            localStorage.setItem(thousandTrailsAutomationStorageKey, 'running');
            return true;
        }

        return storedState !== 'stopped' && storedState !== 'false';
    } catch (error) {
        console.error('Unable to read Thousand Trails automation run state:', error);
        return true;
    }
}

function persistThousandTrailsAutomationRunState(isRunning) {
    try {
        localStorage.setItem(thousandTrailsAutomationStorageKey, isRunning ? 'running' : 'stopped');
    } catch (error) {
        console.error('Unable to save Thousand Trails automation run state:', error);
    }
}

function updateThousandTrailsAutomationOverlay() {
    const runStopButton = document.getElementById('ttAutomationRunStopButton');
    if (!runStopButton) {
        return;
    }

    if (thousandTrailsAutomationControl.isRunning) {
        runStopButton.textContent = 'Stop';
        runStopButton.classList.remove('run');
        runStopButton.setAttribute('aria-pressed', 'true');
        if (!thousandTrailsAutomationControl.activeSleep && getThousandTrailsAutomationMessage() === 'Stopped') {
            setThousandTrailsAutomationMessage('');
        }
    } else {
        runStopButton.textContent = 'Run';
        runStopButton.classList.add('run');
        runStopButton.setAttribute('aria-pressed', 'false');
        if (!getThousandTrailsAutomationMessage()) {
            setThousandTrailsAutomationMessage('Stopped');
        }
    }
}

function setThousandTrailsAutomationMessage(message) {
    const messageReadout = document.getElementById('ttAutomationMessage');
    if (messageReadout) {
        messageReadout.textContent = message || '';
        fitThousandTrailsAutomationMessageText(messageReadout);
    }
}

function clearThousandTrailsAutomationMessage() {
    if (!isThousandTrailsAutomationRunning()) {
        if (!getThousandTrailsAutomationMessage()) {
            setThousandTrailsAutomationMessage('Stopped');
        }
        return;
    }

    if (isHumanVerificationAutomationMessage(getThousandTrailsAutomationMessage())) {
        return;
    }

    setThousandTrailsAutomationMessage('');
}

function getThousandTrailsAutomationMessage() {
    const messageReadout = document.getElementById('ttAutomationMessage');
    return messageReadout ? messageReadout.textContent : '';
}

function isHumanVerificationAutomationMessage(message) {
    return message === 'Human Verification' || String(message || '').startsWith('Reload In:');
}

function fitThousandTrailsAutomationMessageText(messageReadout) {
    const maxFontSize = 16;
    const minFontSize = 10;

    messageReadout.style.fontSize = `${maxFontSize}px`;

    if (!messageReadout.textContent || !messageReadout.clientWidth) {
        return;
    }

    let fontSize = maxFontSize;
    while (messageReadout.scrollWidth > messageReadout.clientWidth && fontSize > minFontSize) {
        fontSize--;
        messageReadout.style.fontSize = `${fontSize}px`;
    }
}

function cancelActiveThousandTrailsAutomationSleep() {
    if (thousandTrailsAutomationControl.activeSleep) {
        thousandTrailsAutomationControl.activeSleep.cancel();
    }
}

function formatThousandTrailsAutomationCountdown(ms) {
    const totalSeconds = Math.ceil(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    }

    if (minutes > 0) {
        return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
    }

    return `${seconds}s`;
}

function getHumanVerificationDetectionDetails() {
    const titleText = (document.title || '').trim().toLowerCase();
    const bodyText = document.body && document.body.innerText ? document.body.innerText.toLowerCase() : '';
    const hasHumanVerificationTitle = titleText === 'human verification';
    const hasHumanVerificationCopy =
        bodyText.includes("let's confirm you are human") ||
        bodyText.includes('complete the security check before continuing') ||
        bodyText.includes('before proceeding to your request') ||
        bodyText.includes('you need to solve a puzzle');
    const hasCaptchaElements = Boolean(document.querySelector(
        '#captcha-container, #amzn-captcha-verify-button, #amzn-btn-verify-internal, .amzn-captcha-verify-button, .amzn-captcha-modal'
    ));
    const hasAwsWafState =
        typeof window.gokuProps !== 'undefined' ||
        typeof window.CaptchaScript !== 'undefined' ||
        typeof window.ChallengeScript !== 'undefined' ||
        Array.from(document.scripts).some(script => {
            const src = (script.src || '').toLowerCase();
            return src.includes('.awswaf.com') &&
                (src.includes('/challenge.js') || src.includes('/captcha.js') ||
                    src.includes('token.awswaf.com') || src.includes('captcha.awswaf.com'));
        });

    const isDetected = hasHumanVerificationTitle ||
        (hasHumanVerificationCopy && (hasCaptchaElements || hasAwsWafState)) ||
        (hasCaptchaElements && hasAwsWafState);

    const matchedSignals = [
        hasHumanVerificationTitle ? 'title' : null,
        hasHumanVerificationCopy ? 'page copy' : null,
        hasCaptchaElements ? 'captcha elements' : null,
        hasAwsWafState ? 'AWS WAF state' : null
    ].filter(Boolean);

    return {
        isDetected,
        matchedSignals
    };
}

function isHumanVerificationPage() {
    return getHumanVerificationDetectionDetails().isDetected;
}

async function handleHumanVerificationIfPresent(db, options = {}) {
    const detectionDetails = getHumanVerificationDetectionDetails();
    if (!detectionDetails.isDetected) {
        return false;
    }

    const reloadMinutes = await getHumanVerificationReloadMinutes(db, options);
    const reloadMillis = reloadMinutes * 60 * 1000;
    console.warn(`Human verification required detected. Waiting for manual input. Fallback reload in ${reloadMinutes} minute(s).`);
    console.log('Human verification detection details:', {
        url: window.location.href,
        title: document.title || '',
        matchedSignals: detectionDetails.matchedSignals
    });

    scheduleHumanVerificationReload(reloadMinutes, reloadMillis);
    await pushHumanVerificationMessage(db, reloadMinutes, reloadMillis);
    scheduleHumanVerificationResumeWatcher();
    return true;
}

function isThousandTrailsMemberLoginPage() {
    const loginForm = document.querySelector('#profile-form');
    const memberInput = document.querySelector('#memberid');
    const pinInput = document.querySelector('#pin');
    const submitButton = loginForm && loginForm.querySelector('button, input[type="submit"]');
    const bodyText = document.body && document.body.innerText ? document.body.innerText.toLowerCase() : '';

    return Boolean(
        loginForm &&
        memberInput &&
        pinInput &&
        submitButton &&
        (bodyText.includes('member login') || bodyText.includes('member no:') || bodyText.includes('reset or create pin'))
    );
}

function isThousandTrailsLoginUrl() {
    try {
        const currentUrl = new URL(window.location.href);
        return currentUrl.origin === baseURL && currentUrl.pathname.replace(/\/+$/, '').toLowerCase() === '/login/index';
    } catch (error) {
        console.error('Unable to parse current URL while checking login page:', error);
        return false;
    }
}

async function handleUnexpectedLoginPageIfPresent(options = {}) {
    if (!isThousandTrailsMemberLoginPage()) {
        return false;
    }

    const reason = options.reason || 'Member login page detected outside the login URL.';
    console.warn(`${reason} Current URL: ${window.location.href}`);
    setThousandTrailsAutomationMessage('Login');

    if (isThousandTrailsLoginUrl() && !options.redirectEvenOnLoginUrl) {
        console.log('Already on the Login Page. Waiting for login automation.');
        return true;
    }

    const delayMilliseconds = Number.isFinite(Number(options.delayMilliseconds)) ? Number(options.delayMilliseconds) : 500;
    if (delayMilliseconds > 0) {
        await sleep(delayMilliseconds);
    }

    if (!canContinueThousandTrailsAutomation('Thousand Trails automation stopped before redirecting to the login page.')) {
        return true;
    }

    const loginURL = baseURL + '/login/index';
    console.log('Redirecting to the Login Page');
    console.log(loginURL);
    window.location.replace(loginURL);
    return true;
}

async function getObjectStoreRecordCount(db, objectStoreName) {
    return new Promise((resolve, reject) => {
        try {
            const transaction = db.transaction(objectStoreName, 'readonly');
            const store = transaction.objectStore(objectStoreName);
            const request = store.count();

            request.onsuccess = event => resolve(event.target.result || 0);
            request.onerror = event => reject(event.target.error);
        } catch (error) {
            reject(error);
        }
    });
}

async function handleMissingBookingDatabaseState(db, context = 'booking automation') {
    const siteConstantCount = await getObjectStoreRecordCount(db, 'SiteConstant');
    const availabilityCount = await getObjectStoreRecordCount(db, 'Availability');

    if (siteConstantCount > 0 && availabilityCount > 0) {
        return false;
    }

    if (siteConstantCount > 0 && availabilityCount === 0) {
        console.warn(`Availability table is empty while ${context}. Rebuilding from current SiteConstant booking state.`);
        const rebuiltAvailability = await rebuildAvailabilityFromCurrentBookingState(db);
        if (rebuiltAvailability) {
            return false;
        }

        console.warn('Availability table could not be rebuilt from current SiteConstant booking state.');
        if (await currentBookingStateHasDesiredDates(db)) {
            stopThousandTrailsAutomation(
                'No Dates To Check',
                'Thousand Trails automation stopped. No availability records could be generated from the configured desired dates.'
            );
            return true;
        }
    }

    console.error(`Booking database state is missing while ${context}. SiteConstant rows: ${siteConstantCount}; Availability rows: ${availabilityCount}.`);
    console.log('Redirecting to the Login Page to rebuild booking state.');
    setThousandTrailsAutomationMessage('DB reset');

    await sleep(500);
    if (!canContinueThousandTrailsAutomation('Thousand Trails automation stopped before redirecting to rebuild booking state.')) {
        return true;
    }

    window.location.replace(baseURL + '/login/index');
    return true;
}

async function currentBookingStateHasDesiredDates(db) {
    const bookingPreference = (await getSiteConstantValue(db, 'BookingPreference')).toLowerCase();
    const desiredArrivalDate = await getSiteConstantValue(db, 'DesiredArrivalDate');
    const desiredDepartureDate = await getSiteConstantValue(db, 'DesiredDepartureDate');
    const desiredDatesArrayValue = await getSiteConstantValue(db, 'DesiredDatesArray');

    if (isValidDate(desiredArrivalDate) && isValidDate(desiredDepartureDate)) {
        return true;
    }

    if (bookingPreference !== 'auto' && bookingPreference !== 'datearray') {
        return false;
    }

    if (!desiredDatesArrayValue) {
        return false;
    }

    try {
        return hasValidDates(JSON.parse(desiredDatesArrayValue));
    } catch (error) {
        console.error('Unable to parse DesiredDatesArray while checking booking state:', error);
        return false;
    }
}

function getDesiredDateRangeNightCount(desiredArrivalDate, desiredDepartureDate) {
    if (!isValidDate(desiredArrivalDate) || !isValidDate(desiredDepartureDate)) {
        return null;
    }

    const arrivalDate = new Date(desiredArrivalDate);
    const departureDate = new Date(desiredDepartureDate);
    const nights = Math.round((departureDate.getTime() - arrivalDate.getTime()) / 86400000);
    return nights > 0 ? nights : null;
}

async function normalizeMinimumConsecutiveDaysForDesiredRange(db, desiredArrivalDate, desiredDepartureDate, minimumConsecutiveDays) {
    const requestedNights = getDesiredDateRangeNightCount(desiredArrivalDate, desiredDepartureDate);
    const configuredMinimum = parsePositiveNumber(minimumConsecutiveDays) || 1;

    if (!requestedNights) {
        console.error(`Unable to normalize MinimumConsecutiveDays. Desired date range is invalid: ${desiredArrivalDate} - ${desiredDepartureDate}.`);
        return configuredMinimum;
    }

    if (configuredMinimum <= requestedNights) {
        return configuredMinimum;
    }

    console.warn(`MinimumConsecutiveDays (${configuredMinimum}) is greater than desired date range (${requestedNights} nights). Updating MinimumConsecutiveDays to ${requestedNights}.`);
    await addOrUpdateSiteConstant(db, 'MinimumConsecutiveDays', requestedNights);
    return requestedNights;
}

async function rebuildAvailabilityFromCurrentBookingState(db) {
    const bookingPreference = (await getSiteConstantValue(db, 'BookingPreference')).toLowerCase();
    const desiredArrivalDate = await getSiteConstantValue(db, 'DesiredArrivalDate');
    const desiredDepartureDate = await getSiteConstantValue(db, 'DesiredDepartureDate');
    const desiredDatesArrayValue = await getSiteConstantValue(db, 'DesiredDatesArray');
    let minimumConsecutiveDays = parsePositiveNumber(await getSiteConstantValue(db, 'MinimumConsecutiveDays')) || 1;
    let desiredDatesArray = [];

    if (desiredDatesArrayValue) {
        try {
            desiredDatesArray = JSON.parse(desiredDatesArrayValue);
        } catch (error) {
            console.error('Unable to parse DesiredDatesArray while rebuilding availability:', error);
        }
    }

    if ((bookingPreference === 'auto' || bookingPreference === 'datearray') && hasValidDates(desiredDatesArray)) {
        if (typeof insertAvailabilityRecords2 !== 'function') {
            console.error('Unable to rebuild availability. insertAvailabilityRecords2 is not available.');
            return false;
        }

        await addOrUpdateSiteConstant(db, 'MinimumConsecutiveDays', 1);
        await addOrUpdateSiteConstant(db, 'BookingPreference', 'datearray');
        await insertAvailabilityRecords2(db, desiredDatesArray);
        return await getObjectStoreRecordCount(db, 'Availability') > 0;
    }

    if (bookingPreference === 'consecutive' && isValidDate(desiredArrivalDate) && isValidDate(desiredDepartureDate)) {
        if (typeof insertConsecutiveAvailabilityRecords !== 'function') {
            console.error('Unable to rebuild availability. insertConsecutiveAvailabilityRecords is not available.');
            return false;
        }

        minimumConsecutiveDays = await normalizeMinimumConsecutiveDaysForDesiredRange(db, desiredArrivalDate, desiredDepartureDate, minimumConsecutiveDays);
        await insertConsecutiveAvailabilityRecords(db, desiredArrivalDate, desiredDepartureDate, minimumConsecutiveDays);
        return await getObjectStoreRecordCount(db, 'Availability') > 0;
    }

    if (isValidDate(desiredArrivalDate) && isValidDate(desiredDepartureDate)) {
        if (typeof insertAvailabilityRecords !== 'function') {
            console.error('Unable to rebuild availability. insertAvailabilityRecords is not available.');
            return false;
        }

        await insertAvailabilityRecords(db, desiredArrivalDate, desiredDepartureDate);
        return await getObjectStoreRecordCount(db, 'Availability') > 0;
    }

    console.error('Unable to rebuild availability. Desired date state is empty or invalid.');
    return false;
}

function logDetailedError(message, error) {
    console.error(message, error);

    if (error && error.stack) {
        console.error(error.stack);
        return;
    }

    if (error && error.message) {
        console.error(error.message);
    }
}

async function getHumanVerificationReloadMinutes(db, options = {}) {
    const configuredMinutes =
        parsePositiveNumber(options.reloadMinutes) ||
        parsePositiveNumber(options.reloadAfterMinutes) ||
        parsePositiveNumber(getGlobalVariableValue('humanVerificationReloadMinutes')) ||
        parsePositiveNumber(getGlobalVariableValue('humanVerificationTimeoutMinutes')) ||
        parsePositiveNumber(getGlobalVariableValue('humanVerificationReloadAfterMinutes'));

    if (configuredMinutes) {
        return configuredMinutes;
    }

    const storedMinutes = parsePositiveNumber(await getSiteConstantValue(db, 'HumanVerificationReloadMinutes'));
    return storedMinutes || humanVerificationDefaultReloadMinutes;
}

async function pushHumanVerificationMessage(db, reloadMinutes, reloadMillis) {
    if (wasHumanVerificationNotificationSentForCurrentPage()) {
        console.log('Human verification Pushover notification already sent for this page.');
        return;
    }

    if (humanVerificationNotificationControl.sendInProgress) {
        console.log('Human verification Pushover notification send is already in progress.');
        return;
    }

    humanVerificationNotificationControl.sendInProgress = true;

    try {
        const pushoverKeys = await getHumanVerificationPushoverKeys(db);
        if (!pushoverKeys) {
            console.error('Human verification detected, but Pushover keys are not available.');
            return;
        }

        const message = [
            await getConfiguredCampgroundNotificationTitle(db),
            '<b>Human verification required.</b>',
            '\nWaiting for manual input.',
            '\nAutomation will resume after verification clears.',
            `\nFallback reload in ${reloadMinutes} minutes.`
        ].join('\n');

        const sent = await sendPushMessage(pushoverKeys.userKey, pushoverKeys.apiToken, pushoverUrl, message, 'echo', 1);
        if (sent) {
            markHumanVerificationNotificationSent();
        }
    } finally {
        humanVerificationNotificationControl.sendInProgress = false;
    }
}

async function getHumanVerificationPushoverKeys(db) {
    const userKey = await getPushoverValue(db, 'PushoverUserKey', 'pushoverUserKey');
    const apiTokenAvailability = await getPushoverValue(db, 'PushoverApiTokenAvailability', 'pushoverApiTokenAvailability');
    const apiTokenReservation = await getPushoverValue(db, 'PushoverApiTokenReservation', 'pushoverApiTokenReservation');
    const apiToken = apiTokenAvailability || apiTokenReservation;

    if (!userKey || !apiToken) {
        return null;
    }

    return { userKey, apiToken };
}

async function getAvailabilityPushoverKeys(db) {
    const userKey = await getPushoverValue(db, 'PushoverUserKey', 'pushoverUserKey');
    const apiTokenAvailability = await getPushoverValue(db, 'PushoverApiTokenAvailability', 'pushoverApiTokenAvailability');

    if (!userKey) {
        console.error('Error: PushoverUserKey is null or blank.');
    }
    if (!apiTokenAvailability) {
        console.error('Error: PushoverApiTokenAvailability is null or blank.');
    }

    if (!userKey || !apiTokenAvailability) {
        return null;
    }

    return { userKey, apiTokenAvailability };
}

async function getPushoverValue(db, siteConstantName, globalVariableName) {
    const globalValue = getGlobalVariableValue(globalVariableName);
    if (globalValue) {
        return globalValue;
    }

    return await getSiteConstantValue(db, siteConstantName);
}

async function getSiteConstantValue(db, name) {
    if (!db || typeof getSiteConstant !== 'function') {
        return '';
    }

    const constant = await getSiteConstant(db, name);
    if (!constant || constant.value === null || constant.value === undefined) {
        return '';
    }

    return String(constant.value).trim();
}

function getGlobalVariableValue(name) {
    if (typeof globalVariables === 'undefined' || !globalVariables || globalVariables[name] === null || globalVariables[name] === undefined) {
        return '';
    }

    return String(globalVariables[name]).trim();
}

function parsePositiveNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

async function getConfiguredCampgroundName(db) {
    return getGlobalVariableValue('campgroundName') ||
        await getSiteConstantValue(db, 'CampgroundName');
}

async function getConfiguredCampgroundUrl(db) {
    return await getSiteConstantValue(db, 'CampgroundUrl');
}

async function getCampgroundBookingUrl(db) {
    const storedBookingUrl = await getSiteConstantValue(db, 'CampgroundBookingUrl');

    if (storedBookingUrl) {
        return normalizeCampgroundBookingUrl(storedBookingUrl);
    }

    const campgroundUrl = await getConfiguredCampgroundUrl(db);

    const bookingUrl = getCampgroundBookingUrlFromDetailsUrl(campgroundUrl);
    if (!bookingUrl) {
        console.error('Campground booking URL is not available. Visit the parks page first so the booking link can be discovered.');
    }

    return bookingUrl;
}

async function getCampgroundEditReservationUrl(db) {
    const storedEditReservationUrl = await getSiteConstantValue(db, 'CampgroundEditReservationUrl');

    if (storedEditReservationUrl) {
        return normalizeCampgroundBookingUrl(storedEditReservationUrl);
    }

    return await getCampgroundBookingUrl(db);
}

function getCampgroundBookingUrlFromDetailsUrl(campgroundUrl) {
    const robotId = getCampgroundRobotIdFromUrl(campgroundUrl);

    if (!robotId) {
        return '';
    }

    return `${baseURL}/reserve/index?robot=${encodeURIComponent(robotId)}`;
}

function getCampgroundRobotIdFromUrl(campgroundUrl) {
    try {
        const detailsUrl = new URL(campgroundUrl, 'https://thousandtrails.com');
        return detailsUrl.searchParams.get('robot_id') || detailsUrl.searchParams.get('robot') || '';
    } catch (error) {
        console.error('Unable to get campground robot ID from campground URL:', error);
        return '';
    }
}

function normalizeCampgroundBookingUrl(bookingUrl) {
    if (!String(bookingUrl || '').trim()) {
        return '';
    }

    try {
        return new URL(bookingUrl, baseURL).href;
    } catch (error) {
        console.error('Unable to normalize campground booking URL:', error);
        return '';
    }
}

function getCampgroundNotificationTitle(campgroundName) {
    return campgroundName
        ? `Thousand Trails - ${campgroundName}`
        : 'Thousand Trails';
}

async function getConfiguredCampgroundNotificationTitle(db) {
    return getCampgroundNotificationTitle(await getConfiguredCampgroundName(db));
}

async function getReservationDetailsChooseCampsiteDelayMilliseconds(db) {
    return await getConfiguredDelayMilliseconds(
        db,
        'ReservationDetailsChooseCampsiteDelaySeconds',
        'reservationDetailsChooseCampsiteDelaySeconds',
        reservationDetailsChooseCampsiteDefaultDelaySeconds
    );
}

async function getChooseCampsiteNoSiteRedirectDelayMilliseconds(db) {
    return await getConfiguredDelayMilliseconds(
        db,
        'ChooseCampsiteNoSiteRedirectDelaySeconds',
        'chooseCampsiteNoSiteRedirectDelaySeconds',
        chooseCampsiteNoSiteRedirectDefaultDelaySeconds
    );
}

async function getChooseCampsiteSelectSiteDelayMilliseconds(db) {
    return await getConfiguredDelayMilliseconds(
        db,
        'ChooseCampsiteSelectSiteDelaySeconds',
        'chooseCampsiteSelectSiteDelaySeconds',
        chooseCampsiteSelectSiteDefaultDelaySeconds
    );
}

async function getEnterPaymentBookReservationDelayMilliseconds(db) {
    return await getConfiguredDelayMilliseconds(
        db,
        'EnterPaymentBookReservationDelaySeconds',
        'enterPaymentBookReservationDelaySeconds',
        enterPaymentBookReservationDefaultDelaySeconds
    );
}

async function getMemberLoginSubmitDelayMilliseconds(db) {
    return await getConfiguredDelayMilliseconds(
        db,
        'MemberLoginSubmitDelaySeconds',
        'memberLoginSubmitDelaySeconds',
        memberLoginSubmitDefaultDelaySeconds
    );
}

async function getParksRedirectBookingDelayMilliseconds(db) {
    return await getConfiguredDelayMilliseconds(
        db,
        'ParksRedirectBookingDelaySeconds',
        'parksRedirectBookingDelaySeconds',
        parksRedirectBookingDefaultDelaySeconds
    );
}

async function getConfiguredDelayMilliseconds(db, siteConstantName, globalVariableName, defaultSeconds) {
    const configuredSeconds =
        parsePositiveNumber(getGlobalVariableValue(globalVariableName)) ||
        parsePositiveNumber(await getSiteConstantValue(db, siteConstantName)) ||
        defaultSeconds;

    return Math.round(configuredSeconds * 1000);
}

function formatDelayMillisecondsForLog(milliseconds) {
    const seconds = milliseconds / 1000;
    const displaySeconds = Number.isInteger(seconds)
        ? String(seconds)
        : seconds.toFixed(1).replace(/\.0$/, '');
    const label = displaySeconds === '1' ? 'second' : 'seconds';

    return `${displaySeconds} ${label}`;
}

function wasHumanVerificationNotificationSentForCurrentPage() {
    return humanVerificationNotificationControl.sentForPage === true;
}

function clearLegacyHumanVerificationNotificationSent() {
    try {
        localStorage.removeItem(humanVerificationNotificationStorageKey);
    } catch (error) {
        console.error('Unable to clear legacy human verification notification state:', error);
    }
}

function markHumanVerificationNotificationSent() {
    humanVerificationNotificationControl.sentForPage = true;
    clearLegacyHumanVerificationNotificationSent();
}

function clearHumanVerificationNotificationSent() {
    humanVerificationNotificationControl.sentForPage = false;
    humanVerificationNotificationControl.sendInProgress = false;
    clearLegacyHumanVerificationNotificationSent();
}

function scheduleHumanVerificationReload(reloadMinutes, reloadMillis) {
    if (!window.thousandTrailsHumanVerificationReloadAt) {
        window.thousandTrailsHumanVerificationReloadAt = Date.now() + reloadMillis;
    }

    updateHumanVerificationReloadMessage();

    if (window.thousandTrailsHumanVerificationReloadTimer) {
        return;
    }

    const remainingMillis = Math.max(0, window.thousandTrailsHumanVerificationReloadAt - Date.now());
    window.thousandTrailsHumanVerificationReloadTimer = window.setTimeout(() => {
        window.thousandTrailsHumanVerificationReloadTimer = null;
        window.thousandTrailsHumanVerificationReloadAt = null;
        if (isHumanVerificationPage() && isThousandTrailsAutomationRunning()) {
            console.warn(`Human verification fallback reached after ${reloadMinutes} minute(s). Reloading page.`);
            window.location.reload();
        }
    }, remainingMillis);
}

function updateHumanVerificationReloadMessage() {
    const reloadAt = Number(window.thousandTrailsHumanVerificationReloadAt);
    if (!reloadAt) {
        setThousandTrailsAutomationMessage('Reload In');
        return;
    }

    const remainingMillis = Math.max(0, reloadAt - Date.now());
    setThousandTrailsAutomationMessage(`Reload In: ${formatThousandTrailsAutomationCountdown(remainingMillis)}`);
}

function scheduleHumanVerificationResumeWatcher() {
    if (window.thousandTrailsHumanVerificationResumeTimer) {
        return;
    }

    window.thousandTrailsHumanVerificationResumeTimer = window.setInterval(() => {
        if (!isThousandTrailsAutomationRunning()) {
            clearHumanVerificationResumeWatcher();
            return;
        }

        if (isHumanVerificationPage()) {
            updateHumanVerificationReloadMessage();
            return;
        }

        clearHumanVerificationResumeWatcher();
        clearHumanVerificationReloadTimer();
        clearHumanVerificationNotificationSent();
        setThousandTrailsAutomationMessage('');
        console.log('Human verification cleared. Resuming Thousand Trails automation.');
        window.setTimeout(() => startThousandTrailsAutomation(thousandTrailsAutomationControl.launchFunction), 0);
    }, humanVerificationResumePollMillis);
}

function clearHumanVerificationResumeWatcher() {
    if (!window.thousandTrailsHumanVerificationResumeTimer) {
        return;
    }

    window.clearInterval(window.thousandTrailsHumanVerificationResumeTimer);
    window.thousandTrailsHumanVerificationResumeTimer = null;
}

function clearHumanVerificationReloadTimer() {
    window.thousandTrailsHumanVerificationReloadAt = null;

    if (!window.thousandTrailsHumanVerificationReloadTimer) {
        return;
    }

    window.clearTimeout(window.thousandTrailsHumanVerificationReloadTimer);
    window.thousandTrailsHumanVerificationReloadTimer = null;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


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
    const notificationState = await getAvailabilitySummaryNotificationState(db);
    if (!notificationState.isComplete) {
        console.log(`Skipping site availability notification. Checked ${notificationState.checkedCount} of ${notificationState.totalCount} availability record(s).`);
        return;
    }

    const lastSignature = await getSiteConstantValue(db, availabilitySummaryNotificationSignatureConstant);
    if (lastSignature === notificationState.signature) {
        console.log('Skipping duplicate site availability notification. No new availability checks since the last notification.');
        return;
    }
    if (lastSignature === notificationState.rawSignature) {
        console.log('Skipping duplicate site availability notification. Migrating stored notification signature to hash.');
        await addOrUpdateSiteConstant(db, availabilitySummaryNotificationSignatureConstant, notificationState.signature);
        return;
    }

    const pushoverKeys = await getAvailabilityPushoverKeys(db);
    if (pushoverKeys) {
        const sent = await sendPushMessage(pushoverKeys.userKey, pushoverKeys.apiTokenAvailability, pushoverUrl, message, '', -1);
        if (sent) {
            await addOrUpdateSiteConstant(db, availabilitySummaryNotificationSignatureConstant, notificationState.signature);
        }
    }
}

async function getAvailabilitySummaryNotificationState(db) {
    if (!db) {
        return {
            isComplete: false,
            totalCount: 0,
            checkedCount: 0,
            signature: ''
        };
    }

    const transaction = db.transaction(['Availability'], 'readonly');
    const availabilityStore = transaction.objectStore('Availability');
    const signatureParts = [];
    let totalCount = 0;
    let checkedCount = 0;

    return new Promise((resolve, reject) => {
        const request = availabilityStore.openCursor();

        request.onsuccess = function (event) {
            const cursor = event.target.result;

            if (cursor) {
                const record = cursor.value;
                const checked = record.Checked !== null && record.Checked !== undefined && String(record.Checked).trim() !== '';

                totalCount++;
                if (checked) {
                    checkedCount++;
                }

                signatureParts.push([
                    record.id,
                    record.ArrivalDate || '',
                    record.DepartureDate || '',
                    record.Available === true ? 'available' : 'unavailable',
                    checked ? String(record.Checked).trim() : ''
                ].join('|'));

                cursor.continue();
            } else {
                const rawSignature = signatureParts.join('||');
                hashAvailabilitySummarySignature(rawSignature)
                    .then(signature => {
                        resolve({
                            isComplete: totalCount > 0 && checkedCount === totalCount,
                            totalCount,
                            checkedCount,
                            signature,
                            rawSignature
                        });
                    })
                    .catch(reject);
            }
        };

        request.onerror = function (event) {
            reject(event.target.error);
        };
    });
}

async function hashAvailabilitySummarySignature(rawSignature) {
    if (!rawSignature) {
        return '';
    }

    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle && typeof TextEncoder !== 'undefined') {
        try {
            const encodedSignature = new TextEncoder().encode(rawSignature);
            const digest = await window.crypto.subtle.digest('SHA-256', encodedSignature);
            const hash = Array.from(new Uint8Array(digest))
                .map(byte => byte.toString(16).padStart(2, '0'))
                .join('');
            return `sha256:${hash}`;
        } catch (error) {
            console.error('Error hashing availability notification signature with SHA-256:', error);
        }
    }

    return `fnv1a:${hashStringFNV1a(rawSignature)}`;
}

function hashStringFNV1a(value) {
    let hash = 0x811c9dc5;

    for (let i = 0; i < value.length; i++) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }

    return (hash >>> 0).toString(16).padStart(8, '0');
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

async function pushUnconfiguredSelectableSiteTypesMessage(db, siteTypes, arrivalDate, departureDate) {
    const uniqueSiteTypes = Array.from(new Set((siteTypes || [])
        .map(siteType => String(siteType || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)));

    if (uniqueSiteTypes.length === 0) {
        return;
    }

    const campgroundName = await getConfiguredCampgroundName(db);
    const signatureSiteTypes = [...uniqueSiteTypes].sort((a, b) => a.localeCompare(b));
    const signature = [
        campgroundName,
        arrivalDate || '',
        departureDate || '',
        ...signatureSiteTypes
    ].join('|');
    const hashedSignature = `fnv1a:${hashStringFNV1a(signature)}`;
    const lastSignature = await getSiteConstantValue(db, unconfiguredSelectableSiteTypesNotificationSignatureConstant);

    if (lastSignature === hashedSignature) {
        console.log('Skipping duplicate unconfigured selectable site type critical notification.');
        return;
    }

    const pushoverKeys = await getAvailabilityPushoverKeys(db);
    if (!pushoverKeys) {
        return;
    }

    const dateLine = arrivalDate && departureDate
        ? `\nDates: ${escapeHtml(arrivalDate)} - ${escapeHtml(departureDate)}`
        : '';
    const siteTypeLines = uniqueSiteTypes
        .map(siteType => `- ${escapeHtml(siteType)}`)
        .join('\n');
    const message = [
        await getConfiguredCampgroundNotificationTitle(db),
        '<b>Unconfigured selectable site type found.</b>',
        dateLine,
        '\nSelectable site type(s) not in desiredSiteTypesByCampground:',
        siteTypeLines,
        '\nAutomation will continue normally.'
    ].filter(Boolean).join('\n');

    const sent = await sendPushMessage(
        pushoverKeys.userKey,
        pushoverKeys.apiTokenAvailability,
        pushoverUrl,
        message,
        'siren',
        2,
        '',
        60,
        3600
    );

    if (sent) {
        await addOrUpdateSiteConstant(db, unconfiguredSelectableSiteTypesNotificationSignatureConstant, hashedSignature);
    }
}

// Function to send a message using Pushover API
async function sendPushMessage(userKey, apiToken, pushoverUrl, message, sound = '', priority = '', ttl = '', retry = '', expire = '', timeoutMillis = pushoverTimeoutMillis) {
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
        if (retry !== '') {
            messageData.retry = retry;
        }
        if (expire !== '') {
            messageData.expire = expire;
        }

        const axiosConfig = {};
        if (timeoutMillis !== '') {
            axiosConfig.timeout = timeoutMillis;
        }

        // Send a POST request to Pushover API using Axios
        const response = await axios.post(pushoverUrl, messageData, axiosConfig);
        console.log('Message sent:', response.data);
        return true;
    } catch (error) {
        const errorMessage = error.response && error.response.data ? error.response.data : error.message;
        console.error('Error sending message:', errorMessage);
        return false;
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
    reservationError,
    campgroundName
) {
    const messageBuilder = [];

    messageBuilder.push(getCampgroundNotificationTitle(campgroundName));
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
    if (!Array.isArray(dateStrArray)) return [];

    const dates = dateStrArray
        .filter(str => str && !isNaN(new Date(str)))
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
    await addOrUpdateSiteConstant(db, 'AvailableSiteType', null);
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
    console.log(`Process Availability Elapse Time: ${formatThousandTrailsAutomationCountdown(processAvailabilityElapseTime * 1000)}`);

    const availabilityCheckIntervalInMillis = scAvailabilityCheckIntervalMinutes * 60 * 1000;
    const remainingTimeInMillis = availabilityCheckIntervalInMillis - (processAvailabilityElapseTime * 1000);

    const remainingMinutes = Math.floor(remainingTimeInMillis / (1000 * 60));
    const remainingSeconds = Math.floor((remainingTimeInMillis % (1000 * 60)) / 1000);

    let message = `\nSleeping... ${remainingMinutes} minutes`;
    if (remainingSeconds > 0) {
        message += ` and ${remainingSeconds} seconds`;
    }
    console.log(message);

    return await sleep(remainingTimeInMillis);
}

function sleep(ms) {
    initializeThousandTrailsAutomationControlIfNeeded();

    if (ms <= 0) {
        return Promise.resolve(true);
    }

    if (!isThousandTrailsAutomationRunning()) {
        setThousandTrailsAutomationMessage('');
        return Promise.resolve(false);
    }

    return new Promise(resolve => {
        const endTime = Date.now() + ms;
        const showCountdown = ms >= 1000;
        let intervalId = null;
        let timeoutId = null;
        let resolved = false;

        const finish = completed => {
            if (resolved) {
                return;
            }

            resolved = true;
            clearInterval(intervalId);
            clearTimeout(timeoutId);
            thousandTrailsAutomationControl.activeSleep = null;
            if (!completed && !isThousandTrailsAutomationRunning()) {
                setThousandTrailsAutomationMessage('Stopped');
            } else {
                clearThousandTrailsAutomationMessage();
            }
            resolve(completed);
        };

        const updateCountdown = () => {
            if (!isThousandTrailsAutomationRunning()) {
                finish(false);
                return;
            }

            if (!showCountdown) {
                return;
            }

            const remainingMilliseconds = Math.max(0, endTime - Date.now());
            setThousandTrailsAutomationMessage(`Sleeping: ${formatThousandTrailsAutomationCountdown(remainingMilliseconds)}`);

            if (remainingMilliseconds <= 0) {
                finish(true);
            }
        };

        thousandTrailsAutomationControl.activeSleep = {
            cancel: () => finish(false)
        };

        updateCountdown();
        if (showCountdown) {
            intervalId = window.setInterval(updateCountdown, 1000);
        }
        timeoutId = window.setTimeout(() => finish(true), ms);
    });
}

function hasValidDates(array) {
    return Array.isArray(array) && array.some(date => date && !isNaN(new Date(date)));
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
