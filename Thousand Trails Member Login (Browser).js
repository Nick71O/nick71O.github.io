
var globalVariables = {
    memberNumber: "",
    PIN: "",
    //bookingPreference switch: auto | consecutive | leadingtrailing | datearray
    bookingPreference: "datearray",
    minimumConsecutiveDays: 3,
    availabilityCheckIntervalMinutes: 5,
    bookedArrivalDate: "06/27/2024", //null
    bookedDepartureDate: "07/01/2024", //null
    desiredArrivalDate: "06/27/2024",  
    desiredDepartureDate: "07/15/2024",
    desiredDatesArray: [
        "08/02/2024",
        "08/03/2024",
        "08/04/2024",
        "08/09/2024",
        "08/13/2024",
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

