chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, { type: "GET_TITLE" }, (response) => {
    if (response?.title) {
      document.getElementById("problem-name").innerText = response.title;
    } else {
      document.getElementById("problem-name").innerText = "Could not fetch title.";
    }
  });
});