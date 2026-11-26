export const AUTH_TOKEN_KEY = 'quizboard-google-id-token';
export const AUTH_SESSION_EXPIRED_EVENT = 'quizboard-auth-session-expired';

export function expireAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
}
