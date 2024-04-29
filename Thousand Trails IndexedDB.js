const dbName = 'ThousandTrailsDB';
const dbVersion = 1;
let db;

// Open or create the database
const request = indexedDB.open(dbName, dbVersion);

// Define the structure of the database
request.onupgradeneeded = function(event) {
  const db = event.target.result;

  // Create SiteConstants table
  const siteConstantsStore = db.createObjectStore('SiteConstants', { keyPath: 'key' });
  siteConstantsStore.createIndex('value', 'value');

  // Create Availability table
  const availabilityStore = db.createObjectStore('Availability', { autoIncrement: true });
  availabilityStore.createIndex('ArrivalDate', 'ArrivalDate');
  availabilityStore.createIndex('DepartureDate', 'DepartureDate');
  availabilityStore.createIndex('Checked', 'Checked');
};

request.onsuccess = function(event) {
  const db = event.target.result;

  // Populate SiteConstants with initial data
  const siteConstantsTx = db.transaction(['SiteConstants'], 'readwrite'); // Updated line
  const siteConstantsStore = siteConstantsTx.objectStore('SiteConstants');
  
  siteConstantsStore.add({ key: 'DesiredArrivalDate', value: '05/03/2024' });
  siteConstantsStore.add({ key: 'DesiredDepartureDate', value: '05/05/2024' });
  siteConstantsStore.add({ key: 'BookingPreference', value: 'None' });
  siteConstantsStore.add({ key: 'MinimumConsecutiveDays', value: '4' });

  siteConstantsTx.oncomplete = function() {
    console.log('SiteConstants initialized');
  };

  siteConstantsTx.onerror = function(event) {
    console.error('Error initializing SiteConstants', event.target.error);
  };
};

request.onerror = function(event) {
  console.error('Error opening database', event.target.error);
};



// Call the function with new dates
//const newArrivalDate = '05/10/2024';
//const newDepartureDate = '05/15/2024';
//updateSiteConstantsDates(newArrivalDate, newDepartureDate);

function updateSiteConstantsDates(newArrivalDate, newDepartureDate) {
    const transaction = db.transaction(['SiteConstants'], 'readwrite');
    const siteConstantsStore = transaction.objectStore('SiteConstants');
  
    const siteConstantsRequest = siteConstantsStore.get('siteConstants');
  
    siteConstantsRequest.onsuccess = function(event) {
      const siteConstantsData = event.target.result;
  
      if (siteConstantsData) {
        // Update the DesiredArrivalDate and DesiredDepartureDate
        siteConstantsData.DesiredArrivalDate = newArrivalDate;
        siteConstantsData.DesiredDepartureDate = newDepartureDate;
  
        const updateRequest = siteConstantsStore.put(siteConstantsData, 'siteConstants');
  
        updateRequest.onsuccess = function() {
          console.log('SiteConstants updated with new dates.');
        };
  
        updateRequest.onerror = function(event) {
          console.error('Error updating SiteConstants:', event.target.error);
        };
      } else {
        console.error('SiteConstants not found.');
      }
    };
  
    siteConstantsRequest.onerror = function(event) {
      console.error('Error fetching SiteConstants:', event.target.error);
    };
  }

  
  function deleteAllAvailabilityRecords() {
    const transaction = db.transaction(['Availability'], 'readwrite');
    const objectStore = transaction.objectStore('Availability');
  
    const request = objectStore.clear();
  
    request.onsuccess = function() {
      console.log('All records deleted from the Availability table.');
    };
  
    request.onerror = function(event) {
      console.error('Error deleting records:', event.target.error);
    };
  }

  
  function insertAvailabilityRecords() {
    const transaction = db.transaction(['SiteConstants', 'Availability'], 'readonly');
    const siteConstantsStore = transaction.objectStore('SiteConstants');
    const availabilityStore = transaction.objectStore('Availability');
  
    const siteConstantsRequest = siteConstantsStore.get('siteConstants');
  
    siteConstantsRequest.onsuccess = function(event) {
      const siteConstantsData = event.target.result;
  
      if (siteConstantsData) {
        const desiredArrivalDate = new Date(siteConstantsData.DesiredArrivalDate);
        const desiredDepartureDate = new Date(siteConstantsData.DesiredDepartureDate);
  
        // Calculate days between DesiredArrivalDate and DesiredDepartureDate
        const dateDifference = Math.abs(desiredDepartureDate - desiredArrivalDate);
        const daysDifference = Math.ceil(dateDifference / (1000 * 60 * 60 * 24));
  
        // Insert a new row for each day between DesiredArrivalDate and DesiredDepartureDate
        for (let i = 0; i <= daysDifference; i++) {
          const currentDate = new Date(desiredArrivalDate);
          currentDate.setDate(currentDate.getDate() + i);
  
          const nextDay = new Date(currentDate);
          nextDay.setDate(nextDay.getDate() + 1);
  
          const newRecord = {
            ArrivalDate: currentDate.toLocaleDateString(),
            DepartureDate: nextDay.toLocaleDateString(),
            Checked: null // Leave Checked blank (null)
          };
  
          availabilityStore.add(newRecord);
        }
  
        console.log('Availability records inserted successfully.');
      } else {
        console.error('SiteConstants not found.');
      }
    };
  
    siteConstantsRequest.onerror = function(event) {
      console.error('Error fetching SiteConstants:', event.target.error);
    };
  }
  
  