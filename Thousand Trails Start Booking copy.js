
//bookingPreference switch: none | trailing | leading | consecutive
const bookingPreference = "none";
const minimumConsecutiveDays = 4;

const baseURL = "https://members.thousandtrails.com";
const formatDateOptions = { month: '2-digit', day: '2-digit', year: 'numeric' };

// XPath of button to click
var buttonXPath = "//*[@id='btnSelect1']";
var selectSiteButtonXPath = "//*[@id='btnSelect0']";
var availabilityButtonXPath = "//*[@id='site-list']/div[2]/div/div[2]/div[1]/button";
//var availabilityCalendarXPath = "//*[@id='calendar5148']/div/div[2]/div/table";
var availabilityCalendarXPath = "//*[@id='calendar5148']";
var availabilityCalendarPreviousMonthButtonXPath = "//*[@id='calendar5148']/div/div[2]/div/div/a[1]";
var availabilityCalendarNextMonthButtonXPath = "//*[@id='calendar5148']/div/div[2]/div/div/a[2]";

var availableDates = [];

var clickCount = 0;
var $elements;

Array.prototype.contains = function (obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
}

function clickXPathButton(buttonXPath) {
    var foundButton = false;
    //window.console.log('xpath button at ' + buttonXPath);
    $elements = getElementsByXPath(buttonXPath);
    $elements.forEach(($element) => {
        var evt = new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: 20,
        });
        $element.dispatchEvent(evt);
        foundButton = true;
    })

    return foundButton
}

function getElementsByXPath(xpath, parent) {
    let results = [];
    let query = document.evaluate(xpath, parent || document,
        null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (let i = 0, length = query.snapshotLength; i < length; ++i) {
        results.push(query.snapshotItem(i));
    }
    return results;
}

function getTimestamp() {
    var nowDate = new Date();
    var date = nowDate.toDateString();
    var time = nowDate.toLocaleTimeString();
    var timestamp = '--' + date + ', ' + time + '--';
    console.log(timestamp);
    return timestamp;
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getDates(start, end) {
    for (var arr = [], dt = new Date(start); dt <= new Date(end); dt.setDate(dt.getDate() + 1)) {
        arr.push(new Date(dt));
    }
    return arr;
};

function getDatesInRange(array, start, end) {
    var inRange = [];
    for (dt = new Date(start); dt <= new Date(end); dt.setDate(dt.getDate() + 1)) {
        if (array.contains(dt.toLocaleDateString('en-US'))) {
            //console.log("dt: " + dt);
            inRange.push(new Date(dt));
        }
    }
    return inRange;
}

function isInArray(strArray, str) {
    return strArray.includes(str)
}

function PlayAlert() {
    var alertsound = new Audio('https://www.soundjay.com/misc/wind-chime-1.mp3');
    alertsound.play();
}

function openTabs(arrivalDate, departureDate) {
    if (arrivalDate != "Invalid Date" && departureDate != "Invalid Date") {
        arrivalDate = arrivalDate.toLocaleDateString('en-us', formatDateOptions)
        departureDate = departureDate.toLocaleDateString('en-us', formatDateOptions)
        arrivalDate = arrivalDate.replace(/\//g, "%2F");
        departureDate = departureDate.replace(/\//g, "%2F");
        var loginURL = baseURL + "/login/index";
        var bookingQueryString = "?locationid=78&arrivaldate=" + arrivalDate + "&departuredate=" + departureDate + "&adults=2&children=3&pets=0&autos=0&category=1&equiptype=3&length=27";
        var bookingURL = baseURL + "/reserve/startbooking" + bookingQueryString;

        console.log("Redirecting to the Campgrounds Booking Page");
        console.log(bookingURL);
        window.location.replace(loginURL + bookingQueryString);
    }
    else {
        console.log("Invalid Date");
    }
}

async function click() {
    window.console.log('searching page for the "Select Site" button');
    var foundSelectSiteButton = clickXPathButton(buttonXPath);
    if (foundSelectSiteButton == true) {
        clickCount = clickCount + 1;
        console.log('clicked the "Select Site" button ' + clickCount + ' times');
    }
    if (foundSelectSiteButton == false) {
        //Open Site Availability Calendar
        var foundAvailabilityButton = clickXPathButton(availabilityButtonXPath);
        if (foundAvailabilityButton == true) {
            console.log('clicked the "Check Availability Calendar" button');
        }
        await sleep(2000);
        var arrivalDate = (new Date(document.getElementById('cartCheckin').innerHTML));
        var departureDate = (new Date(document.getElementById('cartCheckout').innerHTML));
        var numberOfNights = document.getElementById('cartNoOfNights').innerHTML;
        console.log("Desired Dates to Book\n   Arrival: " + arrivalDate.toLocaleDateString('en-US') + "    Departure: " + departureDate.toLocaleDateString('en-US') + "    Number of Nights: " + numberOfNights);

        var getPrevious = false;
        if (arrivalDate.getMonth() < departureDate.getMonth()) {
            getPrevious = true;
        }

        getAvailability(getPrevious);
        await sleep(8000);
        console.log("Available Dates length: " + availableDates.length);

        //bookingPreference switch: none | trailing | leading | consecutive
        switch (bookingPreference.toLowerCase()) {
            case "trailing":
                console.log("Found Arrival Date: " + availableDates.contains(arrivalDate.toLocaleDateString('en-US')))
                if (availableDates.length > 0) {
                    var foundArrivalDate;
                    var foundDepartureDate;
                    var foundNumberOfNights = 0;
                    if (availableDates.contains(arrivalDate.toLocaleDateString('en-US'))) {
                        foundArrivalDate = arrivalDate;
                        console.log("foundArrivalDate: " + foundArrivalDate);
                        var dateArray = getDates(arrivalDate, departureDate);
                        console.log("dateArray.length: " + dateArray.length);
                        console.log("dateArray: " + dateArray);
                        for (i = 0; i < dateArray.length; i++) {
                            if (availableDates.contains(dateArray[i].toLocaleDateString('en-US'))) {
                                console.log("dateArray[" + i + "]: " + dateArray[i]);
                                foundDepartureDate = dateArray[i];
                                if (foundArrivalDate.toLocaleDateString('en-US') == foundDepartureDate.toLocaleDateString('en-US')) {
                                    foundDepartureDate.setDate(foundDepartureDate.getDate() + 1);
                                }
                                foundNumberOfNights = i + 1;
                                console.log("foundDepartureDate: " + foundDepartureDate);
                                console.log("foundNumberOfNights: " + foundNumberOfNights);
                            }
                            else {
                                i = dateArray.length;
                            }
                        }
                        if (foundNumberOfNights > 0) {
                            console.log("Available Dates to Book\n   Arrival: " + foundArrivalDate.toLocaleDateString('en-US', formatDateOptions) + "    Departure: " + foundDepartureDate.toLocaleDateString('en-US', formatDateOptions) + "    Number of Nights: " + foundNumberOfNights);
                            openTabs(foundArrivalDate, foundDepartureDate);
                        }
                    }
                }
                break;

            case "leading":
                console.log("Found Departure Date: " + availableDates.contains(departureDate.toLocaleDateString('en-US')))
                if (availableDates.length > 0) {
                    var foundArrivalDate;
                    var foundDepartureDate;
                    var foundNumberOfNights = 0;
                    if (availableDates.contains(departureDate.toLocaleDateString('en-US'))) {
                        foundDepartureDate = departureDate;
                        console.log("foundDepartureDate: " + foundDepartureDate);
                        var dateArray = getDates(arrivalDate, departureDate);
                        console.log("dateArray.length: " + dateArray.length);
                        console.log("dateArray: " + dateArray);
                        for (i = dateArray.length - 1; i >= 0; i--) {
                            if (availableDates.contains(dateArray[i].toLocaleDateString('en-US'))) {
                                console.log("dateArray[" + i + "]: " + dateArray[i]);
                                foundArrivalDate = dateArray[i];
                                if (foundArrivalDate.toLocaleDateString('en-US') == foundDepartureDate.toLocaleDateString('en-US')) {
                                    foundArrivalDate.setDate(foundArrivalDate.getDate() - 1);
                                }
                                foundNumberOfNights = i + 1;
                                console.log("foundArrivalDate: " + foundArrivalDate);
                                console.log("foundNumberOfNights: " + foundNumberOfNights);
                            }
                            else {
                                i = -1;
                            }
                        }
                        if (foundNumberOfNights > 0) {
                            console.log("Available Dates to Book\n   Arrival: " + foundArrivalDate.toLocaleDateString('en-US', formatDateOptions) + "    Departure: " + foundDepartureDate.toLocaleDateString('en-US', formatDateOptions) + "    Number of Nights: " + foundNumberOfNights);
                            openTabs(foundArrivalDate, foundDepartureDate);
                        }
                    }
                }
                break;

            case "consecutive":
                var arr = getDatesInRange(availableDates, arrivalDate, departureDate);
                var startDate;
                var endDate;
                var range = [];
                var consecutiveDates = [];

                arr.sort((a, b) => a.getTime() - b.getTime());
                arr.some(function (v, i, arr) {
                    if (i > 0) {
                        const tmp = new Date(arr[i - 1]);

                        if (this.consecutiveCount == 0) {
                            startDate = tmp.toLocaleDateString('en-US');
                        }

                        //console.log("tmp: " + tmp.toLocaleDateString('en-US'));
                        tmp.setDate(tmp.getDate() + 1);
                        //console.log("tmp: " + tmp.toLocaleDateString('en-US'));
                        //console.log(tmp.toLocaleDateString('en-US') + "===" + v.toLocaleDateString('en-US'));
                        if (tmp.getTime() === v.getTime()) {
                            endDate = tmp.toLocaleDateString('en-US');
                            this.consecutiveCount++;
                            //console.log("consecutiveCount: " + this.consecutiveCount + " -  " + v.toLocaleDateString('en-US'));
                        } else {
                            startDate = undefined;
                            endDate = undefined;
                            this.consecutiveCount = 0;
                            //console.log(v.toLocaleDateString('en-US'));
                        }

                    }
                    if (i == arr.length - 1) {
                        range = [this.consecutiveCount, startDate, endDate];
                        consecutiveDates.push(range);
                    }

                    if (this.consecutiveCount == 0) {
                        if (range[1] != undefined & range[2] != undefined) {
                            consecutiveDates.push(range);
                            //console.log("StartDate: " + range[1] + "    EndDate: " + range[2] + "    ConsecutiveCount: " + range[0]);
                        }
                    }
                    if (startDate != undefined && endDate != undefined) {
                        //console.log("StartDate: " + startDate + "    EndDate: " + endDate + "    ConsecutiveCount: " + this.consecutiveCount);
                    }
                    range = [this.consecutiveCount, startDate, endDate];
                }, {
                    consecutiveCount: 0
                });

                console.log(consecutiveDates);
                if (consecutiveDates.length > 0) {
                    consecutiveDates.sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]));

                    if (minimumConsecutiveDays <= consecutiveDates[0][0]) {
                        console.log("Available Dates to Book\n   Arrival: " + consecutiveDates[0][1] + "    Departure: " + consecutiveDates[0][2] + "    Number of Nights: " + consecutiveDates[0][0]);
                        openTabs(consecutiveDates[0][1], consecutiveDates[0][2]);
                    }
                }
                break;

            default:
            // code block
        }

        console.log("Sleeping... 1 minute");
        await sleep(50000);
        console.log("Reloading Page");
        window.location.reload();
    }
    else {
        PlayAlert();
        await sleep(3000);
        var reservationError = document.getElementById('reservationError').innerText;
        if (reservationError != undefined) {
            console.log('ERROR:\n' + reservationError);
        }
        if (reservationError == "Unable to process your request.") {
            console.log("Sleeping...1 minute");
            await sleep(59000);
            console.log("Reloading Page");
            window.location.reload();
        }

        console.log("Sleeping...3 minutes");
        await sleep(177000);
        if (clickCount <= 49) {
            getTimestamp();
            click();
        }
        else {
            console.log("Reloading Page");
            window.location.reload();
        }
    }
}

async function getAvailability(getPrevious) {
    if (getPrevious == true) {
        clickXPathButton(availabilityCalendarPreviousMonthButtonXPath);
        await sleep(2000);
    }

    $elements = getElementsByXPath(availabilityCalendarXPath);
    $elements.forEach(($element) => {
        var myURL = $element.getElementsByTagName('a');
        for (var i = 0; i < myURL.length; i++) {
            var title = myURL[i].getAttribute('title');
            if (title != null) {
                title = title.replace("Select ", "");
                console.log(title);
                var convertedStartDate = (new Date(title))
                if (convertedStartDate != "Invalid Date") {
                    availableDates.push(convertedStartDate.toLocaleDateString('en-US'));
                }
            }
        }
    })

    await sleep(2000);

    if (getPrevious == true) {
        var foundNextMonthButton = clickXPathButton(availabilityCalendarNextMonthButtonXPath);
        await sleep(2000);

        if (foundNextMonthButton == true) {
            $elements = getElementsByXPath(availabilityCalendarXPath);
            $elements.forEach(($element) => {
                var myURL = $element.getElementsByTagName('a');
                for (var i = 0; i < myURL.length; i++) {
                    var title = myURL[i].getAttribute('title');
                    if (title != null) {
                        title = title.replace("Select ", "");
                        console.log(title);
                        var convertedStartDate = (new Date(title));
                        if (convertedStartDate != "Invalid Date") {
                            availableDates.push(convertedStartDate.toLocaleDateString('en-US'));
                        }
                    }
                }
            })
        }

        await sleep(2000);

        clickXPathButton(availabilityCalendarPreviousMonthButtonXPath);
    }

    console.log("Available Dates (" + availableDates.length + "):\n" + availableDates);
}

async function launch() {
    getTimestamp();

    //check for fatal site error
    //502 Bad Gateway, 504 Gateway Time-out
    if (document.title.substring(0, 3) == "502" || document.title.substring(0, 3) == "504") {
        console.log("ERROR: " + document.title);
        console.log("Sleeping...3 minute");
        await sleep(180000);
        console.log("Reloading Page");
        window.location.reload();
    }

    //pull the query string and save it for a re-login
    let params = new URLSearchParams(document.location.search);
    //window.console.log("currentQueryString: " + params);
    //window.console.log("bookingQueryString: " + localStorage.getItem("bookingQueryString"));
    if (params != "") {
        localStorage.setItem("bookingQueryString", params);
    }
    click();
}

launch();
