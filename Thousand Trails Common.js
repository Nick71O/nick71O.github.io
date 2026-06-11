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
const humanVerificationDefaultReloadMinutes = 60;
const humanVerificationNotificationStorageKey = 'ThousandTrailsHumanVerificationLastNotification';
const humanVerificationResumePollMillis = 3000;
const availabilitySummaryNotificationSignatureConstant = 'LastAvailabilitySummaryNotificationSignature';
const thousandTrailsAutomationStorageKey = 'ThousandTrailsAutomationRunState';
const thousandTrailsAutomationControl = window.thousandTrailsAutomationControl || {
    isInitialized: false,
    isRunning: true,
    launchInProgress: false,
    launchFunction: null,
    activeSleep: null
};
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

    if (getThousandTrailsAutomationMessage() === 'Human check') {
        return;
    }

    setThousandTrailsAutomationMessage('');
}

function getThousandTrailsAutomationMessage() {
    const messageReadout = document.getElementById('ttAutomationMessage');
    return messageReadout ? messageReadout.textContent : '';
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

    setThousandTrailsAutomationMessage('Human check');
    await pushHumanVerificationMessage(db, reloadMinutes, reloadMillis);
    scheduleHumanVerificationReload(reloadMinutes, reloadMillis);
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

async function rebuildAvailabilityFromCurrentBookingState(db) {
    const bookingPreference = (await getSiteConstantValue(db, 'BookingPreference')).toLowerCase();
    const desiredArrivalDate = await getSiteConstantValue(db, 'DesiredArrivalDate');
    const desiredDepartureDate = await getSiteConstantValue(db, 'DesiredDepartureDate');
    const desiredDatesArrayValue = await getSiteConstantValue(db, 'DesiredDatesArray');
    const minimumConsecutiveDays = parsePositiveNumber(await getSiteConstantValue(db, 'MinimumConsecutiveDays')) || 1;
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
    if (wasHumanVerificationNotificationSentRecently(reloadMillis)) {
        console.log('Human verification Pushover notification already sent recently.');
        return;
    }

    const pushoverKeys = await getHumanVerificationPushoverKeys(db);
    if (!pushoverKeys) {
        console.error('Human verification detected, but Pushover keys are not available.');
        return;
    }

    const message = [
        'Thousand Trails - Lake & Shore',
        '<b>Human verification required.</b>',
        '\nWaiting for manual input.',
        '\nAutomation will resume after verification clears.',
        `\nFallback reload in ${reloadMinutes} minutes.`
    ].join('\n');

    const sent = await sendPushMessage(pushoverKeys.userKey, pushoverKeys.apiToken, pushoverUrl, message, 'echo', 1);
    if (sent) {
        markHumanVerificationNotificationSent();
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

function wasHumanVerificationNotificationSentRecently(reloadMillis) {
    try {
        const now = Date.now();
        const lastNotification = Number(localStorage.getItem(humanVerificationNotificationStorageKey));
        return Boolean(lastNotification && now - lastNotification < reloadMillis);
    } catch (error) {
        console.error('Unable to read human verification notification state:', error);
        return false;
    }
}

function markHumanVerificationNotificationSent() {
    try {
        localStorage.setItem(humanVerificationNotificationStorageKey, String(Date.now()));
    } catch (error) {
        console.error('Unable to write human verification notification state:', error);
    }
}

function scheduleHumanVerificationReload(reloadMinutes, reloadMillis) {
    if (window.thousandTrailsHumanVerificationReloadTimer) {
        return;
    }

    window.thousandTrailsHumanVerificationReloadTimer = window.setTimeout(() => {
        window.thousandTrailsHumanVerificationReloadTimer = null;
        if (isHumanVerificationPage() && isThousandTrailsAutomationRunning()) {
            console.warn(`Human verification fallback reached after ${reloadMinutes} minute(s). Reloading page.`);
            window.location.reload();
        }
    }, reloadMillis);
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
            setThousandTrailsAutomationMessage('Human check');
            return;
        }

        clearHumanVerificationResumeWatcher();
        clearHumanVerificationReloadTimer();
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

    const pushoverKeys = await getPushoverKeys(db);
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
