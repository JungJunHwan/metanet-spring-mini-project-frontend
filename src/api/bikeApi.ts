/**
 * bikeApi.ts
 * 모든 /bike/stats/** API 호출을 담당하는 axios 유틸리티.
 * localStorage의 JWT 토큰을 자동으로 Authorization 헤더에 주입한다.
 */
import { ajax as api } from './ajax';

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

/** 이동거리 vs 이용시간 산점도 (버블 크기: weight) */
export interface DistanceTimeItem {
  distance: number;   // X축: 이동거리 (m)
  useTime: number;    // Y축: 이용시간 (분)
  weight: number;     // 버블 크기: 이용 건수
}

/** 대여소별 이용건수 vs 평균 이동거리 산점도 */
export interface AllStationItem {
  stationName: string;
  usageCount: number;
  avgDistance: number;
}

/** 연령대별 이동거리 분포 박스플롯 */
export interface AgeDistBoxplotItem {
  ageGroup: string;
  minDist: number;
  q1Dist: number;
  medianDist: number;
  q3Dist: number;
  maxDist: number;
  totalUseCount: number;
}

// ─── API 함수 (params 전달 시 필터링 적용, signal 전달 시 페이지 이동 시 요청 중단) ──
export const fetchTotalUsage = (district?: string, month?: number, signal?: AbortSignal) =>
  api.get<number>('/bike/stats/total-usage', { params: { district, month }, signal });

export const fetchTotalCarbon = (district?: string, month?: number, signal?: AbortSignal) =>
  api.get<number>('/bike/stats/total-carbon', { params: { district, month }, signal });

export const fetchDistrictUsage = (signal?: AbortSignal) =>
  api.get<DistrictUsageItem[]>('/bike/stats/district-usage', { signal });

export const fetchDailyTrend = (district?: string, month?: number, signal?: AbortSignal) =>
  api.get<DailyTrendItem[]>('/bike/stats/daily-trend', { params: { district, month }, signal });

export const fetchTimeDistribution = (district?: string, month?: number, signal?: AbortSignal) =>
  api.get<TimeDistributionItem[]>('/bike/stats/time-distribution', { params: { district, month }, signal });

export const fetchDemographics = (district?: string, month?: number, signal?: AbortSignal) =>
  api.get<DemographicsItem[]>('/bike/stats/demographics', { params: { district, month }, signal });

export const fetchTopStations = (district?: string, month?: number, signal?: AbortSignal) =>
  api.get<TopStationItem[]>('/bike/stats/top-stations', { params: { district, month }, signal });

export const fetchTurnover = (district?: string, month?: number, signal?: AbortSignal) =>
  api.get<TurnoverItem[]>('/bike/stats/turnover', { params: { district, month }, signal });

export const fetchTimeDistance = (district?: string, month?: number, signal?: AbortSignal) =>
  api.get<TimeDistanceItem[]>('/bike/stats/time-distance', { params: { district, month }, signal });

export const fetchDistanceTime = (district?: string, month?: number, signal?: AbortSignal) =>
  api.get<DistanceTimeItem[]>('/bike/stats/distance-time', { params: { district, month }, signal });

export const fetchAllStations = (district?: string, month?: number, signal?: AbortSignal) =>
  api.get<AllStationItem[]>('/bike/stats/all-stations', { params: { district, month }, signal });

export const fetchAgeDistance = (district?: string, month?: number, signal?: AbortSignal) =>
  api.get<AgeDistBoxplotItem[]>('/bike/stats/age-distance', { params: { district, month }, signal });
