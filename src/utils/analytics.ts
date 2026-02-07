declare global {
  interface Window {
    dataLayer?: any[]
    gtag?: (...args: any[]) => void
  }
}

function ensureGtag() {
  window.dataLayer = window.dataLayer || []
  window.gtag =
    window.gtag ||
    function gtagShim() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments as any)
    }
}

export function initGoogleAnalytics(measurementId: string) {
  if (!measurementId) return
  if (typeof window === 'undefined') return

  // avoid double init
  if (document.querySelector(`script[data-gtag="${measurementId}"]`)) return

  ensureGtag()

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
  script.setAttribute('data-gtag', measurementId)
  document.head.appendChild(script)

  window.gtag!('js', new Date())
  // SPA: a gente envia page_view manualmente via router.afterEach
  window.gtag!('config', measurementId, { send_page_view: false })
}

export function trackPageView(measurementId: string, pagePath: string) {
  if (!measurementId) return
  if (typeof window === 'undefined') return
  if (!window.gtag) return

  window.gtag('config', measurementId, { page_path: pagePath })
}

