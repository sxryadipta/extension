chrome.webNavigation.onCompleted.addListener(
  async (details) => {
    // Open the popup
    try {
      await chrome.action.openPopup();
    } catch (error) {
      console.error("Failed to open popup:", error);
    }
  },
  {
    url: [
      {
        urlMatches: 'https://leetcode.com/problems/*'
      }
    ]
  }
);
