export const SITE_ORIGIN = "https://www.toonranks.com";

export const APP_SCHEME = "toonranks";
export const MOBILE_AUTH_CALLBACK_URL = `${APP_SCHEME}://auth/callback`;

function buildWebAuthUrl(path: string) {
  const encodedRedirect = encodeURIComponent(MOBILE_AUTH_CALLBACK_URL);
  return `${SITE_ORIGIN}${path}?mobile=1&redirect_uri=${encodedRedirect}`;
}

export const WEB_AUTH_URLS = {
  login: buildWebAuthUrl("/login"),
  signup: buildWebAuthUrl("/signup"),
};

export const LEGAL_URLS = {
  terms: `${SITE_ORIGIN}/terms`,
  privacy: `${SITE_ORIGIN}/privacy`,
};

export const SUPPORT_EMAIL = "trulyepickstudios@gmail.com";
