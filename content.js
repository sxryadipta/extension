//this part fetches and sends the problem title to popup.js file.

console.log("Content script loaded!", document.querySelector('[data-cy="question-title"]'));

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_TITLE") {
    const el = document.querySelector('.text-title-large a');  // target the <a> tag
    sendResponse({ title: el ? el.innerText.trim() : null });
  }

  if (message.type === "GET_DESCRIPTION") {
    const el = document.querySelector('[data-track-load="description_content"]');
    sendResponse({ description: el ? el.innerText : null });
  }
});


// this part fetches the problem description and converts into a markdown.

const descDiv = document.querySelector('[data-track-load="description_content"]');
const markdown = descDiv.innerText;