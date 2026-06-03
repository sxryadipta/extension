const code = monaco.editor.getModels()[0].getValue();
const lang = document.querySelectorAll('button[aria-haspopup="dialog"]')[1]?.childNodes[0]?.textContent?.trim();
document.dispatchEvent(new CustomEvent('MONACO_CODE', { detail: { code, lang } }));