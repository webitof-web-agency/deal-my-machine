function escapeForTemplate(value) {
  return JSON.stringify(String(value || ""));
}

export function buildFcmSyncScript({ apiBaseUrl, fcmToken }) {
  const safeApiBaseUrl = escapeForTemplate(apiBaseUrl);
  const safeFcmToken = escapeForTemplate(fcmToken);

  return `
    (function () {
      try {
        var config = window.__dealmymachineFcmConfig || {};
        config.apiBaseUrl = ${safeApiBaseUrl};
        config.fcmToken = ${safeFcmToken};
        window.__dealmymachineFcmConfig = config;

        if (!window.__dealmymachineFcmRegister) {
          window.__dealmymachineFcmRegister = async function () {
            try {
              var currentConfig = window.__dealmymachineFcmConfig || {};
              var apiBaseUrl = currentConfig.apiBaseUrl || "";
              var fcmToken = currentConfig.fcmToken || "";
              if (!apiBaseUrl || !fcmToken) {
                return;
              }

              var authToken = window.localStorage ? (window.localStorage.getItem("frontend_portal_token") || "") : "";
              if (!authToken) {
                window.__dealmymachineFcmLastSynced = null;
                window.__dealmymachineFcmLastSyncedUserToken = null;
                return;
              }

              if (window.__dealmymachineFcmLastSynced === fcmToken && window.__dealmymachineFcmLastSyncedUserToken === authToken) {
                return;
              }

              await fetch(apiBaseUrl.replace(/\\/$/, "") + "/api/users/fcm-token", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + authToken
                },
                body: JSON.stringify({ token: fcmToken })
              });

              window.__dealmymachineFcmLastSynced = fcmToken;
              window.__dealmymachineFcmLastSyncedUserToken = authToken;
            } catch (error) {
              console.warn("FCM token sync failed", error);
            }
          };
        }

        if (!window.__dealmymachineFcmListenerInstalled) {
          window.__dealmymachineFcmListenerInstalled = true;
          window.addEventListener("dealmymachine-auth-change", function () {
            window.__dealmymachineFcmRegister();
          });
          window.addEventListener("serviceportal-auth-change", function () {
            window.__dealmymachineFcmRegister();
          });
          // Keep listening for the legacy event while older web builds are still deployed.
          window.addEventListener("jcbexchange-auth-change", function () {
            window.__dealmymachineFcmRegister();
          });
        }

        window.__dealmymachineFcmRegister();
      } catch (error) {
        console.warn("FCM bridge injection failed", error);
      }
    })();
    true;
  `;
}
