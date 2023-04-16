console.log('eip-712 version:', 1);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.message.event === 'ice-signature-request') {
    console.log('signature data:', message.message.data);
  }
});
