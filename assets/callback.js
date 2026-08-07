(function () {
  const statusText = document.getElementById('statusText');
  const panelTitle = document.getElementById('panelTitle');
  const actionContainer = document.getElementById('actionContainer');
  const statusDot = document.getElementById('statusDot');
  const statusRoute = document.getElementById('statusRoute');
  const HOME_URL = 'https://rayzzz-lab.github.io/';

  const TOKEN_HASH_RE = /^[A-Za-z0-9._-]{1,512}$/;
  const TYPE_RE = /^[a-z_]{1,32}$/;

  const params = new URLSearchParams(window.location.search);
  const rawTokenHash = params.get('token_hash');
  const rawType = params.get('type');
  const isValidTokenHash = rawTokenHash !== null && TOKEN_HASH_RE.test(rawTokenHash);
  const isValidType = rawType !== null && TYPE_RE.test(rawType);

  history.replaceState(null, '', window.location.pathname);

  function showFinalState(title, message, ok) {
    if (panelTitle) panelTitle.textContent = title;
    if (statusText) statusText.textContent = message;
    if (statusDot) statusDot.className = ok ? 'dot live' : 'dot err';
    if (statusRoute) statusRoute.textContent = ok ? 'AUTH · LINK USED' : 'AUTH · INVALID';
    if (actionContainer) {
      actionContainer.innerHTML = '';

      const openAppLink = document.createElement('a');
      openAppLink.className = 'btn btn-primary';
      openAppLink.id = 'openAppLink';
      openAppLink.href = 'https://rayzzz-lab.github.io/callback?empty';
      openAppLink.textContent = 'Open the app';
      actionContainer.appendChild(openAppLink);

      const homeLink = document.createElement('a');
      homeLink.className = 'btn btn-secondary';
      homeLink.id = 'homeLink';
      homeLink.href = HOME_URL;
      homeLink.textContent = 'Go to Home Page';
      actionContainer.appendChild(homeLink);
    }
  }

  const NEEDS_APP_TITLE = 'App required';
  const NEEDS_APP_MSG =
    'The link was valid and has now been revoked. To finish signing in, open it from your device with the RaYzZzLab app installed. For your security this link can\u2019t be used again \u2014 please request a new one from the app.';

  const EXPIRED_TITLE = 'Link no longer valid';
  const EXPIRED_MSG =
    'This link has already expired or been used before. Please request a new link and open it from a device with the RaYzZzLab app installed.';

  const NO_TOKEN_TITLE = 'Link not recognized';
  const NO_TOKEN_MSG =
    'No valid authentication link was found. If you followed a link from your email, please install the RaYzZzLab app and try again.';

  const GENERIC_ERROR_TITLE = 'Something went wrong';
  const GENERIC_ERROR_MSG =
    'We couldn\u2019t verify this link. Please request a new one and open it from a device with the RaYzZzLab app installed.';

  if (!isValidTokenHash || !isValidType) {
    showFinalState(NO_TOKEN_TITLE, NO_TOKEN_MSG, false);
    return;
  }

  if (typeof window.supabase === 'undefined' || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    showFinalState(GENERIC_ERROR_TITLE, GENERIC_ERROR_MSG, false);
    return;
  }

  const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  client.auth
    .verifyOtp({ token_hash: rawTokenHash, type: rawType })
    .then(({ error }) => {
      if (error) {
        if (error.code === 'otp_expired') {
          showFinalState(EXPIRED_TITLE, EXPIRED_MSG, false);
        } else {
          showFinalState(GENERIC_ERROR_TITLE, GENERIC_ERROR_MSG, false);
        }
        return;
      }
      client.auth.signOut().finally(() => {
        showFinalState(NEEDS_APP_TITLE, NEEDS_APP_MSG, true);
      });
    })
    .catch(() => {
      showFinalState(GENERIC_ERROR_TITLE, GENERIC_ERROR_MSG, false);
    });
})();
