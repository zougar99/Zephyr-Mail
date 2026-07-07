const browserAPI = typeof browser !== 'undefined' && browser.runtime ? browser : chrome;

let activePopups = [];

function isEmailField(el) {
  const t = (el.type || '').toLowerCase();
  const n = (el.tagName || '').toLowerCase();
  const a = (el.getAttribute('autocomplete') || '').toLowerCase();
  return (n === 'input' && (t === 'email' || t === 'text' || t === 'search')) ||
         n === 'textarea' ||
         a === 'email';
}

document.addEventListener('focusin', (e) => {
  const el = e.target;
  if (!isEmailField(el)) return;

  const existing = el.parentElement.querySelector('.zephyr-inject-btn');
  if (existing) return;

  const btn = document.createElement('button');
  btn.className = 'zephyr-inject-btn';
  btn.title = 'Zephyr Mail : email jetable';
  btn.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14"><path fill="currentColor" d="M1 3v10l7-5 7 5V3H1zm1 1h12v7.5L8 7 2 11.5V4z"/><circle fill="currentColor" cx="13" cy="8" r="2.5" opacity=".7"/></svg>';
  btn.style.cssText = 'position:absolute;right:4px;top:50%;transform:translateY(-50%);border:none;background:rgba(79,195,247,0.15);border-radius:4px;padding:3px 6px;cursor:pointer;z-index:2147483647;display:flex;align-items:center;gap:4px;font-size:11px;color:#4FC3F7;';
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.innerHTML = '...';

    const parent = el.parentElement;
    if (getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }

    try {
      const resp = await browserAPI.runtime.sendMessage({ action: 'mail:generate' });
      if (resp && resp.address) {
        el.value = resp.address;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.style.outline = '2px solid #4FC3F7';
        el.style.outlineOffset = '1px';
        setTimeout(() => { el.style.outline = ''; }, 2000);

        const toast = document.createElement('div');
        toast.textContent = `✓ ${resp.address}`;
        toast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#1a1a2e;color:#4FC3F7;padding:10px 18px;border-radius:8px;font-size:13px;z-index:2147483647;box-shadow:0 4px 20px rgba(0,0,0,0.3);border:1px solid rgba(79,195,247,0.3);max-width:300px;word-break:break-all;animation:zephyrFadeIn 0.3s ease;';
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.5s'; setTimeout(() => toast.remove(), 500); }, 3000);
      }
    } catch {}
    btn.disabled = false;
    btn.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14"><path fill="currentColor" d="M1 3v10l7-5 7 5V3H1zm1 1h12v7.5L8 7 2 11.5V4z"/><circle fill="currentColor" cx="13" cy="8" r="2.5" opacity=".7"/></svg>';
  });

  if (getComputedStyle(el.parentElement).position === 'static') {
    el.parentElement.style.position = 'relative';
  }
  el.parentElement.appendChild(btn);
});

document.addEventListener('focusout', (e) => {
  setTimeout(() => {
    const el = e.target;
    if (!el || !el.parentElement) return;
    const btn = el.parentElement.querySelector('.zephyr-inject-btn');
    if (btn && document.activeElement !== btn) {
      btn.remove();
    }
  }, 200);
});

browserAPI.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'mail:fillField') {
    const el = document.activeElement;
    if (el && isEmailField(el)) {
      el.value = msg.address;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
});

const style = document.createElement('style');
style.textContent = `
@keyframes zephyrFadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
.zephyr-inject-btn:hover { background:rgba(79,195,247,0.25) !important; }
.zephyr-inject-btn:active { background:rgba(79,195,247,0.35) !important; }
`;
document.head.appendChild(style);