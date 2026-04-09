import { useState, useEffect, useMemo } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import type { GeoPermissibleObjects, ExtendedFeature } from 'd3-geo'

/**
 * 서울시 자치구 경계 GeoJSON (southkorea/seoul-maps, kostat 2013)
 * TopoJSON 대신 GeoJSON을 직접 fetch → topojson-client 의존성 제거 (Vite 8 rolldown 호환)
 */
const GEO_URL =
  'https://raw.githubusercontent.com/southkorea/seoul-maps/master/kostat/2013/json/seoul_municipalities_geo.json'

// 자치구별 모의 이용건수 (색상 강도 계산용)
const USAGE: Record<string, number> = {
  강남구: 4549773, 송파구: 3812450, 마포구: 3201340, 영등포구: 2987650,
  서초구: 2745320, 관악구: 2512780, 강서구: 2389560, 성동구: 2156890,
  용산구: 2034560, 광진구: 1923450, 동작구: 1812340, 은평구: 1745670,
  노원구: 1698230, 중구: 1587650, 강동구: 1534560, 서대문구: 1423780,
  동대문구: 1312450, 성북구: 1256780, 종로구: 1198650, 강북구: 1087540,
  구로구: 1023450, 양천구: 987650,  중랑구: 865430,  도봉구: 756340,
  금천구: 596403,
}
const MAX_USAGE = Math.max(...Object.values(USAGE))

function usageColor(name: string, selected: boolean): string {
  if (selected) return '#10b981'        // emerald-500
  const ratio = (USAGE[name] ?? 0) / MAX_USAGE
  if (ratio > 0.8) return '#34d399'    // emerald-400
  if (ratio > 0.6) return '#6ee7b7'    // emerald-300
  if (ratio > 0.4) return '#a7f3d0'    // emerald-200
  if (ratio > 0.2) return '#d1fae5'    // emerald-100
  return '#ecfdf5'                      // emerald-50
}

// SVG 뷰박스 크기
const W = 800
const H = 500

interface Props {
  selectedDistrict: string
  onDistrictSelect: (district: string) => void
}

interface GeoFeature extends ExtendedFeature {
  properties: { name?: string; NAME_KOR?: string; SIG_KOR_NM?: string } | null
}

export function SeoulMap({ selectedDistrict, onDistrictSelect }: Props) {
  const [features, setFeatures] = useState<GeoFeature[]>([])
  const [hovered, setHovered] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // d3-geo 프로젝션 — 서울 중심 메르카토르
  const pathGen = useMemo(() => {
    const proj = geoMercator()
      .center([126.986, 37.561])
      .scale(80000)
      .translate([W / 2, H / 2])
    return geoPath(proj)
  }, [])

  useEffect(() => {
    fetch(GEO_URL)
      .then(r => {
        if (!r.ok) throw new Error('network error')
        return r.json()
      })
      .then(data => {
        const feats: GeoFeature[] = data.features ?? []
        setFeatures(feats)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

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
          {USAGE[hovered] && (
            <span className="font-normal text-emerald-300">
              &nbsp;— {USAGE[hovered].toLocaleString()}건
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
          const isHovered = hovered === name
          const d = pathGen(feature as GeoPermissibleObjects)
          if (!d) return null

          return (
            <path
              key={idx}
              d={d}
              fill={usageColor(name, isSelected)}
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
    </div>
  )
}
