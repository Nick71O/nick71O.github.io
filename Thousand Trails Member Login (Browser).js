
var globalVariables = {
    memberNumber: "",
    PIN: "",
    //bookingPreference switch: consecutive | leadingtrailing
    bookingPreference: "consecutive",
    minimumConsecutiveDays: 3,
    bookedArrivalDate: null,   //"06/28/2024",
    bookedDepartureDate: null, //"07/01/2024",
    desiredArrivalDate: "06/27/2024",  
    desiredDepartureDate: "07/15/2024",
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

