document.addEventListener('DOMContentLoaded', () => {
  const stats = document.getElementById('live-stats');
  if (stats) {
    const render = (data) => {
      stats.innerHTML = `
        <div><strong>${data.listings}</strong><span>active listings</span></div>
        <div><strong>${data.online}</strong><span>live visitors</span></div>
        <div><strong>${data.interested}</strong><span>interest signals</span></div>
        <div><strong>${data.messages}</strong><span>private messages</span></div>
      `;
    };
    const tick = async () => {
      try {
        const res = await fetch('/api/stats', { cache: 'no-store' });
        if (!res.ok) return;
        render(await res.json());
      } catch (err) {
        stats.innerHTML = '<span>Live stats unavailable.</span>';
      }
    };
    tick();
    setInterval(tick, 15000);
  }


  const shareButtons = document.querySelectorAll('[data-share-page]');
  shareButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const url = button.dataset.shareUrl || window.location.href;
      const title = document.title || 'River Homes';
      try {
        if (navigator.share) {
          await navigator.share({ title, url });
          return;
        }
      } catch (_) {}
      try {
        await navigator.clipboard.writeText(url);
        button.textContent = 'Link copied';
        setTimeout(() => { button.textContent = 'Share'; }, 1800);
      } catch (_) {
        window.prompt('Copy this link:', url);
      }
    });
  });

  const form = document.querySelector('form[data-cache-form]');
  if (form) {
    const key = `river-homes:${location.pathname}`;
    const inputs = [...form.querySelectorAll('input[name], textarea[name], select[name]')];
    const save = () => {
      const payload = {};
      inputs.forEach(el => {
        if (el.type === 'file') return;
        payload[el.name] = el.type === 'checkbox' ? el.checked : el.value;
      });
      try { localStorage.setItem(key, JSON.stringify(payload)); } catch (_) {}
    };

    try {
      const cached = JSON.parse(localStorage.getItem(key) || '{}');
      inputs.forEach(el => {
        if (el.type === 'file') return;
        if (cached[el.name] !== undefined && (el.type === 'checkbox' ? !el.checked : el.value === '')) {
          if (el.type === 'checkbox') el.checked = !!cached[el.name];
          else el.value = cached[el.name];
        }
      });
    } catch (_) {}

    inputs.forEach(el => {
      el.addEventListener('input', save);
      el.addEventListener('change', save);
    });

    form.addEventListener('submit', () => {
      try { localStorage.removeItem(key); } catch (_) {}
    });

    const fileInput = form.querySelector('input[type="file"]');
    if (fileInput) {
      const previewId = fileInput.dataset.previewTarget;
      const preview = previewId ? document.getElementById(previewId) : null;
      fileInput.addEventListener('change', () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file || !preview) return;
        const reader = new FileReader();
        reader.onload = () => {
          preview.innerHTML = `<img src="${reader.result}" alt="Upload preview" style="max-width:100%;border-radius:18px;border:1px solid #e5ebf2;"><p class="muted">Local preview only. The image uploads when you publish.</p>`;
        };
        reader.readAsDataURL(file);
      });
    }
  }
});


if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
