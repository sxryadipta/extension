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
    document.addEventListener('MONACO_CODE', (e) => {
      sendResponse({ code: e.detail.code, lang: e.detail.lang });
    }, { once: true });

    const script = document.createElement('script');
    script.textContent = `
      const code = monaco.editor.getModels()[0].getValue();
      const lang = document.querySelectorAll('button[aria-haspopup="dialog"]')[1]?.childNodes[0]?.textContent?.trim();
      document.dispatchEvent(new CustomEvent('MONACO_CODE', { detail: { code, lang } }));
    `;
    document.documentElement.appendChild(script);
    script.remove();
  }  

  return true; 
});