import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { geoMercator, geoPath } from 'd3-geo'
import type { GeoPermissibleObjects, ExtendedFeature } from 'd3-geo'
import type { DistrictUsageItem } from '../api/bikeApi'

/**
 * 서울시 자치구 경계 GeoJSON (southkorea/seoul-maps, kostat 2013)
 */
const GEO_URL =
  'https://raw.githubusercontent.com/southkorea/seoul-maps/master/kostat/2013/json/seoul_municipalities_geo.json'

// SVG 뷰박스 크기
const W = 800
const H = 500

interface Props {
  selectedDistrict: string
  onDistrictSelect: (district: string) => void
  /** Task 4: DB에서 받아온 자치구별 이용건수 데이터 */
  districtUsage?: DistrictUsageItem[]
}

interface GeoFeature extends ExtendedFeature {
  properties: { name?: string; NAME_KOR?: string; SIG_KOR_NM?: string } | null
}

/**
 * DB 데이터 기반 색상 계산
 * - usageMap: 구 이름 → 이용건수 (DB에서 받아온 동적 데이터)
 * - maxUsage: 전체 구 중 최대 이용건수
 * - 이용량이 많을수록 짙은 녹색 (5단계 분기)
 */
function buildColorFn(
  usageMap: Record<string, number>,
  maxUsage: number,
): (name: string, selected: boolean) => string {
  return (name, selected) => {
    if (selected) return '#10b981'           // emerald-500 (선택된 구)
    if (maxUsage === 0) return '#ecfdf5'     // 데이터 없으면 최소 색상
    const ratio = (usageMap[name] ?? 0) / maxUsage
    if (ratio > 0.8) return '#059669'        // emerald-600 (최고)
    if (ratio > 0.6) return '#34d399'        // emerald-400
    if (ratio > 0.4) return '#6ee7b7'        // emerald-300
    if (ratio > 0.2) return '#a7f3d0'        // emerald-200
    if (ratio > 0)   return '#d1fae5'        // emerald-100
    return '#ecfdf5'                         // emerald-50 (데이터 없는 구)
  }
}

export function SeoulMap({ selectedDistrict, onDistrictSelect, districtUsage = [] }: Props) {
  const [features, setFeatures] = useState<GeoFeature[]>([])
  const [hovered, setHovered]   = useState('')
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)

  // ── d3-geo 프로젝션 — 서울 중심 메르카토르
  const pathGen = useMemo(() => {
    const proj = geoMercator()
      .center([126.986, 37.561])
      .scale(80000)
      .translate([W / 2, H / 2])
    return geoPath(proj)
  }, [])

  // ── GeoJSON 로드 (axios — XHR 기반 AJAX, bikeApi.ts 동일 라이브러리 통일)
  useEffect(() => {
    axios.get<{ features: GeoFeature[] }>(GEO_URL)
      .then(res => setFeatures(res.data.features ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  // ── Task 4: DB 데이터 → Record<string, number> 변환
  // GeoJSON의 구 이름(예: '강남구')과 DB district 값을 매칭
  const { usageMap, maxUsage, minUsage } = useMemo(() => {
    if (districtUsage.length === 0) return { usageMap: {}, maxUsage: 0, minUsage: 0 }
    const map: Record<string, number> = {}
    districtUsage.forEach(({ district, usageCount }) => {
      // DB 값이 '강남구 ' 처럼 공백을 포함할 수 있으므로 trim() 처리
      map[district.trim()] = Number(usageCount)
    })
    const values = Object.values(map)
    return {
      usageMap: map,
      maxUsage: Math.max(...values),
      minUsage: Math.min(...values),
    }
  }, [districtUsage])

  // ── 동적 색상 함수 생성
  const getColor = useMemo(() => buildColorFn(usageMap, maxUsage), [usageMap, maxUsage])

  if (loading) {
    return (
      <div className="flex w-full h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-200 border-t-emerald-500" />
          <span className="text-xs text-slate-400">지도 로딩 중...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex w-full h-full items-center justify-center">
        <p className="text-xs text-red-400">지도 데이터를 불러오지 못했습니다.</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* 호버 툴팁 */}
      {hovered && (
        <div className="pointer-events-none absolute top-3 left-1/2 z-20 -translate-x-1/2 select-none rounded-lg bg-slate-800/90 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-sm flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
          {hovered}
          {usageMap[hovered] != null && (
            <span className="font-normal text-emerald-300">
              &nbsp;— {usageMap[hovered].toLocaleString()}건
            </span>
          )}
        </div>
      )}

      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: '100%' }}
        aria-label="서울시 자치구 지도"
      >
        {features.map((feature, idx) => {
          const name =
            feature.properties?.name ??
            feature.properties?.NAME_KOR ??
            feature.properties?.SIG_KOR_NM ??
            ''
          const isSelected = selectedDistrict === name
          const isHovered  = hovered === name
          const d = pathGen(feature as GeoPermissibleObjects)
          if (!d) return null

          return (
            <path
              key={idx}
              d={d}
              fill={getColor(name, isSelected)}
              stroke="#ffffff"
              strokeWidth={isSelected || isHovered ? 2 : 1.2}
              style={{
                cursor: 'pointer',
                transition: 'fill 0.18s, filter 0.18s',
                filter:
                  isSelected
                    ? 'drop-shadow(0 0 6px rgba(16,185,129,0.55))'
                    : isHovered
                    ? 'drop-shadow(0 0 3px rgba(52,211,153,0.4))'
                    : 'none',
              }}
              onClick={() => onDistrictSelect(name)}
              onMouseEnter={() => setHovered(name)}
              onMouseLeave={() => setHovered('')}
            >
              <title>{name}</title>
            </path>
          )
        })}

        {/* 자치구 이름 레이블 */}
        {features.map((feature, idx) => {
          const name =
            feature.properties?.name ??
            feature.properties?.NAME_KOR ??
            feature.properties?.SIG_KOR_NM ??
            ''
          const centroid = pathGen.centroid(feature as GeoPermissibleObjects)
          if (!centroid || isNaN(centroid[0])) return null

          return (
            <text
              key={`label-${idx}`}
              x={centroid[0]}
              y={centroid[1]}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={9}
              fontWeight={600}
              fill="#1e293b"
              pointerEvents="none"
              style={{ userSelect: 'none' }}
            >
              {name}
            </text>
          )
        })}
      </svg>

      {/* 범례: DB 데이터 최솟값~최댓값 표시 */}
      {maxUsage > 0 && (
        <div className="absolute bottom-1 left-4 z-10 flex flex-col gap-1 rounded-lg bg-white/80 backdrop-blur-sm px-3 py-2 shadow-sm ring-1 ring-emerald-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">이용건수</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">{minUsage.toLocaleString()}</span>
            <div className="w-28 h-2 rounded-full bg-gradient-to-r from-emerald-100 to-emerald-600" />
            <span className="text-[10px] text-slate-500">{maxUsage.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  )
}
