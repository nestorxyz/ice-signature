console.log('eip-712 version:', 1);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.message.event === 'ice-signature-request') {
    console.log('signature data:', message.message.data);
    chrome.windows.create({
      url: chrome.runtime.getURL('index.html'),
      type: 'popup',
      width: 400,
      height: 600,
    });
  }
});
