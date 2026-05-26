chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.scripting.executeScript(
    {
      target: { tabId: tabs[0].id },
      func: () => {
        return document.querySelector('[data-cy="question-title"]').innerText;
      }
    },
    (results) => {
      document.getElementById("title").innerText = results[0].result;
    }
  );
});