export const SITE_ORIGIN = "https://www.toonranks.com";

export const APP_SCHEME = "toonranks";
export const MOBILE_AUTH_CALLBACK_URL = `${APP_SCHEME}://auth/callback`;

export function buildWebAuthUrl(path: string, state?: string) {
  const params = new URLSearchParams({
    mobile: "1",
    redirect_uri: MOBILE_AUTH_CALLBACK_URL,
  });

  if (state) {
    params.set("state", state);
  }

  return `${SITE_ORIGIN}${path}?${params.toString()}`;
}

export const WEB_AUTH_URLS = {
  login: (state?: string) => buildWebAuthUrl("/login", state),
  signup: (state?: string) => buildWebAuthUrl("/signup", state),
  forgotPassword: `${SITE_ORIGIN}/forgot-password`,
};

export const LEGAL_URLS = {
  terms: `${SITE_ORIGIN}/terms`,
  privacy: `${SITE_ORIGIN}/privacy`,
};

export const SUPPORT_EMAIL = "trulyepickstudios@gmail.com";
