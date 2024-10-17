chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveHighlight') {
    saveHighlight(request.text, request.color, sender.tab.url);
  } else if (request.action === 'exportAllPDF') {
    exportAllPDF();
  }
});

function saveHighlight(text, color, url) {
  console.log('Saving highlight:', text, color, url);
  const hostname = new URL(url).hostname;
  chrome.storage.local.get(hostname, (result) => {
    let fileContent = result[hostname] || { url: url, highlights: [] };
    fileContent.highlights.push({ text: text, color: color });
    
    let saveObj = {};
    saveObj[hostname] = fileContent;
    chrome.storage.local.set(saveObj, () => {
      console.log('Highlight saved successfully');
    });
  });
}

function exportAllPDF() {
  // Implement PDF export functionality here
  console.log('Exporting all highlights as PDF');
}
