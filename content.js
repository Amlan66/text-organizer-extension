console.log('Content script loaded');

let isEnabled = false;

function initializeHighlighter() {
  chrome.storage.local.get('enabledSites', (data) => {
    const enabledSites = data.enabledSites || [];
    isEnabled = enabledSites.includes(window.location.hostname);
    console.log('Highlighter initialized, isEnabled:', isEnabled);
  });
}

initializeHighlighter();

document.addEventListener('mouseup', () => {
  console.log('Mouse up event triggered, isEnabled:', isEnabled);
  if (!isEnabled) return;

  const selectedText = window.getSelection().toString().trim();
  console.log('Selected text:', selectedText);
  if (selectedText) {
    showColorPopup(selectedText);
  }
});

function showColorPopup(text) {
  console.log('Showing color popup for text:', text);
  const popup = document.createElement('div');
  popup.className = 'highlight-color-popup';
  popup.innerHTML = `
    <button data-color="yellow">Yellow</button>
    <button data-color="green">Green</button>
    <button data-color="blue">Blue</button>
    <button data-color="pink">Pink</button>
  `;
  
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  popup.style.position = 'absolute';
  popup.style.left = `${rect.left + window.scrollX}px`;
  popup.style.top = `${rect.bottom + window.scrollY}px`;
  
  document.body.appendChild(popup);
  console.log('Color popup added to the page');
  
  popup.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      const color = e.target.dataset.color;
      console.log('Color selected:', color);
      highlightText(text, color);
      document.body.removeChild(popup);
    }
  });
}

function highlightText(text, color) {
  console.log('Highlighting text:', text, 'with color:', color);
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const span = document.createElement('span');
  span.className = `highlight-${color}`;
  span.textContent = text;
  range.deleteContents();
  range.insertNode(span);
  
  saveHighlight(text, color);
}

function saveHighlight(text, color) {
  console.log('Sending highlight to background script:', text, color);
  chrome.runtime.sendMessage({
    action: 'saveHighlight',
    text: text,
    color: color
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error saving highlight:', chrome.runtime.lastError);
    } else {
      console.log('Highlight saved successfully');
    }
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);
  if (request.action === 'toggleHighlighter') {
    isEnabled = request.enabled;
    console.log('Highlighter toggled:', isEnabled);
    sendResponse({received: true});
  }
  return true;
});
