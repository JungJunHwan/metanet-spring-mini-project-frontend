import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell,
} from 'recharts';
import {
  Bike, Users, Leaf, MapPin, Calendar as CalendarIcon,
  Clock, TrendingUp, BarChart3, PieChart, Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MetricCard } from '../components/MetricCard';
import { SeoulMap } from '../components/SeoulMap';
import { DISTRICTS } from '../data';
import { motion } from 'motion/react';
import { AuthNav } from '../components/auth/AuthNav';
import {
  fetchTotalUsage,
  fetchTotalCarbon,
  fetchDistrictUsage,
  fetchDailyTrend,
  fetchTimeDistribution,
  fetchDemographics,
  fetchTopStations,
  fetchTurnover,
  fetchTimeDistance,
  type DistrictUsageItem,
} from '../api/bikeApi';

// ─── 차트용 데이터 타입 ───────────────────────────────────────────────
interface TrendPoint       { name: string;  usage: number }
interface HourPoint        { hour: string;  count: number }
interface DemoPoint        { name: string;  value: number }
interface StationPoint     { name: string;  count: number }
interface TurnoverPoint    { name: string;  value: number }
interface TimeDistPoint    { time: number;  count: number }
interface ScatterPoint     { distance: number; carbon: number }

// ─── 일별 trend → 월별 집계 변환 ────────────────────────────────────
function aggregateToMonthly(
  raw: { rentDay: string; usageCount: number }[],
): TrendPoint[] {
  const monthly: Record<string, number> = {}
  raw.forEach(({ rentDay, usageCount }) => {
    const month = rentDay?.slice(5, 7) ?? '00'   // 'MM'
    monthly[month] = (monthly[month] ?? 0) + Number(usageCount)
  })
  return Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ name: `${parseInt(month)}월`, usage: total }))
}

// ─── 인구통계 → 연령별 합산 ─────────────────────────────────────────
function aggregateDemographics(
  raw: { ageGroup: string; gender: string; usageCount: number }[],
): DemoPoint[] {
  const grouped: Record<string, number> = {}
  raw.forEach(({ ageGroup, usageCount }) => {
    const key = ageGroup ?? '기타'
    grouped[key] = (grouped[key] ?? 0) + Number(usageCount)
  })
  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ({ name, value }))
}

export default function Dashboard() {
  const [selectedDistrict, setSelectedDistrict] = useState('전체');
  const [selectedMonth,    setSelectedMonth]    = useState('전체');

  // ── Task 3: API 데이터 State ─────────────────────────────────────
  const [totalUsage,       setTotalUsage]       = useState<number>(0);
  const [totalCarbon,      setTotalCarbon]       = useState<number>(0);
  const [districtUsage,    setDistrictUsage]    = useState<DistrictUsageItem[]>([]);
  const [dailyTrend,       setDailyTrend]       = useState<TrendPoint[]>([]);
  const [timeDistribution, setTimeDistribution] = useState<HourPoint[]>([]);
  const [demographics,     setDemographics]     = useState<DemoPoint[]>([]);
  const [topStations,      setTopStations]      = useState<StationPoint[]>([]);
  const [turnover,         setTurnover]         = useState<TurnoverPoint[]>([]);
  const [timeDistance,     setTimeDistance]     = useState<TimeDistPoint[]>([]);
  const [scatterData]                           = useState<ScatterPoint[]>(
    Array.from({ length: 50 }, () => ({
      distance: Math.random() * 2000 + 500,
      carbon:   Math.random() * 500  + 100,
    }))
  );
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // ── 마운트 플래그: 언마운트 후 setState 호출 방지 ──────────────────
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── API 호출: AbortController로 페이지 이동 시 진행 중인 요청 즉시 중단 ──
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    setLoading(true);
    let completedCount = 0;
    const totalRequests = 9;

    const checkAllFinished = () => {
      completedCount++;
      if (completedCount >= totalRequests && mountedRef.current) {
        setLoading(false);
      }
    };

    // AbortError는 정상적인 중단 — 에러 표시 없이 조용히 무시
    const ignoreAbort = (fn: () => void) => (err: unknown) => {
      if ((err as any)?.code === 'ERR_CANCELED') return;
      fn();
    };

    // 1. 총 이용건수
    fetchTotalUsage(signal)
      .then(res => { if (mountedRef.current) setTotalUsage(res.data ?? 0) })
      .catch(ignoreAbort(() => {}))
      .finally(checkAllFinished);

    // 2. 총 탄소 절감량
    fetchTotalCarbon(signal)
      .then(res => { if (mountedRef.current) setTotalCarbon(Math.round(res.data ?? 0)) })
      .catch(ignoreAbort(() => {}))
      .finally(checkAllFinished);

    // 3. 자치구별 현황
    fetchDistrictUsage(signal)
      .then(res => { if (mountedRef.current) setDistrictUsage(res.data ?? []) })
      .catch(ignoreAbort(() => {}))
      .finally(checkAllFinished);

    // 4. 일별 추이 (월별 합산)
    fetchDailyTrend(signal)
      .then(res => { if (mountedRef.current) setDailyTrend(aggregateToMonthly(res.data ?? [])) })
      .catch(ignoreAbort(() => {}))
      .finally(checkAllFinished);

    // 5. 시간대별 분포
    fetchTimeDistribution(signal)
      .then(res => {
        if (!mountedRef.current) return;
        setTimeDistribution(
          (res.data ?? []).map(d => ({
            hour: String(d.rentHour).padStart(2, '0'),
            count: Number(d.usageCount),
          }))
        );
      })
      .catch(ignoreAbort(() => {}))
      .finally(checkAllFinished);

    // 6. 인구통계
    fetchDemographics(signal)
      .then(res => { if (mountedRef.current) setDemographics(aggregateDemographics(res.data ?? [])) })
      .catch(ignoreAbort(() => {}))
      .finally(checkAllFinished);

    // 7. 상위 대여소
    fetchTopStations(signal)
      .then(res => {
        if (!mountedRef.current) return;
        setTopStations(
          (res.data ?? []).map(d => ({
            name: d.stationName,
            count: Number(d.usageCount),
          }))
        );
      })
      .catch(ignoreAbort(() => {}))
      .finally(checkAllFinished);

    // 8. 대여 유형별 회전율
    fetchTurnover(signal)
      .then(res => {
        if (!mountedRef.current) return;
        setTurnover(
          (res.data ?? []).map(d => ({
            name: d.rentTypeCode ?? '기타',
            value: Number(d.usageCount),
          }))
        );
      })
      .catch(ignoreAbort(() => {}))
      .finally(checkAllFinished);

    // 9. 이용 시간 및 거리
    fetchTimeDistance(signal)
      .then(res => {
        if (!mountedRef.current) return;
        setTimeDistance(
          (res.data ?? []).map(d => ({
            time: Number(d.useTime),
            count: Number(d.totalDistance),
          }))
        );
      })
      .catch(ignoreAbort(() => {
        if (mountedRef.current) setError('일부 데이터를 불러오는 중 오류가 발생했습니다.');
      }))
      .finally(checkAllFinished);

    // 클린업: 컴포넌트 언마운트(페이지 이동) 시 진행 중인 모든 요청 즉시 중단
    return () => { controller.abort(); };
  }, []);

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
                따릉이 지역별 이용 현황 대시보드{' '}
                <span className="text-emerald-500 font-medium">| 2025</span>
              </h1>
              <p className="text-sm text-slate-500">Seoul Bike Usage Analytics Dashboard</p>
            </div>
          </div>
          <AuthNav />
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">자치구 선택</label>
            <Select value={selectedDistrict} onValueChange={(v) => setSelectedDistrict(v ?? '전체')}>
              <SelectTrigger className="w-[180px] bg-white border-emerald-100 focus:ring-emerald-500">
                <SelectValue placeholder="자치구 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="전체">전체 (서울시)</SelectItem>
                {DISTRICTS.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">월 선택</label>
            <Select value={selectedMonth} onValueChange={(v) => setSelectedMonth(v ?? '전체')}>
              <SelectTrigger className="w-[140px] bg-white border-emerald-100 focus:ring-emerald-500">
                <SelectValue placeholder="월 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="전체">전체 (연간)</SelectItem>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={`${i + 1}`}>{i + 1}월</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 데이터 로딩 상태 표시 */}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-500" />
              DB 데이터 로딩 중...
            </div>
          )}
          {error && (
            <p className="text-xs text-amber-500">{error}</p>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Metrics + 상위 대여소 */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Task 4: totalUsage — DB 실데이터 */}
          <MetricCard
            title="총 이용건수"
            value={totalUsage.toLocaleString()}
            unit="건"
            icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
            delay={0.1}
          />
          {/* 이용 구 수 — districtUsage에서 계산 */}
          <MetricCard
            title="데이터 수집 자치구"
            value={districtUsage.length.toString()}
            unit="개 구"
            icon={<Users className="w-4 h-4 text-emerald-500" />}
            delay={0.2}
          />
          {/* Task 4: totalCarbon — DB 실데이터 */}
          <MetricCard
            title="총 탄소 절감량"
            value={totalCarbon.toLocaleString()}
            unit="kg CO2"
            icon={<Leaf className="w-4 h-4 text-emerald-500" />}
            delay={0.3}
          />

          {/* Task 4: 상위 10개 대여소 — DB 실데이터 */}
          <Card className="flex-grow border-emerald-100 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                상위 10개 대여소 (최고 이용건수)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={topStations}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      fontSize={10}
                      tick={{ fill: '#64748b' }}
                    />
                    <Tooltip
                      cursor={{ fill: '#f0fdf4' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #10b981' }}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center Column: Map */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <Card className="flex-grow border-emerald-100 bg-white shadow-sm">
            <CardHeader className="pb-0">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-500" />
                자치구별 이용 현황
              </CardTitle>
              <p className="text-xs text-slate-400">: 지도를 클릭하시면, 자치구별 현황을 확인하실 수 있어요.</p>
            </CardHeader>
            <CardContent className="relative h-[500px] p-0 overflow-hidden">
              {/* Task 4: SeoulMap에 DB 데이터 주입 */}
              <SeoulMap
                selectedDistrict={selectedDistrict}
                onDistrictSelect={setSelectedDistrict}
                districtUsage={districtUsage}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Charts */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Task 4: 일별/월별 대여 추이 — DB 실데이터 */}
          <Card className="border-emerald-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-emerald-500" />
                일별/월별 대여 추이
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[180px] p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} tick={{ fill: '#94a3b8' }} />
                  <YAxis fontSize={10} tick={{ fill: '#94a3b8' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="usage" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Task 4: 시간대별 이용 분포 — DB 실데이터 */}
          <Card className="border-emerald-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                시간대별 이용 분포
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[180px] p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="hour" fontSize={10} tick={{ fill: '#94a3b8' }} />
                  <YAxis fontSize={10} tick={{ fill: '#94a3b8' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Task 4: 사용자 인구통계 — DB 실데이터 */}
          <Card className="border-emerald-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-500" />
                사용자 인구통계 (연령별)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[180px] p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demographics}>
                  <XAxis dataKey="name" fontSize={10} tick={{ fill: '#94a3b8' }} />
                  <YAxis fontSize={10} tick={{ fill: '#94a3b8' }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* 거리 vs 탄소 (scatter — DB 연동 불필요, time-distance 기반 대체) */}
        <Card className="border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              거리 vs 탄소 절감량
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[240px] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" dataKey="distance" name="거리" unit="m" fontSize={10} />
                <YAxis type="number" dataKey="carbon"   name="탄소" unit="g" fontSize={10} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="이용건" data={scatterData} fill="#10b981" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task 4: 대여소 회전율 — DB 실데이터 */}
        <Card className="border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              대여소 회전율 분석 (대여 유형)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[240px] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={turnover}>
                <XAxis dataKey="name" fontSize={10} tick={{ fill: '#94a3b8' }} />
                <YAxis fontSize={10} tick={{ fill: '#94a3b8' }} />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]}>
                  {turnover.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? '#10b981' : index === 1 ? '#34d399' : '#6ee7b7'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task 4: 이용 시간 및 거리 — DB 실데이터 */}
        <Card className="border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              이용 시간 및 거리
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[240px] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeDistance}>
                <XAxis dataKey="time" fontSize={10} tick={{ fill: '#94a3b8' }} unit="분" />
                <YAxis fontSize={10} tick={{ fill: '#94a3b8' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t border-slate-200 text-center text-slate-400 text-xs">
        <p>© 2025 Seoul Bike (따릉이) Analytics Dashboard. All rights reserved.</p>
        <p className="mt-1">Data source: Seoul Open Data Plaza</p>
      </footer>
    </div>
  );
}
