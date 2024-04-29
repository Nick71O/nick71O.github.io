const dbName = 'ThousandTrailsDB';
const dbVersion = 1;
let db;

const openDBRequest = indexedDB.open(dbName, dbVersion);

openDBRequest.onerror = function(event) {
  console.error('Failed to open IndexedDB:', event.target.error);
};

openDBRequest.onsuccess = function(event) {
  db = event.target.result;
  console.log('IndexedDB opened successfully.');

  // Check if SiteConstants already exist
  const transaction = db.transaction(['SiteConstants'], 'readwrite');
  const siteConstantsStore = transaction.objectStore('SiteConstants');

  const siteConstantsRequest = siteConstantsStore.get('siteConstants');

  siteConstantsRequest.onsuccess = function(event) {
    const siteConstantsData = event.target.result;

    if (siteConstantsData) {
      console.log('SiteConstants already exist.');
    } else {
      // SiteConstants do not exist, create new entry
      setSiteConstants();
    }
  };

  siteConstantsRequest.onerror = function(event) {
    console.error('Error fetching SiteConstants:', event.target.error);
  };
};

openDBRequest.onupgradeneeded = function(event) {
  db = event.target.result;
  console.log('Creating object stores');

  // Check if "Availability" table already exists
  if (!db.objectStoreNames.contains('Availability')) {
    // Create Availability table only if it doesn't exist
    const availabilityObjectStore = db.createObjectStore('Availability', { keyPath: 'id', autoIncrement: true });
    availabilityObjectStore.createIndex('ArrivalDate', 'ArrivalDate', { unique: false });
    availabilityObjectStore.createIndex('DepartureDate', 'DepartureDate', { unique: false });
    availabilityObjectStore.createIndex('Checked', 'Checked', { unique: false });

    console.log('Availability table created');
  } else {
    console.log('Availability table already exists.');
  }
};

function setSiteConstants() {
  const transaction = db.transaction(['SiteConstants'], 'readwrite');
  const siteConstantsStore = transaction.objectStore('SiteConstants');

  const siteConstantsData = {
    key: 'siteConstants',
    DesiredArrivalDate: '05/03/2024',
    DesiredDepartureDate: '05/05/2024',
    BookingPreference: 'None',
    MinimumConsecutiveDays: '4'
  };

  const addRequest = siteConstantsStore.add(siteConstantsData, 'siteConstants');

  addRequest.onsuccess = function() {
    console.log('New SiteConstants entry added.');
  };

  addRequest.onerror = function(event) {
    console.error('Error adding new SiteConstants entry:', event.target.error);
  };
}




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
  
  