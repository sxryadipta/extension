chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.url.includes("leetcode.com/problems/")) {
    chrome.tabs.sendMessage(details.tabId, { type: "GET_TITLE" }, (response) => {
      if (response?.title) {
        chrome.storage.local.set({ problemTitle: response.title });
      }
    });
  }
}, { url: [{ urlContains: "leetcode.com/problems/" }] });