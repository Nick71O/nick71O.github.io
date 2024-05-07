
var globalVariables = {
    memberNumber: "",
    PIN: "",
    //bookingPreference switch: consecutive | leadingtrailing
    bookingPreference: "consecutive",
    minimumConsecutiveDays: 3,
    bookedArrivalDate: null,
    bookedDepartureDate: null,
    //bookedArrivalDate: "05/04/2024",  
    //bookedDepartureDate: "05/16/2024",
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

