
var globalVariables = {
    memberNumber: "",
    PIN: "",
    bookingPreference: "datearray", // options: auto | consecutive | leadingtrailing | datearray
    bookingAvailabilityMapCheck: "double", // options: single | double | both
    minimumConsecutiveDays: 3,
    availabilityCheckIntervalMinutes: 5,
    humanVerificationReloadMinutes: 60,
    memberLoginSubmitDelaySeconds: 10,
    parksRedirectBookingDelaySeconds: 15,
    reservationDetailsChooseCampsiteDelaySeconds: 35,
    chooseCampsiteNoSiteRedirectDelaySeconds: 25,
    chooseCampsiteSelectSiteDelaySeconds: 25,
    enterPaymentBookReservationDelaySeconds: 45,
    reservationInputSiteType: "RV Site", // options: RV Site | Tent Site | Cabin/Rental Accomodation
    reservationInputEquipmentType: "Travel Trailer", // options: Motorhome | Fifth Wheel | Travel Trailer | Pickup camper | Tent | Other
    reservationInputLength: "27",
    reservationInputWithSlideouts: "No", // options: Yes | No
    reservationInputAdults: "2",
    reservationInputChildren: "3",
    reservationInputPets: "0",
    campgroundName: "Lake & Shore",
    desiredSiteTypesByCampground: {
        "Lake & Shore": [
            "Member Deluxe RV Site - 30/50 Amp, Full Hook-Ups, Back-In",
            "Member Deluxe RV Site - 30/50 Amp, Full Hook-Ups, Pull Through"
        ],
        "Moody Beach": [
            "Member Deluxe RV Site - 30 Amp, Full Hook-Ups, Back-In",
            "Member Deluxe RV Site - 30 Amp, Full Hook-Ups, Parallel",
            "Member Deluxe RV Site - 50 Amp, Full Hook-Ups, Back-In"
        ],
        "Gateway to Cape Cod": [
            "Member Deluxe RV Site - 30/50 Amp, Full Hook-Ups, Back-In",
            "Member Deluxe RV Site - 30/50 Amp, Full Hook-Ups, Pull Through",
            "M Prem - 30/50Amp W/E/S PT",
            "M H Prem - 30/50Amp W/E/S PT"
        ],
        "Rondout Valley": [
            "Member Deluxe RV Site - 30/50 Amp, Full Hook-Ups, Back-In",
            "Member Standard RV Site - 30/50 Amp, Water/Electric Hook-Ups, Back-In",
            "M Dlx RV-30/50Amp W/E BI",
            "M Stand RV-30/50Amp W/E/S BI",
            "M Prem RV-30/50Amp W/E/S BI"
        ]
    },
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
    bookedSiteType: 'Member Deluxe RV Site - 30/50 Amp, Full Hook-Ups, Back-In', //null
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
