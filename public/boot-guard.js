/*
 * Boot guard — if the app hasn't rendered after 15 s (a script blocked by an
 * extension, a failed chunk download, a network drop), replace the endless
 * splash with an explanation and a Reload button.
 * Plain classic script in /public so it runs even when the module graph fails,
 * and stays CSP-compliant (script-src 'self'; no inline JS).
 */
(function () {
  var TIMEOUT_MS = 15000;
  setTimeout(function () {
    var root = document.getElementById('root');
    var loader = document.getElementById('initial-loader');
    if (!loader || (root && root.childElementCount > 0)) return;

    var box = document.createElement('div');
    box.setAttribute('role', 'alert');
    box.style.cssText = 'margin-top:28px;max-width:340px;text-align:center;font:500 14px/1.5 system-ui,sans-serif;color:#5A4F55;padding:0 16px';
    box.innerHTML =
      '<p style="margin:0 0 14px">The site is taking longer than usual to load. ' +
      'A browser extension (such as an ad blocker) or a slow connection may be blocking it.</p>';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Reload';
    btn.style.cssText = 'height:44px;padding:0 28px;border:0;border-radius:9999px;background:#C9038A;color:#fff;font:600 14px system-ui,sans-serif;cursor:pointer';
    btn.addEventListener('click', function () { location.reload(); });
    box.appendChild(btn);

    var content = loader.querySelector('.loader-content') || loader;
    content.appendChild(box);
  }, TIMEOUT_MS);
})();
