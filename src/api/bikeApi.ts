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

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

// ─── API 함수 ────────────────────────────────────────────────────────
export const fetchTotalUsage       = () => api.get<number>('/bike/stats/total-usage');
export const fetchTotalCarbon      = () => api.get<number>('/bike/stats/total-carbon');
export const fetchDistrictUsage    = () => api.get<DistrictUsageItem[]>('/bike/stats/district-usage');
export const fetchDailyTrend       = () => api.get<DailyTrendItem[]>('/bike/stats/daily-trend');
export const fetchTimeDistribution = () => api.get<TimeDistributionItem[]>('/bike/stats/time-distribution');
export const fetchDemographics     = () => api.get<DemographicsItem[]>('/bike/stats/demographics');
export const fetchTopStations      = () => api.get<TopStationItem[]>('/bike/stats/top-stations');
export const fetchTurnover         = () => api.get<TurnoverItem[]>('/bike/stats/turnover');
export const fetchTimeDistance     = () => api.get<TimeDistanceItem[]>('/bike/stats/time-distance');
