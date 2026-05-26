const title = document.querySelector('[data-cy="question-title"]').innerText;

chrome.runtime.sendMessage({
  problemTitle: title
});