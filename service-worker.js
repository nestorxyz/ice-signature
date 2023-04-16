console.log('eip-712 version:', 1);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.event === 'ice-signature-request') {
    const signatureData = message.data;
    const encodedData = encodeURIComponent(JSON.stringify(signatureData));

    chrome.windows.create({
      url: chrome.runtime.getURL('index.html') + `?data=${encodedData}`,
      type: 'popup',
      width: 400,
      height: 600,
    });
  }
});
