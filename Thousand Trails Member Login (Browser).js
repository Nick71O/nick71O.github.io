
var globalVariables = {
    memberNumber: "",
    PIN: "",
    //bookingPreference switch: auto | consecutive | leadingtrailing | datearray
    bookingPreference: "datearray",
    minimumConsecutiveDays: 3,
    availabilityCheckIntervalMinutes: 5,
    desiredArrivalDate: "06/27/2024",  
    desiredDepartureDate: "07/15/2024",
    desiredDatesArray: [
        "07/01/2024",
        "07/02/2024",
        "07/03/2024",
        "07/04/2024",
        "07/05/2024",
        "07/06/2024",
        "07/07/2024",
        "07/08/2024",
        "07/09/2024",
        "07/10/2024",
        "07/11/2024",
        "07/12/2024",
        "07/13/2024",
        "07/14/2024",
        "08/09/2024",
        "08/13/2024"
    ],
    bookedArrivalDate: "06/27/2024", //null
    bookedDepartureDate: "07/01/2024", //null
    bookedDatesArray: [
        "06/27/2024",
        "06/28/2024",
        "06/29/2024",
        "06/30/2024",
        "07/01/2024",
        "08/02/2024",
        "08/03/2024",
        "08/04/2024",
        "08/05/2024",
        "08/06/2024",
        "08/07/2024",
        "08/08/2024",
        "08/10/2024",
        "08/11/2024",
        "08/12/2024",
        "08/14/2024",
        "08/15/2024",
        "08/16/2024"
    ],
    pushoverUserKey: "",
    pushoverApiTokenAvailability: "",
    pushoverApiTokenReservation: ""
};

// Call initializeGlobalVariables function in "Thousand Trails Member Login.js"
if (typeof initializeGlobalVariables === 'function') {
    console.log('Running initializeGlobalVariables');
    initializeGlobalVariables(globalVariables);
} else {
    var msg = 'initializeGlobalVariables function is not defined in "Thousand Trails Member Login.js"';
    console.log(msg);
    console.error(msg);
}

