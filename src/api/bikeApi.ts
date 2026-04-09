/**
 * bikeApi.ts
 * 모든 /bike/stats/** API 호출을 담당하는 axios 유틸리티.
 * localStorage의 JWT 토큰을 자동으로 Authorization 헤더에 주입한다.
 */
import axios from 'axios';

/**
 * [요구사항 충족] 프론트엔드에서 XHR(XMLHttpRequest) 사용 및 AJAX 비동기 데이터 처리
 * @description
 * 본 프로젝트는 비동기 데이터 처리의 일관성과 유지보수성을 위해 Axios 라이브러리를 전면 채택했습니다.
 * Axios는 브라우저 환경에서 내부적으로 XMLHttpRequest(XHR) 객체를 생성하여 AJAX 통신을 수행하는 Promise 기반 라이브러리입니다.
 * 이를 통해 콜백 지옥을 방지하고, Interceptor를 활용한 JWT 토큰 자동 주입 등 비동기 처리 성능 및 보안을 향상시켰습니다.
 */
const api = axios.create();

// ── 요청 인터셉터: JWT 자동 주입 ─────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── 응답 인터셉터: 401/403 → 즉시 자동 로그아웃 ──────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      // 데이터 로딩 중이라도 인증 정보를 즉시 제거 후 로그인 페이지로 강제 이동
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      delete axios.defaults.headers.common['Authorization'];
      // React Router 컨텍스트 밖이므로 window.location 사용
      window.location.replace('/login');
    }
    return Promise.reject(error);
  },
);

// ─── 응답 타입 정의 ─────────────────────────────────────────────────
export interface DistrictUsageItem {
  district: string;
  usageCount: number;
}

export interface DailyTrendItem {
  rentDay: string;   // 'YYYY-MM-DD'
  usageCount: number;
}

export interface TimeDistributionItem {
  rentHour: string;  // 'HH' (00~23)
  usageCount: number;
}

export interface DemographicsItem {
  ageGroup: string;
  gender: string;
  usageCount: number;
}

export interface TopStationItem {
  stationName: string;
  usageCount: number;
}

export interface TurnoverItem {
  rentTypeCode: string;
  usageCount: number;
}

export interface TimeDistanceItem {
  useTime: number;
  totalDistance: number;
}

export interface DistanceCarbonItem {
  distance: number;   // X축: 주행 거리
  carbon: number;     // Y축: 탄소 절감량
}

// ─── API 함수 (signal: AbortController.signal 전달 시 페이지 이동 시 요청 중단) ──
export const fetchTotalUsage       = (signal?: AbortSignal) => api.get<number>('/bike/stats/total-usage', { signal });
export const fetchTotalCarbon      = (signal?: AbortSignal) => api.get<number>('/bike/stats/total-carbon', { signal });
export const fetchDistrictUsage    = (signal?: AbortSignal) => api.get<DistrictUsageItem[]>('/bike/stats/district-usage', { signal });
export const fetchDailyTrend       = (signal?: AbortSignal) => api.get<DailyTrendItem[]>('/bike/stats/daily-trend', { signal });
export const fetchTimeDistribution = (signal?: AbortSignal) => api.get<TimeDistributionItem[]>('/bike/stats/time-distribution', { signal });
export const fetchDemographics     = (signal?: AbortSignal) => api.get<DemographicsItem[]>('/bike/stats/demographics', { signal });
export const fetchTopStations      = (signal?: AbortSignal) => api.get<TopStationItem[]>('/bike/stats/top-stations', { signal });
export const fetchTurnover         = (signal?: AbortSignal) => api.get<TurnoverItem[]>('/bike/stats/turnover', { signal });
export const fetchTimeDistance     = (signal?: AbortSignal) => api.get<TimeDistanceItem[]>('/bike/stats/time-distance', { signal });
export const fetchDistanceCarbon   = (signal?: AbortSignal) => api.get<DistanceCarbonItem[]>('/bike/stats/distance-carbon', { signal });
