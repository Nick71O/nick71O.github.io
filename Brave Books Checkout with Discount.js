  var globalVariables = {
    discountCode1: "ARTIST",
    discountCode2: "ARTIST",
    autoRunTime: "12:45 PM",
    maxAttempts1: 5,
    maxAttempts2: 495,
    delayBeforeRetry: 100,
    delayBeforeInput: 50,
    delayBeforeApplyButton: 50,
    delaySubmitButtonEnabled: 100,
    maxCheckForErrorMessages: 50,
    delayCheckForErrorMessages: 500,
    delayCheckForErrorMessagesRetry: 100,
    maxCheckForPayNowButton: 50,
    delayCheckForPayNowButton: 100,
  };
  
  // Call initializeGlobalVariables function in main.js
  if (typeof initializeGlobalVariables === 'function') {
    console.log('Running initializeGlobalVariables');
    initializeGlobalVariables(globalVariables);
  } else {
    console.log('initializeGlobalVariables function is not defined in "Brave Books Common.js"');
    console.error('initializeGlobalVariables function is not defined in "Brave Books Common.js"');
  }
