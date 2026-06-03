chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_TITLE") {
    const el = document.querySelector('.text-title-large a');
    sendResponse({ title: el ? el.innerText.trim() : null });
  }

  if (message.type === "GET_DESCRIPTION") {
    const el = document.querySelector('[data-track-load="description_content"]');
    sendResponse({ description: el ? el.innerText : null });
  }

  if (message.type === "GET_CODE") {
    const handler = (e) => {
      document.removeEventListener('MONACO_CODE', handler);
      sendResponse({ code: e.detail.code, lang: e.detail.lang });
    };
    document.addEventListener('MONACO_CODE', handler);

    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    document.documentElement.appendChild(script);
    return true;
  }
});