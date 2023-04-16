import { API_BASE_URL, SIMULATOR_URL } from '../../../envConfig';
import { validateDownloadId } from '../../../src/helpers/utils';
const APP_VERSION = chrome.runtime.getManifest().version;

let tabId;

export async function storeSignature(request) {
  const res = await chrome.storage.sync.get(['downloadId']);
  const downloadId = res.downloadId || 'unknown';

  let api = `${API_BASE_URL}/signature`;
  const body = JSON.parse(request.data.body);
  body.downloadId = downloadId;
  request.data.body = JSON.stringify(body);

  try {
    const response = await fetch(api, request.data);

    if (!response.ok) {
      console.error('error storing signature response: ' + response);
      console.error(response);
    }
  } catch (error) {
    console.error('error storing signature');
    console.error(error);
  }
}

export async function closeExtension(request) {
  try {
    const res = await chrome.storage.sync.get(['simulationId', 'downloadId']);

    const simulationId = res.simulationId;
    const downloadId = res.downloadId;

    if (simulationId) {
      await chrome.storage.sync.set({ simulationId: undefined });
    }

    if (!downloadId) {
      // TODO: fetch new download id here
      downloadId = 'unknown';
    }

    let api = `${API_BASE_URL}/events`;

    let apiCall = { endpoint: '', body: {} };

    if (request['data']['type'] === 'COMPLETE_SIMULATION') {
      const newData = {
        ...request['data'],
        simulationId: simulationId,
        downloadId: downloadId,
        event: {
          name: 'CompleteSimulation',
          version: APP_VERSION,
        },
      };

      apiCall['endpoint'] = api + `/completeSimulation`;
      apiCall['body'] = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      };

      await fetch(apiCall['endpoint'], apiCall['body']);
    } else if (request['data']['type'] === 'CANCEL_SIMULATION') {
      await fetch(`${API_BASE_URL}/events/generic-event/${downloadId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'CancelSimulation',
          version: APP_VERSION,
          simulationId,
          downloadId,
          networdId: request['data']['networkId'] || undefined,
          sourceUrl: request['data']['sourceUrl'] || undefined,
        }),
      });
    }
  } catch (error) {
    console.error('error closing window: ' + error);
  }
}

export async function openExtension(sender, request) {
  tabId = sender.tab.id;
  //Handle case with no wallet popup (frame, etc.)
  if (request.data.walletProvider === 'Frame Wallet') {
    const window = await chrome.windows.getCurrent({});
    return await launchWindow(request, window.top, window.left);
  }
  //On request interceptions, always want to popup attached to the right side of the window
  if (
    ['MetaMask Wallet', 'Coinbase Wallet'].includes(
      request.data.walletProvider
    ) &&
    request.data.type === 'eth_sign'
  ) {
    const window = await chrome.windows.getCurrent({});
    //Ensures that even on an extended display we still popup in the correct location
    const leftWindowPlacement = Math.round(window.left + window.width - 375);
    return await launchWindow(request, window.top, leftWindowPlacement);
  }
  //If MM or coinbase wallet popup, we want to appear next to it
  else if (request.data.walletProvider === 'MetaMask Wallet') {
    //Need to add an extremely short delay to give the wallet popup a head start to avoid positioning issues
    setTimeout(async () => {
      const window = await chrome.windows.getCurrent({});
      //Ensures that even on an extended display we still popup in the correct location
      const leftWindowPlacement = Math.round(window.left + window.width - 735);
      return await launchWindow(request, window.top, leftWindowPlacement);
    }, 600);
  }
  //If MM or coinbase wallet popup, we want to appear next to it
  else if (request.data.walletProvider === 'Coinbase Wallet') {
    //Need to add an extremely short delay to give the wallet popup a head start to avoid positioning issues
    setTimeout(async () => {
      const window = await chrome.windows.getCurrent({});
      //Ensures that even on an extended display we still popup in the correct location
      const leftWindowPlacement = Math.round(window.left + window.width - 750);
      return await launchWindow(request, window.top, leftWindowPlacement);
    }, 600);
  } else {
    //If provider is none of the above just select a default location
    const window = await chrome.windows.getCurrent({});
    return await launchWindow(request, window.top, window.left);
  }
}

const launchWindow = async (request, top, left) => {
  const res = await chrome.storage.sync.get(['downloadId', 'downloadUrl']);
  let downloadId = res.downloadId || '';
  let downloadUrl = res.downloadUrl || '';

  if (!downloadId || downloadId === 'unknown') {
    try {
      const result = await fetch(`${API_BASE_URL}/events/refresh-download-id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldDownloadId: downloadId,
          oldDownloadUrl: downloadUrl,
          version: APP_VERSION,
        }),
      });
      if (!result?.ok) {
        console.error('error refreshing new download id: ' + result);
      } else {
        const newDownloadId = await result.text();
        if (validateDownloadId(newDownloadId)) {
          await chrome.storage.sync.set({ downloadId: newDownloadId });
          downloadId = newDownloadId;
        }
      }
    } catch (e) {
      console.error('Error caught: ', e);
    }
  }

  let api = `${SIMULATOR_URL}`;

  console.log('launchWindow: api has been set');
  console.log(api);
  const tab = await chrome.tabs.create({
    url: api,
    active: false,
  });

  const window = await chrome.windows.create({
    tabId: tab.id,
    type: 'popup',
    width: 375,
    height: 725,
    top: top,
    left: left,
  });

  let windowId = window.id;
  saveNewWindowId(windowId);
  if (request.data?.transaction) {
    const res = await chrome.storage.sync.get([
      'simulationCount',
      'viewedNotification',
    ]);

    let count = res.simulationCount ?? 0;
    count++;
    const viewedNotification = res.viewedNotification ?? false;

    if (!viewedNotification) {
      await chrome.storage.sync.set({ viewedNotification: false });
    }

    if (count >= 10 && !viewedNotification) {
      await chrome.action.setBadgeText({ text: '+1' });
      await chrome.action.setBadgeBackgroundColor({
        color: '#E1CFFF',
      });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }

    await chrome.storage.sync.set({ simulationCount: count });
    await chrome.storage.sync.set({ address: request.data.transaction.from });
  }

  try {
    const settings = await chrome.action.getUserSettings();

    let extensionPinned = 'unknown';
    const isOnToolbar = settings.isOnToolbar;
    extensionPinned = isOnToolbar ? 'pinned' : 'unpinned';

    const sendTx = () => {
      if (request.data) {
        request.data.downloadId = downloadId;
        request.data.downloadUrl = downloadUrl;
        request.data.extensionPinned = extensionPinned;
      }

      const txData = JSON.stringify(request);

      chrome.tabs.sendMessage(
        tab.id,
        { type: 'tx', data: txData },
        (response) => {
          if (chrome.runtime.lastError) {
            setTimeout(sendTx, 100);
          }
        }
      );
    };
    sendTx();
  } catch (e) {
    console.error('error caught: ', e);
  }

  return windowId;
};

const saveNewWindowId = async (windowId) => {
  const fireWindows = (await chrome.storage.sync.get(['FireWindows'])) ?? [];
  await chrome.storage.sync.set({
    FireWindows: !!fireWindows?.FireWindows?.length
      ? [...fireWindows.FireWindows, windowId]
      : [windowId],
  });
};

export const removeFireWindows = async () => {
  const fireWindows = await chrome.storage.sync.get(['FireWindows']);
  if (!!fireWindows?.FireWindows?.length) {
    fireWindows.FireWindows.forEach((element) => {
      chrome.windows.remove(element).catch((e) => {
        console.error('Error caught: ', e);
      });
    });
    chrome.storage.sync.set({
      FireWindows: [],
    });
  }
};
