import { AUTH_KEY, APP_PASSWORD } from './constants.js';
import { $ } from './utils.js';

export function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === APP_PASSWORD;
}

export function authenticate(password) {
  if (password === APP_PASSWORD) {
    localStorage.setItem(AUTH_KEY, APP_PASSWORD);
    return true;
  }
  return false;
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
  showLoginOverlay();
}

export function showLoginOverlay() {
  const overlay = $("loginOverlay");
  if (overlay) overlay.style.display = "flex";
  const app = $("appContainer");
  if (app) app.style.display = "none";
}

export function hideLoginOverlay() {
  const overlay = $("loginOverlay");
  if (overlay) overlay.style.display = "none";
  const app = $("appContainer");
  if (app) app.style.display = "flex";
}

export function initAuth() {
  if (isAuthenticated()) {
    hideLoginOverlay();
    return true;
  }
  showLoginOverlay();
  const btnLogin = $("btnLogin");
  const pwInput = $("loginPassword");
  const errEl = $("loginError");

  function doLogin() {
    const pw = pwInput.value;
    if (authenticate(pw)) {
      hideLoginOverlay();
      errEl.style.display = "none";
    } else {
      errEl.style.display = "block";
      pwInput.value = "";
      pwInput.focus();
    }
  }

  btnLogin.addEventListener("click", doLogin);
  pwInput.addEventListener("keydown", e => {
    if (e.key === "Enter") doLogin();
  });

  return false;
}
