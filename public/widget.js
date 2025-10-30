(function () {
  function createIframe(host, tenant) {
    const iframe = document.createElement('iframe');
    iframe.src = `${host.replace(/\/$/, '')}/${tenant}`;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';
    iframe.allow = 'fullscreen';
    return iframe;
  }

  window.ClubMenuWidget = function ClubMenuWidget(opts) {
    if (!opts || !opts.host || !opts.tenant || !opts.elId) {
      throw new Error('ClubMenuWidget requires host, tenant, and elId options.');
    }

    const container = document.getElementById(opts.elId);
    if (!container) {
      throw new Error(`ClubMenuWidget could not find element with id "${opts.elId}".`);
    }

    const iframe = createIframe(opts.host, opts.tenant);
    container.innerHTML = '';
    container.appendChild(iframe);
  };
})();


