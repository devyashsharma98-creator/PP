// Unregister stale service workers before hydration to prevent cached HTML mismatches
(function () {
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      return Promise.all(regs.map(function (r) { return r.unregister(); }));
    }).then(function () {
      if (navigator.serviceWorker.controller) {
        window.location.reload();
      }
    });
  }
})();
