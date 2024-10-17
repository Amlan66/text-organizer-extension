document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('toggleButton');
  const fileList = document.getElementById('fileList');
  const exportAllButton = document.getElementById('exportAll');

  console.log('Popup script loaded');

  // Check if extension is enabled for current tab
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    console.log('Current tab:', tabs[0]);
    const currentUrl = new URL(tabs[0].url).hostname;
    chrome.storage.local.get('enabledSites', (data) => {
      console.log('Enabled sites:', data.enabledSites);
      const enabledSites = data.enabledSites || [];
      if (enabledSites.includes(currentUrl)) {
        toggleButton.textContent = 'Disable for this site';
      } else {
        toggleButton.textContent = 'Enable for this site';
      }
    });
  });

  // Toggle extension for current site
  toggleButton.addEventListener('click', () => {
    console.log('Toggle button clicked');
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const currentUrl = new URL(tabs[0].url).hostname;
      chrome.storage.local.get('enabledSites', (data) => {
        let enabledSites = data.enabledSites || [];
        if (enabledSites.includes(currentUrl)) {
          enabledSites = enabledSites.filter(site => site !== currentUrl);
          toggleButton.textContent = 'Enable for this site';
        } else {
          enabledSites.push(currentUrl);
          toggleButton.textContent = 'Disable for this site';
        }
        console.log('Updated enabled sites:', enabledSites);
        chrome.storage.local.set({enabledSites: enabledSites}, () => {
          console.log('Enabled sites saved');
          chrome.tabs.sendMessage(tabs[0].id, {action: 'toggleHighlighter', enabled: enabledSites.includes(currentUrl)}, (response) => {
            if (chrome.runtime.lastError) {
              console.log('Error sending message:', chrome.runtime.lastError.message);
              // Inject the content script if it's not already there
              chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                files: ['content.js']
              }, () => {
                if (chrome.runtime.lastError) {
                  console.error('Error injecting content script:', chrome.runtime.lastError);
                } else {
                  console.log('Content script injected successfully');
                }
              });
            } else {
              console.log('Toggle message sent, response:', response);
            }
          });
        });
      });
    });
  });

  // Load and display saved files
  chrome.storage.local.get(null, (items) => {
    console.log('All stored items:', items);
    for (let fileName in items) {
      if (fileName !== 'enabledSites' && typeof items[fileName] === 'object') {
        const li = document.createElement('li');
        li.textContent = fileName;
        li.addEventListener('click', () => {
          showHighlights(fileName, items[fileName]);
        });
        fileList.appendChild(li);
      }
    }
  });

  // Export all files as PDF
  exportAllButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({action: 'exportAllPDF'});
  });
});

function showHighlights(fileName, fileContent) {
  const highlightsList = document.createElement('ul');
  fileContent.highlights.forEach((highlight, index) => {
    const li = document.createElement('li');
    li.innerHTML = `<span style="background-color: ${highlight.color};">${highlight.text}</span>`;
    
    // Add edit and delete buttons
    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => editHighlight(fileName, index));
    
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => deleteHighlight(fileName, index));
    
    li.appendChild(editButton);
    li.appendChild(deleteButton);
    highlightsList.appendChild(li);
  });

  // Replace the file list with the highlights list
  const fileList = document.getElementById('fileList');
  fileList.innerHTML = '';
  fileList.appendChild(highlightsList);

  // Add a back button
  const backButton = document.createElement('button');
  backButton.textContent = 'Back to file list';
  backButton.addEventListener('click', () => location.reload());
  fileList.insertBefore(backButton, fileList.firstChild);
}

function editHighlight(fileName, index) {
  chrome.storage.local.get(fileName, (result) => {
    const fileContent = result[fileName];
    const highlight = fileContent.highlights[index];
    const newText = prompt('Edit highlight:', highlight.text);
    if (newText !== null) {
      highlight.text = newText;
      chrome.storage.local.set({ [fileName]: fileContent }, () => {
        console.log('Highlight updated');
        showHighlights(fileName, fileContent);
      });
    }
  });
}

function deleteHighlight(fileName, index) {
  if (confirm('Are you sure you want to delete this highlight?')) {
    chrome.storage.local.get(fileName, (result) => {
      const fileContent = result[fileName];
      fileContent.highlights.splice(index, 1);
      chrome.storage.local.set({ [fileName]: fileContent }, () => {
        console.log('Highlight deleted');
        showHighlights(fileName, fileContent);
      });
    });
  }
}
