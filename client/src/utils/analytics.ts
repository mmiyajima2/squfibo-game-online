import ReactGA from 'react-ga4';

// Google Analytics Measurement ID
// 本番環境では環境変数から取得することを推奨
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

// Google Analytics の初期化
export const initializeAnalytics = () => {
  // 開発環境では初期化をスキップ（オプション）
  if (import.meta.env.DEV && !import.meta.env.VITE_GA_ENABLE_IN_DEV) {
    console.log('[Analytics] Development mode: Analytics disabled');
    return;
  }

  // Google Analytics の初期化
  ReactGA.initialize(MEASUREMENT_ID, {
    gtagOptions: {
      send_page_view: true, // 初期ページビューを自動送信
    },
  });

  console.log('[Analytics] Google Analytics initialized with ID:', MEASUREMENT_ID);
};

// ページビューの送信（必要に応じて使用）
export const trackPageView = (page: string) => {
  ReactGA.send({ hitType: 'pageview', page });
};

// カスタムイベントの送信（必要に応じて使用）
export const trackEvent = (category: string, action: string, label?: string, value?: number) => {
  ReactGA.event({
    category,
    action,
    label,
    value,
  });
};
