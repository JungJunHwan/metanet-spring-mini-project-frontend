import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { ArrowLeft, Scale, Bike, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '../components/ui/Skeleton';
import { DISTRICTS } from '../data';
import {
  fetchTotalUsage,
  fetchTotalCarbon,
  fetchDistanceCarbon,
  fetchTimeDistance,
} from '../api/bikeApi';

// ========================================================
// 타입 정의
// ========================================================
interface FilterState {
  district: string;
  month: string;
}

interface GroupMetrics {
  totalUsage: number;     // 총 이용건수
  avgDistance: number;    // 평균 주행거리 (m)
  avgUseTime: number;     // 평균 이용시간 (분)
  avgCarbon: number;      // 1건당 탄소 절감량 (g)
}

// 레이더 차트용 데이터 포맷
interface RadarDataPoint {
  subject: string;
  A: number;
  B: number;
  fullMark: number;
}

// ========================================================
// API Fetch 로직 (한 그룹의 4가지 지표를 불러와 계산)
// ========================================================
const fetchGroupMetrics = async (
  filter: FilterState,
  signal: AbortSignal
): Promise<GroupMetrics> => {
  const district = filter.district === 'ALL' ? undefined : filter.district;
  const month = filter.month === 'ALL' ? undefined : parseInt(filter.month);

  // 1. 총 이용건수
  const usageRes = await fetchTotalUsage(district, month, signal);
  const totalUsage = usageRes.data ?? 0;

  // 2. 총 탄소절감량 -> 평균 탄소 계산
  const carbonRes = await fetchTotalCarbon(district, month, signal);
  const totalCarbon = carbonRes.data ?? 0;
  const avgCarbon = totalUsage > 0 ? totalCarbon / totalUsage : 0;

  // 3. 거리 vs 탄소절감 (평균 거리 계산)
  const distCarbonRes = await fetchDistanceCarbon(district, month, signal);
  let totalDistanceSum = 0;
  let totalDistanceCount = 0;
  (distCarbonRes.data ?? []).forEach((d: any) => {
    // d.distance: 주행거리, d.weight: 해당 거리를 주행한 이용건수
    if (d.distance != null && d.weight != null) {
      totalDistanceSum += Number(d.distance) * Number(d.weight);
      totalDistanceCount += Number(d.weight);
    }
  });
  const avgDistance = totalDistanceCount > 0 ? totalDistanceSum / totalDistanceCount : 0;

  // 4. 이용시간 vs 대여건 (평균 이용시간 계산)
  const timeDistRes = await fetchTimeDistance(district, month, signal);
  let totalTimeSum = 0;
  let totalTimeCount = 0;
  (timeDistRes.data ?? []).forEach((d: any) => {
    if (d.useTime != null && d.totalDistance != null) {
      totalTimeSum += Number(d.useTime) * Number(d.totalDistance);
      totalTimeCount += Number(d.totalDistance);
    }
  });
  const avgUseTime = totalTimeCount > 0 ? totalTimeSum / totalTimeCount : 0;

  return {
    totalUsage: Math.round(totalUsage),
    avgDistance: Math.round(avgDistance),
    avgUseTime: Math.round(avgUseTime * 10) / 10, // 소수점 첫째자리
    avgCarbon: Math.round(avgCarbon * 10) / 10,
  };
};

// ========================================================
// 컴포넌트 메인
// ========================================================
export default function CompareAnalysis() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 상태 관리
  const [filterA, setFilterA] = useState<FilterState>({ district: 'ALL', month: 'ALL' });
  const [filterB, setFilterB] = useState<FilterState>({ district: 'ALL', month: 'ALL' });

  const [metricsA, setMetricsA] = useState<GroupMetrics | null>(null);
  const [metricsB, setMetricsB] = useState<GroupMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 데이터 로드 및 취소 처리
  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 병렬 요청
        const [resA, resB] = await Promise.all([
          fetchGroupMetrics(filterA, controller.signal),
          fetchGroupMetrics(filterB, controller.signal)
        ]);
        
        if (!controller.signal.aborted) {
          setMetricsA(resA);
          setMetricsB(resB);
        }
      } catch (err: any) {
        if (!controller.signal.aborted && err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
          setError(t('dashboard.dataError', { defaultValue: '데이터 로딩 중 오류가 발생했습니다.' }));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadData();

    // 클린업 함수: 의존성(필터)이 변경되거나 컴포넌트가 언마운트될 때 이전 요청 즉시 취소
    return () => controller.abort();
  }, [filterA, filterB, t]);


  // 그룹 라벨 생성 헬퍼
  const getGroupLabel = (f: FilterState) => {
    const dist = f.district === 'ALL' ? t('filter.allDistrict', { defaultValue: '전체 서울시' }) : t(`districts.${f.district}`, { defaultValue: f.district });
    const m = f.month === 'ALL' ? t('filter.allMonth', { defaultValue: '전체 월' }) : t('filter.month', { n: f.month });
    return `${dist} / ${m}`;
  };

  const labelA = getGroupLabel(filterA);
  const labelB = getGroupLabel(filterB);

  // 데이터 정규화 (Radar 차트에 예쁘게 보이려면 0~100 사이의 상대 점수로 환산 필요)
  // 최대값을 100으로 잡고 백분율화
  const processRadarData = (): RadarDataPoint[] => {
    if (!metricsA || !metricsB) return [];

    const norm = (a: number, b: number) => {
      const max = Math.max(a, b);
      if (max === 0) return { aNorm: 0, bNorm: 0 };
      return {
        aNorm: Math.round((a / max) * 100),
        bNorm: Math.round((b / max) * 100),
      };
    };

    const usage = norm(metricsA.totalUsage, metricsB.totalUsage);
    const distance = norm(metricsA.avgDistance, metricsB.avgDistance);
    const time = norm(metricsA.avgUseTime, metricsB.avgUseTime);
    const carbon = norm(metricsA.avgCarbon, metricsB.avgCarbon);

    return [
      { subject: t('compare.radarUsage', { defaultValue: '최대 수요' }), A: usage.aNorm, B: usage.bNorm, fullMark: 100 },
      { subject: t('compare.radarDistance', { defaultValue: '장거리 성향' }), A: distance.aNorm, B: distance.bNorm, fullMark: 100 },
      { subject: t('compare.radarTime', { defaultValue: '장시간 성향' }), A: time.aNorm, B: time.bNorm, fullMark: 100 },
      { subject: t('compare.radarCarbon', { defaultValue: '친환경 스코어' }), A: carbon.aNorm, B: carbon.bNorm, fullMark: 100 },
    ];
  };

  const radarData = processRadarData();

  // 필터 UI 생성기
  const renderFilter = (
    title: string,
    filter: FilterState,
    setFilter: React.Dispatch<React.SetStateAction<FilterState>>,
    colorClass: string
  ) => (
    <Card className={`border-l-4 ${colorClass} shadow-sm overflow-visible`}>
      <CardHeader className="pb-3 pt-4">
        <CardTitle className="text-sm font-bold text-slate-700">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-4">
        <div className="flex-1 space-y-1">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t('filter.districtLabel', { defaultValue: '자치구' })}</label>
          <Select value={filter.district} onValueChange={(v) => setFilter(prev => ({ ...prev, district: v }))}>
            <SelectTrigger className="w-full bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('filter.allDistrict', { defaultValue: '전체 자치구' })}</SelectItem>
              {DISTRICTS.map(d => (
                <SelectItem key={d} value={d}>
                  {t(`districts.${d}`, { defaultValue: d })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t('filter.monthLabel', { defaultValue: '월' })}</label>
          <Select value={filter.month} onValueChange={(v) => setFilter(prev => ({ ...prev, month: v }))}>
            <SelectTrigger className="w-full bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('filter.allMonth', { defaultValue: '전체 월' })}</SelectItem>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={`${i + 1}`}>
                  {t('filter.month', { n: i + 1 })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-6 lg:p-8 font-sans text-slate-900">

      {/* Header */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
            title={t('compare.backToDash', { defaultValue: '돌아가기' })}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="bg-emerald-500 p-2 rounded-xl">
            <Scale className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {t('compare.title', { defaultValue: '다중 조건 비교 분석' })}
            </h1>
            <p className="text-sm text-slate-500">
              {t('compare.subtitle', { defaultValue: '두 그룹의 이용 패턴을 시각적으로 비교합니다.' })}
            </p>
          </div>
        </div>
      </header>

      {/* Filters (Top) */}
      <div className="flex flex-row gap-6 mb-8 w-full">
        <div className="flex-1">
          {renderFilter(t('compare.groupA', { defaultValue: '그룹 A' }), filterA, setFilterA, 'border-l-rose-500')}
        </div>
        <div className="flex-1">
          {renderFilter(t('compare.groupB', { defaultValue: '그룹 B' }), filterB, setFilterB, 'border-l-indigo-500')}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-500" />
          <p className="text-sm font-medium tracking-wide">{t('compare.loading')}</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg text-center font-medium">
          {error}
        </div>
      )}

      {/* 메인 분석 결과 (차트 & 테이블) */}
      {!loading && !error && metricsA && metricsB && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">

          {/* 아티클 영역: 레이더 차트 (정규화된 점수) */}
          <Card className="shadow-lg border-none bg-white">
            <CardHeader className="text-center pb-0 pt-6">
              <CardTitle className="text-lg text-slate-800 font-bold">{t('compare.radarTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="w-full p-6 relative flex justify-center items-center">
              {/* ResponsiveContainer에 명시적인 height를 주어 렌더링 붕괴 방지 */}
              <div style={{ width: '100%', height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="70%">
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                    {/* 도메인은 0~100 (정규화 백분율) */}
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />

                    <Radar name={labelA} dataKey="A" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.4} strokeWidth={2} />
                    <Radar name={labelB} dataKey="B" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} strokeWidth={2} />

                    <Tooltip
                      formatter={(value: number) => [`${value}점`, 'Score']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 패널 영역: 정확한 수치 비교 패널 */}
          <Card className="shadow-sm border-slate-200 bg-white">
            <CardHeader className="pb-4 pt-6 border-b border-slate-100">
              <CardTitle className="text-md font-bold text-slate-700 flex items-center justify-between">
                <span>{t('compare.tableTitle')}</span>
                <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded">{t('compare.rawDataBadge')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-[1fr_128px_1fr] w-full bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase py-3 px-4">
                <div className="flex justify-center text-rose-600 font-bold px-2 truncate items-center text-center">{labelA}</div>
                <div className="flex justify-center items-center text-center">{t('compare.metricHeader')}</div>
                <div className="flex justify-center text-indigo-600 font-bold px-2 truncate items-center text-center">{labelB}</div>
              </div>

              <div className="flex flex-col px-4">
                <ComparisonRow
                  label={t('compare.rawUsage', { defaultValue: '총 이용건수 (건)' })}
                  valA={metricsA.totalUsage}
                  valB={metricsB.totalUsage}
                  isCurrency={true}
                />
                <ComparisonRow
                  label={t('compare.rawDistance', { defaultValue: '평균 주행거리 (m)' })}
                  valA={metricsA.avgDistance}
                  valB={metricsB.avgDistance}
                  isCurrency={true}
                />
                <ComparisonRow
                  label={t('compare.rawTime', { defaultValue: '평균 이용시간 (분)' })}
                  valA={metricsA.avgUseTime}
                  valB={metricsB.avgUseTime}
                />
                <ComparisonRow
                  label={t('compare.rawCarbon', { defaultValue: '건당 탄소절감 (g)' })}
                  valA={metricsA.avgCarbon}
                  valB={metricsB.avgCarbon}
                />
              </div>
            </CardContent>
          </Card>

        </div>
      )}

    </div>
  );
}

// ========================================================
// 수치 비교용 Row 컴포넌트
// ========================================================
function ComparisonRow({ label, valA, valB, isCurrency = false }: { label: string, valA: number, valB: number, isCurrency?: boolean }) {
  const { t } = useTranslation();
  const winner = valA > valB ? 'A' : valB > valA ? 'B' : 'TIE';

  const format = (num: number) => isCurrency ? num.toLocaleString() : num.toString();

  return (
    <div className="grid grid-cols-[1fr_128px_1fr] w-full py-4 hover:bg-slate-50 transition-colors items-center border-b border-slate-100 last:border-0">
      <div className={`flex flex-col justify-center items-center px-2 ${winner === 'A' ? 'text-rose-600 font-bold' : 'text-slate-600 font-medium'}`}>
        <span className="text-lg">{format(valA)}</span>
        {winner === 'A' && <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-sm mt-1">{t('compare.advantage')}</span>}
      </div>
      <div className="flex items-center justify-center text-sm font-semibold text-slate-700 text-center">
        {label}
      </div>
      <div className={`flex flex-col justify-center items-center px-2 ${winner === 'B' ? 'text-indigo-600 font-bold' : 'text-slate-600 font-medium'}`}>
        <span className="text-lg">{format(valB)}</span>
        {winner === 'B' && <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-sm mt-1">{t('compare.advantage')}</span>}
      </div>
    </div>
  );
}
