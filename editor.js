document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const fileName = urlParams.get('file');
  const fileNameElement = document.getElementById('fileName');
  const fileContentElement = document.getElementById('fileContent');
  const saveButton = document.getElementById('saveButton');
  const exportButton = document.getElementById('exportButton');

  fileNameElement.textContent = fileName;

  // Load file content
  chrome.storage.local.get(fileName, function(result) {
    const fileContent = result[fileName];
    if (fileContent) {
      fileContentElement.value = fileContent.highlights.join('\n');
    }
  });

  // Save file content
  saveButton.addEventListener('click', function() {
    const newContent = fileContentElement.value;
    const saveObj = {};
    saveObj[fileName] = {
      url: result[fileName].url,
      highlights: newContent.split('\n')
    };
    chrome.storage.local.set(saveObj, function() {
      alert('File saved successfully!');
    });
  });

  // Export as PDF
  exportButton.addEventListener('click', function() {
    const content = fileContentElement.value;
    const blob = new Blob([content], {type: 'application/pdf'});
    const url = URL.createObjectURL(blob);
    
    chrome.downloads.download({
      url: url,
      filename: `${fileName}.pdf`,
      saveAs: true
    });
  });
});
