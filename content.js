//this part sends the title to popup.js file.

console.log("Content script loaded!", document.querySelector('[data-cy="question-title"]'));

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_TITLE") {
    const el = document.querySelector('.text-title-large a');  // target the <a> tag
    sendResponse({ title: el ? el.innerText.trim() : null });
  }
});