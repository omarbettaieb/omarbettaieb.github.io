/* Portfolio analytics — GA4 measurement is enabled only after visitor consent.
   Basic consent mode: no Google script or analytics request is loaded before opt-in.
   Ads personalization and ads storage remain disabled. */
(() => {
  'use strict';
  const GA4_MEASUREMENT_ID = 'G-GFR5C7VZW3';
  const STORAGE_KEY = 'ob_portfolio_analytics_consent_v1';
  if (!/^G-[A-Z0-9]{6,}$/i.test(GA4_MEASUREMENT_ID)) return;

  let consent = null;
  let tagLoaded = false;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'granted' || saved === 'denied') consent = saved;
  } catch (_) {}

  const words = {
    en: {
      title: 'Optional website analytics',
      description: 'If you agree, Google Analytics will measure visits and clicks on case studies, CV downloads and contact links. Google receives usage information. No advertising personalization. You can change your choice anytime.',
      accept: 'Accept analytics',
      reject: 'Reject',
      settings: 'Analytics settings',
      privacy: 'Privacy details',
      dialog: 'Analytics privacy choices'
    },
    fr: {
      title: 'Mesure d’audience facultative',
      description: 'Avec votre accord, Google Analytics mesurera les visites et les clics sur les projets, CV et liens de contact. Google reçoit des informations d’usage. Pas de personnalisation publicitaire. Vous pouvez modifier votre choix à tout moment.',
      accept: 'Accepter',
      reject: 'Refuser',
      settings: 'Paramètres de mesure',
      privacy: 'Confidentialité',
      dialog: 'Choix de confidentialité'
    }
  };
  const language = () => document.documentElement.lang === 'fr' ? 'fr' : 'en';
  const t = key => words[language()][key];
  let banner, footerButton;
  function gtag() { window.dataLayer.push(arguments); }
  function loadTag() {
    if (tagLoaded || consent !== 'granted') return;
    tagLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = gtag;
    gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    gtag('js', new Date());
    gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    gtag('config', GA4_MEASUREMENT_ID, {
      send_page_view: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_MEASUREMENT_ID);
    document.head.appendChild(script);
  }
  function removeGaCookies() {
    document.cookie.split(';').map(x => x.trim().split('=')[0]).forEach(name => {
      if (/^_ga(?:_|$)/.test(name)) {
        document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax';
      }
    });
  }
  function saveConsent(value) {
    const wasGranted = consent === 'granted';
    consent = value;
    try { localStorage.setItem(STORAGE_KEY, value); } catch (_) {}
    hideBanner();
    if (value === 'granted') loadTag();
    if (value === 'denied') {
      if (wasGranted && tagLoaded && typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          analytics_storage: 'denied',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied'
        });
      }
      removeGaCookies();
      if (wasGranted && tagLoaded) window.location.reload();
    }
  }
  function hideBanner() {
    if (banner) { banner.remove(); banner = null; }
  }
  function showBanner() {
    if (banner) return;
    banner = document.createElement('aside');
    banner.className = 'ob-analytics-consent';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', t('dialog'));
    const heading = document.createElement('strong');
    heading.className = 'ob-analytics-title';
    heading.textContent = t('title');
    const message = document.createElement('p');
    message.textContent = t('description');
    const actions = document.createElement('div');
    actions.className = 'ob-analytics-actions';
    const accept = document.createElement('button');
    accept.type = 'button';
    accept.className = 'ob-analytics-accept';
    accept.textContent = t('accept');
    accept.addEventListener('click', () => saveConsent('granted'));
    const reject = document.createElement('button');
    reject.type = 'button';
    reject.className = 'ob-analytics-reject';
    reject.textContent = t('reject');
    reject.addEventListener('click', () => saveConsent('denied'));
    const privacy = document.createElement('a');
    privacy.href = '/privacy.html';
    privacy.textContent = t('privacy');
    actions.append(accept, reject, privacy);
    banner.append(heading, message, actions);
    document.body.appendChild(banner);
    banner._i18n = () => {
      heading.textContent = t('title');
      message.textContent = t('description');
      accept.textContent = t('accept');
      reject.textContent = t('reject');
      privacy.textContent = t('privacy');
      banner.setAttribute('aria-label', t('dialog'));
    };
  }
  function reportEvent(eventName, parameters) {
    if (consent !== 'granted' || !tagLoaded || typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, parameters);
  }
  function trackLink(event) {
    const anchor = event.target.closest('a[href]');
    if (!anchor) return;
    const href = anchor.getAttribute('href') || '';
    let link;
    try { link = new URL(href, window.location.href); } catch (_) { return; }
    const path = link.pathname.toLowerCase();
    if (link.protocol === 'mailto:') {
      reportEvent('portfolio_contact_click', {contact_method: 'email'});
    } else if (link.hostname === 'www.linkedin.com' || link.hostname === 'linkedin.com') {
      reportEvent('portfolio_contact_click', {contact_method: 'linkedin'});
    } else if (/\/assets\/omar_bettaieb_cv_(en|fr)\.pdf$/.test(path)) {
      reportEvent('portfolio_cv_click', {cv_language: path.includes('_fr.pdf') ? 'fr' : 'en'});
    } else if (/\/(resume-engineering|resume-growth)\.html$/.test(path)) {
      reportEvent('portfolio_resume_open', {profile: path.includes('engineering') ? 'engineering' : 'growth'});
    } else if (/\/(viranda|vegaprofit|vegalife-growth|vegalife|bioherbs|perfume-dubai|whatsapp-ai-automation)\.html$/.test(path)) {
      reportEvent('portfolio_case_study_open', {case_study: path.split('/').pop().replace('.html', '')});
    }
  }
  const style = document.createElement('style');
  style.textContent = `
    .ob-analytics-consent{position:fixed;z-index:999;bottom:17px;left:17px;right:17px;max-width:610px;margin:auto;padding:21px 23px;border:1px solid #adc5ae;border-radius:15px;background:#fffef9;color:#173025;box-shadow:0 10px 40px #102e2540;font-family:Inter,ui-sans-serif,system-ui,sans-serif}
    .ob-analytics-title{display:block;font-weight:850;font-size:16px;margin-bottom:8px}
    .ob-analytics-consent p{margin:0 0 14px;font-size:13px;color:#4a6252;line-height:1.6}
    .ob-analytics-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
    .ob-analytics-actions button,.ob-analytics-settings{cursor:pointer;font:inherit;font-size:12px;font-weight:800;padding:9px 13px;border-radius:8px;border:1px solid #67876f}
    .ob-analytics-accept{background:#173b28;color:white}
    .ob-analytics-reject{background:white;color:#173b28}
    .ob-analytics-actions a{font-size:12px;color:#275e3e;text-decoration:underline;text-underline-offset:3px;padding:5px}
    .ob-analytics-settings{background:none;color:inherit;margin-left:6px;padding:5px 8px}
    @media(max-width:440px){.ob-analytics-consent{bottom:9px;left:9px;right:9px;padding:16px}.ob-analytics-actions{gap:7px}.ob-analytics-actions button{flex:1}}
    @media print{.ob-analytics-consent,.ob-analytics-settings{display:none!important}}
  `;
  function initialize() {
    document.head.appendChild(style);
    // Select only the page-level footer, never skill-card <footer> elements.
    // VegaLife uses a direct-child <div class="footer"> instead of <footer>.
    const footer = document.querySelector('body > footer, body > .footer');
    if (footer) {
      footerButton = document.createElement('button');
      footerButton.type = 'button';
      footerButton.className = 'ob-analytics-settings';
      footerButton.textContent = t('settings');
      footerButton.addEventListener('click', showBanner);
      footer.appendChild(footerButton);
    }
    if (consent === 'granted') loadTag();
    else if (consent === null) showBanner();
    document.addEventListener('click', trackLink, true);
    const observer = new MutationObserver(() => {
      if (footerButton) footerButton.textContent = t('settings');
      if (banner && banner._i18n) banner._i18n();
    });
    observer.observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
})();