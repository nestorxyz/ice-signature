console.log('eip-712 version:', 1);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.event === 'ice-signature-request') {
    const signatureData = message.data;

    chrome.windows.create(
      {
        url: chrome.runtime.getURL('index.html'),
        type: 'popup',
        width: 400,
        height: 600,
      },
      () => {
        chrome.runtime.sendMessage({
          event: 'aice-signature-data',
          data: signatureData,
        });
      }
    );
  }
});
