chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getPersonData") {
      fetch(`https://school.tubik-corp.ru/get-by-personid/${request.personId}`)
        .then(response => response.json())
        .then(data => sendResponse(data))
        .catch(error => sendResponse({error: error.message}));
      return true;  // Will respond asynchronously
    }
  });

  