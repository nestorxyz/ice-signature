console.log('eip-712 version:', 1);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received from the content script:', message);
  if (message.event === 'ice-signature-request') {
    console.log('Message received from the content script:', message);
  }
});
