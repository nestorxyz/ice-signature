async function init() {
  window.addEventListener('message', (event) => {
    const { data } = event;

    if (data.target === 'metamask-contentscript') {
      const metamaskData = data.data;

      if (metamaskData.data.params && metamaskData.data.params.length > 0) {
        console.log('Inject capture:', metamaskData);
        /* chrome.runtime.sendMessage({
          message: {
            event: 'signature-request',
            data: metamaskData.data,
          },
        }); */
      }
    }
  });
}

init();
