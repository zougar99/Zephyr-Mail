const browserAPI = typeof browser !== 'undefined' && browser.runtime ? browser : chrome;

let state = {
  addresses: [],
  domains: [],
  currentAddress: null,
  messages: [],
  settings: { notify: true, autogen: true, interval: 15 }
};

async function runtimeSend(msg) {
  if (typeof browser !== 'undefined' && browser.runtime && browserAPI === browser) {
    return browser.runtime.sendMessage(msg);
  }
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (r) => {
      const e = chrome.runtime.lastError;
      if (e) reject(new Error(e.message));
      else resolve(r);
    });
  });
}

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

// Tabs
$$('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    $$('.tab').forEach(t => t.classList.remove('active'));
    $$('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const panel = document.getElementById(`panel-${tab.dataset.tab}`);
    if (panel) panel.classList.add('active');
  });
});

// Populate domains
async function loadDomains() {
  try {
    const resp = await runtimeSend({ action: 'mail:list' });
    if (resp) {
      state.domains = resp.domains || [];
      state.addresses = resp.addresses || [];
      populateDomainSelects();
      renderAddressChips();
      renderActiveList();
    }
  } catch {}
}

function populateDomainSelects() {
  const selects = ['#gen-domain', '#alias-domain'];
  selects.forEach(sel => {
    const select = document.querySelector(sel);
    if (!select) return;
    select.innerHTML = state.domains.map(d => `<option value="${d}">${d}</option>`).join('');
  });
}

// Address chips
function renderAddressChips() {
  const bar = $('#address-selector');
  if (!bar) return;
  if (!state.addresses.length) {
    bar.innerHTML = '<span style="font-size:11px;color:#667;padding:4px 0">Aucune adresse active</span>';
    state.currentAddress = null;
    return;
  }
  bar.innerHTML = state.addresses.map(a =>
    `<span class="addr-chip${state.currentAddress === a ? ' active' : ''}" data-addr="${a}">
      ${a}
      <button class="del-addr" data-addr="${a}">&times;</button>
    </span>`
  ).join('');

  if (!state.currentAddress && state.addresses.length) {
    state.currentAddress = state.addresses[0];
  }

  bar.querySelectorAll('.addr-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      if (e.target.classList.contains('del-addr')) return;
      state.currentAddress = chip.dataset.addr;
      renderAddressChips();
      loadMessages();
    });
  });
  bar.querySelectorAll('.del-addr').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const addr = btn.dataset.addr;
      await runtimeSend({ action: 'mail:delete', address: addr });
      state.addresses = state.addresses.filter(a => a !== addr);
      if (state.currentAddress === addr) state.currentAddress = state.addresses[0] || null;
      renderAddressChips();
      renderActiveList();
      loadMessages();
    });
  });
}

// Messages
async function loadMessages() {
  const list = $('#message-list');
  if (!list) return;
  if (!state.currentAddress) {
    list.innerHTML = `<div class="empty-state"><p>Aucune adresse sélectionnée</p></div>`;
    return;
  }
  try {
    const resp = await runtimeSend({ action: 'mail:checkInbox', address: state.currentAddress });
    state.messages = (resp && resp.messages) || [];
    if (!state.messages.length) {
      list.innerHTML = `<div class="empty-state"><svg viewBox="0 0 48 48" width="48" height="48"><path fill="#4FC3F7" opacity=".3" d="M4 8v32l20-12 20 12V8H4zm3 3h34v24L24 25 7 35V11z"/></svg><p>Boîte vide</p><span>En attente de nouveaux messages...</span></div>`;
      return;
    }
    list.innerHTML = state.messages.map(m =>
      `<div class="msg-card" data-id="${m.id}">
        <div class="msg-from">${escHtml(m.from || 'Inconnu')}</div>
        <div class="msg-subj">${escHtml(m.subject || '(Sans objet)')}</div>
        <div class="msg-date">${m.date || ''}</div>
      </div>`
    ).join('');
    list.querySelectorAll('.msg-card').forEach(card => {
      card.addEventListener('click', () => showMessage(card.dataset.id));
    });
  } catch {
    list.innerHTML = `<div class="empty-state"><p>Erreur de chargement</p></div>`;
  }
}

function escHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

async function showMessage(id) {
  if (!state.currentAddress) return;
  const list = $('#message-list');
  list.innerHTML = '<div class="empty-state"><span>Chargement...</span></div>';
  try {
    const resp = await runtimeSend({ action: 'mail:readMessage', address: state.currentAddress, id: parseInt(id) });
    const msg = resp && resp.message;
    if (!msg) {
      list.innerHTML = '<div class="empty-state"><p>Message non trouvé</p></div>';
      return;
    }
    const body = msg.htmlBody || msg.textBody || '';
    const isHtml = !!msg.htmlBody;
    list.innerHTML = `
      <button class="btn-small back-btn" id="back-inbox">
        <svg viewBox="0 0 16 16" width="12" height="12"><path fill="currentColor" d="M7 1L1 8l6 7V9h8V7H7V1z"/></svg>
        Retour
      </button>
      <div class="msg-detail">
        <div class="msg-header">
          <strong>De : ${escHtml(msg.from || '')}</strong>
          <span>Sujet : ${escHtml(msg.subject || '')}</span>
          <span>Date : ${msg.date || ''}</span>
        </div>
        <div class="msg-body">${isHtml ? body : escHtml(body)}</div>
      </div>
    `;
    $('#back-inbox').addEventListener('click', loadMessages);
  } catch {
    list.innerHTML = '<div class="empty-state"><p>Erreur</p></div>';
  }
}

// Refresh
$('#refresh-inbox')?.addEventListener('click', loadMessages);

// Generate random
$('#gen-random')?.addEventListener('click', async () => {
  const btn = $('#gen-random');
  btn.disabled = true;
  btn.textContent = '...';
  try {
    const resp = await runtimeSend({ action: 'mail:generate' });
    if (resp && resp.address) {
      showResult(resp.address);
      state.addresses.unshift(resp.address);
      state.currentAddress = resp.address;
      renderAddressChips();
      renderActiveList();
      loadMessages();
    }
  } catch {}
  btn.disabled = false;
  btn.innerHTML = '<svg viewBox="0 0 16 16" width="16" height="16"><path fill="currentColor" d="M8 1v6h6v2H8v6H6V9H0V7h6V1h2z"/></svg> Aléatoire';
});

// Generate custom
$('#gen-custom-btn')?.addEventListener('click', async () => {
  const login = $('#gen-login').value.trim().toLowerCase();
  if (!login || login.length < 3) {
    $('#gen-login').style.borderColor = '#ef5350';
    setTimeout(() => { $('#gen-login').style.borderColor = ''; }, 2000);
    return;
  }
  const domain = $('#gen-domain').value;
  const address = `${login}@${domain}`;
  await runtimeSend({ action: 'mail:addAddress', address });
  state.addresses.unshift(address);
  state.currentAddress = address;
  showResult(address);
  renderAddressChips();
  renderActiveList();
  loadMessages();
});

function showResult(addr) {
  const el = $('#gen-result');
  el.classList.remove('hidden');
  $('#result-addr').textContent = addr;
}

$('#copy-addr')?.addEventListener('click', async () => {
  const addr = $('#result-addr').textContent;
  try {
    await navigator.clipboard.writeText(addr);
    const btn = $('#copy-addr');
    const orig = btn.innerHTML;
    btn.innerHTML = '✓ Copié';
    setTimeout(() => { btn.innerHTML = orig; }, 1500);
  } catch {}
});

$('#use-tab')?.addEventListener('click', async () => {
  const addr = $('#result-addr').textContent;
  try {
    const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
    if (tabs && tabs[0]) {
      await browserAPI.tabs.sendMessage(tabs[0].id, { action: 'mail:fillField', address: addr });
      window.close();
    }
  } catch {}
});

// Active list in generate panel
function renderActiveList() {
  const list = $('#active-list');
  if (!list) return;
  if (!state.addresses.length) {
    list.innerHTML = '<span style="font-size:11px;color:#667">Aucune adresse active</span>';
    return;
  }
  list.innerHTML = state.addresses.map(a =>
    `<div class="active-item">
      <span>${a}</span>
      <button class="del-btn" data-addr="${a}">&times;</button>
    </div>`
  ).join('');
  list.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const addr = btn.dataset.addr;
      await runtimeSend({ action: 'mail:delete', address: addr });
      state.addresses = state.addresses.filter(a => a !== addr);
      if (state.currentAddress === addr) state.currentAddress = state.addresses[0] || null;
      renderAddressChips();
      renderActiveList();
      loadMessages();
    });
  });
}

// Alias tab
$('#gen-alias-btn')?.addEventListener('click', async () => {
  const prefix = $('#alias-prefix').value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (!prefix) {
    $('#alias-prefix').style.borderColor = '#ef5350';
    setTimeout(() => { $('#alias-prefix').style.borderColor = ''; }, 2000);
    return;
  }
  const domain = $('#alias-domain').value;
  const alias = `${prefix}+zephyr@${domain}`;
  const el = $('#alias-result');
  el.classList.remove('hidden');
  el.innerHTML = `
    <div class="result-addr">${alias}</div>
    <button class="btn-small copy-alias-btn">
      <svg viewBox="0 0 16 16" width="14" height="14"><path fill="currentColor" d="M4 1v3H1v11h11v-3h3V1H4zm2 2h7v7h-2V5H6V3zM3 6h7v7H3V6z"/></svg>
      Copier
    </button>
    <button class="btn-small use-alias-btn">
      <svg viewBox="0 0 16 16" width="14" height="14"><path fill="currentColor" d="M1 3v12h12V3H1zm2 2h8v8H3V5zm11-4v12h-1V4H3V3h11v-1z"/></svg>
      Utiliser
    </button>
  `;
  const copyHandler = async () => {
    try {
      await navigator.clipboard.writeText(alias);
      const btn = el.querySelector('.copy-alias-btn');
      btn.textContent = '✓ Copié';
      setTimeout(() => { btn.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14"><path fill="currentColor" d="M4 1v3H1v11h11v-3h3V1H4zm2 2h7v7h-2V5H6V3zM3 6h7v7H3V6z"/></svg> Copier'; }, 1500);
    } catch {}
  };
  el.querySelector('.copy-alias-btn')?.addEventListener('click', copyHandler);
  el.querySelector('.use-alias-btn')?.addEventListener('click', async () => {
    try {
      const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
      if (tabs && tabs[0]) {
        await browserAPI.tabs.sendMessage(tabs[0].id, { action: 'mail:fillField', address: alias });
        window.close();
      }
    } catch {}
  });
});

// Settings
async function loadSettings() {
  try {
    const data = await browserAPI.storage.local.get(['settings']);
    if (data.settings) state.settings = { ...state.settings, ...data.settings };
  } catch {}
  $('#set-notify').checked = state.settings.notify;
  $('#set-autogen').checked = state.settings.autogen;
  $('#set-interval').value = state.settings.interval;
}

$('#set-notify')?.addEventListener('change', async (e) => {
  state.settings.notify = e.target.checked;
  await browserAPI.storage.local.set({ settings: state.settings });
});
$('#set-autogen')?.addEventListener('change', async (e) => {
  state.settings.autogen = e.target.checked;
  await browserAPI.storage.local.set({ settings: state.settings });
});
$('#set-interval')?.addEventListener('change', async (e) => {
  const v = Math.max(5, Math.min(120, parseInt(e.target.value) || 15));
  state.settings.interval = v;
  e.target.value = v;
  await browserAPI.storage.local.set({ settings: state.settings });
});

// Init
async function init() {
  await loadDomains();
  await loadSettings();
  if (state.currentAddress) loadMessages();
}

document.addEventListener('DOMContentLoaded', init);