import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, LabelList, PieChart as RechartsPieChart, Pie, Legend, Label
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bike, Users, Leaf, MapPin, Calendar as CalendarIcon,
  Clock, TrendingUp, BarChart3, PieChart, Activity, Scale
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MetricCard } from '../components/MetricCard';
import { SeoulMap } from '../components/SeoulMap';
import { Skeleton } from '../components/ui/Skeleton';
import { DISTRICTS } from '../data';
import { AuthNav } from '../components/auth/AuthNav';
import {
  fetchTotalUsage,
  fetchTotalCarbon,
  fetchDistrictUsage,
  fetchDailyTrend,
  fetchDemographics,
  fetchTopStations,
  fetchTurnover,
  fetchTimeDistance,
  fetchDistanceCarbon,
  type DistrictUsageItem,
} from '../api/bikeApi';

// ─── 차트용 데이터 타입 ───────────────────────────────────────────────
interface TrendPoint { name: string; usage: number }
interface DemoPoint { name: string; value: number }
interface StationPoint { name: string; count: number }
interface TurnoverPoint { name: string; value: number }
interface TimeDistPoint { time: number; count: number }
interface ScatterPoint { distance: number; carbon: number; weight?: number }

// ─── 일별 trend → 월별 집계 변환 ────────────────────────────────────
function aggregateToMonthly(
  raw: { rentDay: string; usageCount: number }[],
  formatMonth: (n: number) => string,
): TrendPoint[] {
  const monthly: Record<string, number> = {}
  raw.forEach(({ rentDay, usageCount }) => {
    const month = rentDay?.slice(5, 7) ?? '00'   // 'MM'
    monthly[month] = (monthly[month] ?? 0) + Number(usageCount)
  })
  return Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ name: formatMonth(parseInt(month)), usage: total }))
}

// ─── 인구통계 → 연령별 합산 ─────────────────────────────────────────
function aggregateDemographics(
  raw: { ageGroup: string; gender: string; usageCount: number }[],
  otherLabel: string,
): DemoPoint[] {
  const grouped: Record<string, number> = {}
  raw.forEach(({ ageGroup, usageCount }) => {
    const key = ageGroup ?? otherLabel
    grouped[key] = (grouped[key] ?? 0) + Number(usageCount)
  })
  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ({ name, value }))
}

// ─── Y축 커스텀 Tick: 긴 대여소 이름 → 다중 줄 tspan ────────────────────
function splitStationName(name: string): string[] {
  // ① 괄호가 있으면 괄호 바로 앞에서 분리 (예: "롯데월드타워(잠실역...)")
  const parenIdx = name.indexOf('(');
  if (parenIdx > 0) {
    return [name.slice(0, parenIdx), name.slice(parenIdx)];
  }
  // ② 9자 이하이면 한 줄로 충분
  if (name.length <= 9) return [name];
  // ③ 공백이 있으면 중간 지점에서 가장 가까운 공백으로 분리
  const mid = Math.floor(name.length / 2);
  for (let i = mid; i >= 1; i--) {
    if (name[i] === ' ') return [name.slice(0, i), name.slice(i + 1)];
  }
  for (let i = mid + 1; i < name.length - 1; i++) {
    if (name[i] === ' ') return [name.slice(0, i), name.slice(i + 1)];
  }
  // ④ 자연 분리점이 없으면 9자 단위로 강제 분리
  return [name.slice(0, 9), name.slice(9)];
}

interface CustomTickProps {
  x?: number;
  y?: number;
  payload?: { value: string };
}

function CustomYAxisTick({ x = 0, y = 0, payload }: CustomTickProps) {
  const lines = splitStationName(payload?.value ?? '');
  const LINE_HEIGHT = 12;
  // 여러 줄을 y 기준으로 수직 중앙 정렬
  const firstDy = -((lines.length - 1) * LINE_HEIGHT) / 2;

  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="end" fill="#64748b" fontSize={10}>
        {lines.map((line, i) => (
          <tspan key={i} x={0} dy={i === 0 ? firstDy : LINE_HEIGHT}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

// ─── 탭별 고정 항목 / 색상 (컴포넌트 외부 상수) ──────────────────────
// 값이 0이어도 항목이 표시되도록 순서까지 고정
const DAILY_ITEMS = ['일일권', '일일권(비회원)', '일일권(비회원 3시간)'] as const;
const FAMILY_ITEMS = ['가족권', '가족권(2시간)', '가족권(3시간)'] as const;

const TAB_COLORS: Record<string, string[]> = {
  ALL: ['#059669', '#0891b2', '#7c3aed'],   // 에메랄드 · 청록 · 보라
  DAILY: ['#0891b2', '#06b6d4', '#22d3ee'],   // 청록 계열 3단계
  FAMILY: ['#7c3aed', '#8b5cf6', '#a78bfa'],   // 보라 계열 3단계
};

const DEMO_COLORS = ['#10b981', '#0ea5e9', '#6366f1', '#ec4899', '#f43f5e', '#f59e0b', '#8b5cf6', '#14b8a6'];


export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');

  // ── Task 3: API 데이터 State ─────────────────────────────────────
  const [totalUsage, setTotalUsage] = useState<number | null>(null);
  const [totalCarbon, setTotalCarbon] = useState<number | null>(null);
  const [districtUsage, setDistrictUsage] = useState<DistrictUsageItem[] | null>(null);
  const [dailyTrend, setDailyTrend] = useState<TrendPoint[] | null>(null);
  const [demographics, setDemographics] = useState<DemoPoint[] | null>(null);
  const [topStations, setTopStations] = useState<StationPoint[] | null>(null);
  const [turnover, setTurnover] = useState<TurnoverPoint[] | null>(null);
  const [timeDistance, setTimeDistance] = useState<TimeDistPoint[] | null>(null);
  const [scatterData, setScatterData] = useState<ScatterPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── 마운트 플래그: 언마운트 후 setState 호출 방지 ──────────────────
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── API 호출: 의존성 추가 (필터 변경 시 재요청) ──
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    setError(null);

    // 필터 변경 시 기존 데이터 null 처리 (스켈레톤 유도)
    setTotalUsage(null);
    setTotalCarbon(null);
    setDailyTrend(null);
    setDemographics(null);
    setTopStations(null);
    setTurnover(null);
    setTimeDistance(null);
    setScatterData(null);

    // 'ALL' 선택 시 API에는 undefined 전달 (필터 미적용)
    const district = selectedDistrict === 'ALL' ? undefined : selectedDistrict;
    const month = selectedMonth === 'ALL' ? undefined : parseInt(selectedMonth);

    const ignoreAbort = (fn: () => void, apiName: string) => (err: unknown) => {
      if ((err as any)?.code === 'ERR_CANCELED' || (err as any)?.name === 'AbortError') {
        console.log(`[Abort] ${apiName} canceled`);
        return;
      }
      console.error(`[Error] ${apiName} failed:`, err);
      if (mountedRef.current) setError(apiName + ' ' + t('dashboard.dataError'));
      fn();
    };

    // 모든 API 요청을 Promise 배열로 관리
    const requests = [
      // 1. 총 이용건수
      fetchTotalUsage(district, month, signal)
        .then(res => { console.log('TotalUsage success', res); if (mountedRef.current) setTotalUsage(res.data ?? 0) })
        .catch(ignoreAbort(() => { }, 'fetchTotalUsage')),

      // 2. 총 탄소 절감량
      fetchTotalCarbon(district, month, signal)
        .then(res => { if (mountedRef.current) setTotalCarbon(Math.round(res.data ?? 0)) })
        .catch(ignoreAbort(() => { }, 'fetchTotalCarbon')),

      // 3. 자치구별 현황 (필터링 제외 - 전체 지도 표시용)
      fetchDistrictUsage(signal)
        .then(res => { if (mountedRef.current) setDistrictUsage(res.data ?? []) })
        .catch(ignoreAbort(() => { }, 'fetchDistrictUsage')),

      // 4. 일별 추이 (월 선택 시 일별, 아니면 월별 합산)
      fetchDailyTrend(district, month, signal)
        .then(res => {
          if (!mountedRef.current) return;
          const rawData = res.data ?? [];
          if (selectedMonth === 'ALL') {
            setDailyTrend(aggregateToMonthly(rawData, n => t('dashboard.monthLabel', { n })));
          } else {
            // 특정 월 선택 시: 'YYYY-MM-DD'에서 'DD일' 추출
            const dailyData = rawData.map(d => ({
              name: t('dashboard.dayLabel', { n: parseInt(d.rentDay.slice(8, 10)) }),
              usage: Number(d.usageCount)
            }));
            setDailyTrend(dailyData);
          }
        })
        .catch(ignoreAbort(() => { }, 'fetchDailyTrend')),

      // 5. 인구통계
      fetchDemographics(district, month, signal)
        .then(res => { if (mountedRef.current) setDemographics(aggregateDemographics(res.data ?? [], t('dashboard.otherLabel'))) })
        .catch(ignoreAbort(() => { }, 'fetchDemographics')),

      // 6. 상위 대여소
      fetchTopStations(district, month, signal)
        .then(res => {
          if (!mountedRef.current) return;
          setTopStations(
            (res.data ?? []).map(d => ({
              name: d.stationName,
              count: Number(d.usageCount),
            }))
          );
        })
        .catch(ignoreAbort(() => { }, 'fetchTopStations')),

      // 7. 대여 유형별 회전율
      fetchTurnover(district, month, signal)
        .then(res => {
          if (!mountedRef.current) return;
          setTurnover(
            (res.data ?? []).map(d => ({
              name: d.rentTypeCode ?? t('dashboard.otherLabel'),
              value: Number(d.usageCount),
            }))
          );
        })
        .catch(ignoreAbort(() => { }, 'fetchTurnover')),

      // 8. 이용 시간 및 거리
      fetchTimeDistance(district, month, signal)
        .then(res => {
          if (!mountedRef.current) return;
          setTimeDistance(
            (res.data ?? []).map(d => ({
              time: Number(d.useTime) || 0,
              count: Number(d.totalDistance) || 0,
            }))
          );
        })
        .catch(ignoreAbort(() => { }, 'fetchTimeDistance')),

      // 9. 거리 vs 탄소 절감량
      fetchDistanceCarbon(district, month, signal)
        .then(res => {
          if (mountedRef.current) {
            const mapped = (res.data ?? [])
              .filter((d: any) => d.distance != null && d.carbon != null)
              .map((d: any) => ({
                distance: Number(d.distance),
                carbon: Number(d.carbon),
                weight: Number(d.weight || 1)
              }));

            // DOM 렌더링 과부하 방지를 위해 가중치(중복 수)가 높은 상위 500개의 포인트만 렌더링
            const sampledData = mapped
              .sort((a, b) => b.weight - a.weight)
              .slice(0, 500);

            setScatterData(sampledData);
          }
        })
        .catch(ignoreAbort(() => {
          // if (mountedRef.current) setError(t('dashboard.dataError')); // already set in ignoreAbort
        }, 'fetchDistanceCarbon')),
    ];

    // 모든 요청이 완료(성공 또는 실패)되면 로딩 해제 (헤더 아이콘용)
    Promise.allSettled(requests).then((results) => {
      console.log('All requests settled. Results:', results.map(r => r.status));
    }).finally(() => {
      if (mountedRef.current && !signal.aborted) {
        console.log('Setting loading false');
        setLoading(false);
      } else {
        console.log(`finally skipped loading false. mounted: ${mountedRef.current}, aborted: ${signal.aborted}`);
      }
    });

    // 클린업: 컴포넌트 언마운트 또는 의존성 변경 시 이전 요청 즉시 중단
    return () => { controller.abort(); };
  }, [selectedDistrict, selectedMonth]);

  // ── 탭 State ─────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'ALL' | 'DAILY' | 'FAMILY'>('ALL');

  // ── 탭별 차트 데이터 가공 ─────────────────────────────────────────
  // ALL   : 정기권 / 일일권 합계 / 가족권 합계 (reduce)
  // DAILY : DAILY_ITEMS 순서 고정 — 값 0이어도 항목 유지
  // FAMILY: FAMILY_ITEMS 순서 고정 — 값 0이어도 항목 유지
  const tabChartData = useMemo(() => {
    if (!turnover) return [];
    const find = (name: string) => turnover.find(d => d.name === name)?.value ?? 0;
    const sumBy = (prefix: string) =>
      turnover.filter(d => d.name.startsWith(prefix)).reduce((s, d) => s + d.value, 0);

    if (activeTab === 'DAILY') return [...DAILY_ITEMS].map(name => ({ name, value: find(name) }));
    if (activeTab === 'FAMILY') return [...FAMILY_ITEMS].map(name => ({ name, value: find(name) }));
    return [
      { name: t('dashboard.turnoverLabels.regular'), value: sumBy('정기권') },
      { name: t('dashboard.turnoverLabels.dailyTotal'), value: sumBy('일일권') },
      { name: t('dashboard.turnoverLabels.familyTotal'), value: sumBy('가족권') },
    ];
  }, [turnover, activeTab, t]);

  const tabTotal = useMemo(
    () => tabChartData.reduce((s, d) => s + d.value, 0),
    [tabChartData],
  );



  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-6 lg:p-8 font-sans text-slate-900">
      {/* Header */}
      <header className="mb-8 flex flex-col gap-4 border-b border-emerald-100 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-xl">
              <Bike className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {t('header.title')}{' '}
                <span className="text-emerald-500 font-medium">{t('header.year')}</span>
              </h1>
              <p className="text-sm text-slate-500">{t('header.subtitle')}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <AuthNav />
          </div>
        </div>

        <div className="flex items-center justify-between w-full flex-wrap gap-4 mt-2">
          {/* 좌측 필터 영역 */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('filter.districtLabel')}</label>
              <Select value={selectedDistrict} onValueChange={(v) => setSelectedDistrict(v ?? 'ALL')}>
                <SelectTrigger className="w-[180px] bg-white border-emerald-100 focus:ring-emerald-500">
                  <SelectValue placeholder={t('filter.districtPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('filter.allDistrict')}</SelectItem>
                  {DISTRICTS.map(d => (
                    <SelectItem key={d} value={d}>
                      {t(`districts.${d}`, { defaultValue: d })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('filter.monthLabel')}</label>
              <Select value={selectedMonth} onValueChange={(v) => setSelectedMonth(v ?? 'ALL')}>
                <SelectTrigger className="w-[140px] bg-white border-emerald-100 focus:ring-emerald-500">
                  <SelectValue placeholder={t('filter.monthPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('filter.allMonth')}</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={`${i + 1}`}>{t('filter.month', { n: i + 1 })}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 데이터 로딩 상태 표시 */}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-5">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-500" />
                {t('filter.loading')}
              </div>
            )}
            {error && (
              <p className="text-xs text-amber-500 mt-5">{error}</p>
            )}
          </div>

          {/* 우측 하단 비교 분석 버튼 */}
          <div className="flex items-end mt-4 md:mt-0">
            <button
              onClick={() => navigate('/compare')}
              className="flex items-center gap-2 px-4 py-2 mt-4 md:mt-0 bg-white text-emerald-600 font-semibold border border-emerald-200 rounded-lg shadow-sm hover:bg-emerald-50 transition-colors whitespace-nowrap text-sm h-[38px] self-end"
            >
              <Scale className="w-4 h-4" />
              {t('compare.compareButton', { defaultValue: '비교 분석하기' })}
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Metrics + trend */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <MetricCard
            title={t('metric.totalUsage')}
            value={totalUsage?.toLocaleString() ?? '0'}
            unit={t('metric.totalUsageUnit')}
            icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
            isLoading={totalUsage === null}
          />
          <MetricCard
            title={t('metric.districts')}
            value={districtUsage?.length.toString() ?? '0'}
            unit={t('metric.districtsUnit')}
            icon={<Users className="w-4 h-4 text-emerald-500" />}
            isLoading={districtUsage === null}
          />
          <MetricCard
            title={t('metric.carbon')}
            value={totalCarbon?.toLocaleString() ?? '0'}
            unit={t('metric.carbonUnit')}
            icon={<Leaf className="w-4 h-4 text-emerald-500" />}
            isLoading={totalCarbon === null}
          />

          <Card className="flex-grow border-emerald-100 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-emerald-500" />
                {t('chart.dailyTrend')}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[180px] p-2 relative">
              {dailyTrend === null ? (
                <div className="absolute inset-0 p-4">
                  <Skeleton className="w-full h-full" />
                </div>
              ) : (
                <div className="h-full w-full animate-in fade-in duration-300">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" fontSize={10} tick={{ fill: '#94a3b8' }} />
                      <YAxis fontSize={10} tick={{ fill: '#94a3b8' }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="usage" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Center Column: Map */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <Card className="flex-grow border-emerald-100 bg-white shadow-sm overflow-hidden">
            <CardHeader className="pb-0">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-500" />
                {t('chart.mapTitle')}
              </CardTitle>
              <p className="text-xs text-slate-400">{t('chart.mapHint')}</p>
            </CardHeader>
            <CardContent className="relative h-[650px] p-0 overflow-hidden">
              {districtUsage === null ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4/5 h-4/5 bg-slate-50 rounded-full animate-pulse flex items-center justify-center">
                    <MapPin className="w-12 h-12 text-slate-200" />
                  </div>
                </div>
              ) : (
                <div className="h-full w-full animate-in zoom-in-95 duration-300">
                  <SeoulMap
                    selectedDistrict={selectedDistrict}
                    onDistrictSelect={setSelectedDistrict}
                    districtUsage={districtUsage}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Charts */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <Card className="border-emerald-100 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                {t('chart.topStations')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 relative h-[300px]">
              {topStations === null ? (
                <div className="absolute inset-0 p-4 flex flex-col gap-2">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <div className="h-full w-full animate-in fade-in slide-in-from-right-4 duration-300">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={topStations}
                      margin={{ top: 5, right: 15, left: 5, bottom: 5 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={100}
                        tick={<CustomYAxisTick />}
                      />
                      <Tooltip
                        cursor={{ fill: '#f0fdf4' }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #10b981' }}
                      />
                      <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <DemographicsCard demographics={demographics} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card className="border-emerald-100 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              {t('chart.scatter')}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[240px] p-2 relative">
            {scatterData === null ? (
              <Skeleton className="absolute inset-4" />
            ) : (
              <div className="h-full w-full animate-in fade-in duration-300">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" dataKey="distance" name={t('chart.scatterX')} unit="m" fontSize={10} />
                    <YAxis type="number" dataKey="carbon" name={t('chart.scatterY')} unit="g" fontSize={10} />
                    <ZAxis type="number" dataKey="weight" range={[20, 200]} name="Count" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name={t('chart.scatterName')} data={scatterData} fill="#10b981" fillOpacity={0.6} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 대여소 회전율 — 탭 전환 BarChart */}
        <Card className="border-emerald-100">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2 shrink-0">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                {t('chart.turnover')}
              </CardTitle>
              {/* 탭 버튼 그룹 */}
              <div className="flex gap-1">
                {(['ALL', 'DAILY', 'FAMILY'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium transition-colors whitespace-nowrap ${activeTab === tab
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                  >
                    {tab === 'ALL' ? t('dashboard.tabs.all') : tab === 'DAILY' ? t('dashboard.tabs.daily') : t('dashboard.tabs.family')}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[240px] p-2 relative">
            {turnover === null ? (
              <Skeleton className="absolute inset-4" />
            ) : (
              <div className="h-full w-full animate-in fade-in duration-300">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={tabChartData}
                    margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="name"
                      fontSize={9}
                      tick={{ fill: '#94a3b8', angle: 0, textAnchor: 'middle' }}
                      height={48}
                      interval={0}
                      tickFormatter={(value: string) =>
                        t(`ticketTypes.${value}`, { defaultValue: value })
                      }
                    />
                    <YAxis fontSize={9} tick={{ fill: '#94a3b8' }} />
                    <Tooltip
                      labelFormatter={(label: string) =>
                        t(`ticketTypes.${label}`, { defaultValue: label })
                      }
                      formatter={(v: number) => [v.toLocaleString() + t('dashboard.tooltipUnit'), t('dashboard.tooltipLabel')]}
                    />
                    <Bar
                      dataKey="value"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={false}
                    >
                      {tabChartData.map((_, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={(TAB_COLORS[activeTab] ?? TAB_COLORS.ALL)[idx] ?? '#10b981'}
                        />
                      ))}
                      {/* 막대 위 수치 + 비율 라벨 */}
                      <LabelList
                        dataKey="value"
                        position="top"
                        fontSize={8}
                        fill="#475569"
                        formatter={(v: unknown) => {
                          const n = Number(v);
                          const pct = tabTotal > 0 ? Math.round((n / tabTotal) * 100) : 0;
                          const isKo = i18n.language === 'ko';
                          const num = n >= 10000
                            ? isKo
                              ? `${(n / 10000).toFixed(1)}${t('dashboard.largeNumSuffix')}`
                              : `${(n / 1000).toFixed(0)}${t('dashboard.largeNumSuffix')}`
                            : n.toLocaleString();
                          return `${num} (${pct}%)`;
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-emerald-100 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              {t('chart.timeDistance')}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[240px] p-2 relative">
            {timeDistance === null ? (
              <Skeleton className="absolute inset-4" />
            ) : (
              <div className="h-full w-full animate-in fade-in duration-300">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeDistance}>
                    <XAxis dataKey="time" fontSize={10} tick={{ fill: '#94a3b8' }} unit={t('dashboard.timeUnit')} />
                    <YAxis fontSize={10} tick={{ fill: '#94a3b8' }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t border-slate-200 text-center text-slate-400 text-xs">
        <p>{t('footer.rights')}</p>
        <p className="mt-1">{t('footer.source')}</p>
      </footer>
    </div>
  );
}

// =====================================================================
// 분리된 인구통계 컴포넌트 (Dashboard 전체 리렌더링 방지용)
// =====================================================================
function DemographicsCard({ demographics }: { demographics: DemoPoint[] | null }) {
  const { t } = useTranslation();
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);

  const { extDemographics, defaultCenterStats } = useMemo(() => {
    if (!demographics || demographics.length === 0) {
      return { extDemographics: [], defaultCenterStats: { maxName: '', maxPercent: 0 } };
    }

    let total = 0;
    let maxItem = demographics[0];

    demographics.forEach(d => {
      total += d.value;
      if (d.value > maxItem.value) {
        maxItem = d;
      }
    });

    const extDemographics = demographics.map(d => ({
      ...d,
      percent: total > 0 ? Math.round((d.value / total) * 100) : 0,
    }));

    return {
      extDemographics,
      defaultCenterStats: {
        maxName: maxItem.name,
        maxPercent: total > 0 ? Math.round((maxItem.value / total) * 100) : 0
      }
    };
  }, [demographics]);

  const activeDemoPercent = activePieIndex !== null && extDemographics.length > 0
    ? extDemographics[activePieIndex].percent
    : defaultCenterStats.maxPercent;

  const activeDemoName = activePieIndex !== null && extDemographics.length > 0
    ? extDemographics[activePieIndex].name
    : defaultCenterStats.maxName;

  return (
    <Card className="border-emerald-100 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-emerald-500" />
          {t('chart.demographics')}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] p-2 relative">
        {demographics === null ? (
          <div className="absolute inset-0 p-4">
            <Skeleton className="w-full h-full" />
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center relative animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* 우측 상단 고정 커스텀 툴팁 */}
            {activePieIndex !== null && extDemographics.length > 0 && (
              <div className="absolute -top-4 right-0 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm border border-slate-200 z-10 pointer-events-none">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: DEMO_COLORS[activePieIndex % DEMO_COLORS.length] }}
                  />
                  {t(`ageGroups.${extDemographics[activePieIndex].name}`, { defaultValue: extDemographics[activePieIndex].name })}
                </div>
                <div className="text-right text-sm font-bold text-slate-900 mt-0.5">
                  {extDemographics[activePieIndex].value.toLocaleString()}
                  <span className="text-[10px] text-slate-400 font-normal ml-0.5">명</span>
                </div>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={extDemographics}
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="80%"
                  dataKey="value"
                  nameKey="name"
                  stroke="none"
                  paddingAngle={2}
                  onMouseEnter={(_, index) => setActivePieIndex(index)}
                  onMouseLeave={() => setActivePieIndex(null)}
                >
                  {extDemographics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DEMO_COLORS[index % DEMO_COLORS.length]} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      const { cx, cy } = viewBox as any;
                      return (
                        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
                          <tspan x={cx} y={cy - 18} fontSize="28" fontWeight="bold" fill="#1e293b">{activeDemoPercent}%</tspan>
                          <tspan x={cx} y={cy + 4} fontSize="12" fill="#94a3b8">{t(`ageGroups.${activeDemoName}`, { defaultValue: activeDemoName })}</tspan>
                        </text>
                      );
                    }}
                  />
                </Pie>
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px' }}
                  formatter={(value: string) => t(`ageGroups.${value}`, { defaultValue: value })}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}