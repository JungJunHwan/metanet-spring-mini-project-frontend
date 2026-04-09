import React, { useState } from 'react';
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
import { DISTRICTS, USAGE_DATA } from '../data';
import { motion } from 'motion/react';
import { AuthNav } from '../components/auth/AuthNav';

export default function Dashboard() {
  const [selectedDistrict, setSelectedDistrict] = useState('전체');
  const [selectedMonth, setSelectedMonth] = useState('전체');

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-6 lg:p-8 font-sans text-slate-900">
      {/* Header */}
      <header className="mb-8 flex flex-col gap-4 border-b border-emerald-100 pb-6">
        {/* Top row: brand + auth nav */}
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

          {/* ★ 우측 상단 Auth Nav ★ */}
          <AuthNav />
        </div>

        {/* Bottom row: filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">자치구 선택</label>
            <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
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
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
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
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Metrics */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <MetricCard
            title="총 이용건수"
            value={USAGE_DATA.totalUsage.toLocaleString()}
            unit="건"
            icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
            delay={0.1}
          />
          <MetricCard
            title="활성 사용자"
            value={USAGE_DATA.activeUsers.toLocaleString()}
            unit="명"
            icon={<Users className="w-4 h-4 text-emerald-500" />}
            delay={0.2}
          />
          <MetricCard
            title="총 탄소 절감량"
            value={USAGE_DATA.carbonReduction.toLocaleString()}
            unit="kg CO2"
            icon={<Leaf className="w-4 h-4 text-emerald-500" />}
            delay={0.3}
          />

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
                    data={USAGE_DATA.topStations}
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
              <SeoulMap
                selectedDistrict={selectedDistrict}
                onDistrictSelect={setSelectedDistrict}
              />
              {/* 범례 — CardContent 기준 absolute 배치 */}
              <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1 rounded-lg bg-white/80 backdrop-blur-sm px-3 py-2 shadow-sm ring-1 ring-emerald-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">이용건수</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">596,403</span>
                  <div className="w-28 h-2 rounded-full bg-gradient-to-r from-emerald-100 to-emerald-600" />
                  <span className="text-[10px] text-slate-500">4,549,773</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Charts */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <Card className="border-emerald-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-emerald-500" />
                일별/월별 대여 추이
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[180px] p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={USAGE_DATA.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} tick={{ fill: '#94a3b8' }} />
                  <YAxis fontSize={10} tick={{ fill: '#94a3b8' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="usage" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-emerald-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                시간대별 이용 분포
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[180px] p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={USAGE_DATA.hourlyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="hour" fontSize={10} tick={{ fill: '#94a3b8' }} />
                  <YAxis fontSize={10} tick={{ fill: '#94a3b8' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-emerald-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-500" />
                사용자 인구통계 (성별 및 연령)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[180px] p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={USAGE_DATA.demographics}>
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
                <YAxis type="number" dataKey="carbon" name="탄소" unit="g" fontSize={10} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="이용건" data={USAGE_DATA.scatterData} fill="#10b981" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              대여소 회전율 분석
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[240px] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={USAGE_DATA.turnover}>
                <XAxis dataKey="name" fontSize={10} tick={{ fill: '#94a3b8' }} />
                <YAxis fontSize={10} tick={{ fill: '#94a3b8' }} unit="%" />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]}>
                  {USAGE_DATA.turnover.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#34d399' : '#6ee7b7'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              이용 시간 및 거리
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[240px] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={USAGE_DATA.timeDistance}>
                <XAxis dataKey="time" fontSize={10} tick={{ fill: '#94a3b8' }} />
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
