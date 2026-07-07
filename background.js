const browserAPI = typeof browser !== 'undefined' && browser.runtime ? browser : chrome;

const DOMAINS = ['1secmail.com', '1secmail.org', '1secmail.net', 'zzzmail.com', 'mailkarlew.com', 'bestmail247.com'];
const API_BASE = 'https://www.1secmail.com/api/v1';

let activeAddresses = [];
let inboxCache = {};
let pollingIntervals = {};

function runtimeSend(message) {
  if (typeof browser !== 'undefined' && browser.runtime && browserAPI === browser) {
    return browser.runtime.sendMessage(message);
  }
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      const err = chrome.runtime.lastError;
      if (err) reject(new Error(err.message));
      else resolve(response);
    });
  });
}

function randomStr(length) {
  const c = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let r = '';
  for (let i = 0; i < length; i++) r += c[Math.floor(Math.random() * c.length)];
  return r;
}

async function generateAddress() {
  const login = randomStr(10);
  const domain = DOMAINS[Math.floor(Math.random() * DOMAINS.length)];
  const address = `${login}@${domain}`;
  activeAddresses.unshift(address);
  if (activeAddresses.length > 10) activeAddresses.pop();
  await browserAPI.storage.local.set({ activeAddresses, lastAddress: address });
  startPolling(address);
  return address;
}

async function checkInbox(address) {
  const [login, domain] = address.split('@');
  try {
    const res = await fetch(`${API_BASE}/?action=getMessages&login=${login}&domain=${domain}`);
    if (!res.ok) return [];
    const messages = await res.json();
    inboxCache[address] = messages;
    return messages;
  } catch {
    return inboxCache[address] || [];
  }
}

async function readMessage(address, id) {
  const [login, domain] = address.split('@');
  try {
    const res = await fetch(`${API_BASE}/?action=readMessage&login=${login}&domain=${domain}&id=${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function deleteAddress(address) {
  const [login, domain] = address.split('@');
  try {
    await fetch(`${API_BASE}/?action=deleteMailbox&login=${login}&domain=${domain}`);
  } catch {}
  stopPolling(address);
  activeAddresses = activeAddresses.filter(a => a !== address);
  delete inboxCache[address];
  await browserAPI.storage.local.set({ activeAddresses });
}

function startPolling(address) {
  stopPolling(address);
  pollingIntervals[address] = setInterval(async () => {
    const before = (inboxCache[address] || []).length;
    await checkInbox(address);
    const after = (inboxCache[address] || []).length;
    if (after > before) {
      runtimeSend({ action: 'mail:newMessage', address, count: after - before });
    }
  }, 15000);
}

function stopPolling(address) {
  if (pollingIntervals[address]) {
    clearInterval(pollingIntervals[address]);
    delete pollingIntervals[address];
  }
}

browserAPI.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.action) {
    case 'mail:generate':
      generateAddress().then(addr => sendResponse({ address: addr }));
      return true;
    case 'mail:list':
      sendResponse({ addresses: activeAddresses, domains: DOMAINS });
      break;
    case 'mail:checkInbox':
      checkInbox(msg.address).then(msgs => sendResponse({ messages: msgs }));
      return true;
    case 'mail:readMessage':
      readMessage(msg.address, msg.id).then(data => sendResponse({ message: data }));
      return true;
    case 'mail:delete':
      deleteAddress(msg.address).then(() => sendResponse({ ok: true }));
      return true;
    case 'mail:getCache':
      sendResponse({ cache: inboxCache[msg.address] || [] });
      break;
  }
});

browserAPI.storage.local.get(['activeAddresses', 'lastAddress'], (data) => {
  if (data.activeAddresses) activeAddresses = data.activeAddresses;
  activeAddresses.forEach(a => startPolling(a));
});

browserAPI.contextMenus.create({
  id: 'zephyr-gen-email',
  title: 'Zephyr Mail : générer un email jetable',
  contexts: ['editable']
});

browserAPI.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'zephyr-gen-email') {
    generateAddress().then(addr => {
      runtimeSend({ action: 'mail:fillField', address: addr, tabId: tab.id });
    });
  }
});