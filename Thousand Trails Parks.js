
const baseURL = "https://members.thousandtrails.com"

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getTimestamp() {
  var nowDate = new Date();
  var date = nowDate.toDateString();
  var time = nowDate.toLocaleTimeString();
  var timestamp = '--' + date + ', ' + time + '--';
  console.log(timestamp);
  return timestamp;
}

async function launch() { 
    getTimestamp();
    var sharedBookingURL = localStorage.getItem("bookingQueryString")
    //var sharedBookingURL = sessionStorage.getItem("bookingQueryString")
    
    if (sharedBookingURL != "") {      
        console.log("Redirecting to the Campgrounds Booking Page");
        console.log("sharedBookingURL: " + sharedBookingURL);
        var bookingURL = baseURL + "/reserve/startbooking?" + sharedBookingURL
        console.log(bookingURL);
        await sleep(500);
        window.location.replace(bookingURL);
    }
    else {
        console.log("FAILED to redirect to the Campgrounds Booking Page. sharedBookingURL was blank");
    }

    //window.location.replace("https://members.thousandtrails.com/reserve/startbooking?locationid=78&arrivaldate=07%2F06%2F2023&departuredate=07%2F10%2F2023&adults=2&children=3&pets=0&autos=0&category=1&equiptype=3&length=27");
}

launch();