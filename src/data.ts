import React from 'react';

export const DISTRICTS = [
  '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구',
  '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구',
  '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'
];

export const USAGE_DATA = {
  totalUsage: 1245678,
  activeUsers: 85430,
  carbonReduction: 120500,
  monthlyTrend: [
    { name: '1', usage: 2100, rentals: 1800 },
    { name: '2', usage: 2300, rentals: 2000 },
    { name: '3', usage: 3200, rentals: 2800 },
    { name: '4', usage: 3500, rentals: 3100 },
    { name: '5', usage: 4200, rentals: 3800 },
    { name: '6', usage: 4500, rentals: 4000 },
    { name: '7', usage: 4300, rentals: 3900 },
    { name: '8', usage: 4800, rentals: 4200 },
    { name: '9', usage: 5200, rentals: 4600 },
    { name: '10', usage: 6200, rentals: 5500 },
    { name: '11', usage: 4800, rentals: 4300 },
    { name: '12', usage: 4500, rentals: 4000 },
  ],
  hourlyDistribution: [
    { hour: '0', count: 200 },
    { hour: '3', count: 50 },
    { hour: '6', count: 150 },
    { hour: '9', count: 1200 },
    { hour: '12', count: 1500 },
    { hour: '15', count: 1800 },
    { hour: '18', count: 2200 },
    { hour: '21', count: 1400 },
  ],
  demographics: [
    { name: '성별', value: 75 },
    { name: '20대', value: 45 },
    { name: '30대', value: 65 },
    { name: '40대', value: 25 },
  ],
  topStations: [
    { name: '여의나루역 1번출구', count: 580 },
    { name: '마포역 1번출구', count: 420 },
    { name: '뚝섬유원지역 1번출구', count: 380 },
    { name: '잠실역 2번출구', count: 350 },
    { name: '홍대입구역 2번출구', count: 320 },
    { name: '신도림역 1번출구', count: 300 },
    { name: '고속터미널역 8-1번출구', count: 280 },
    { name: '건대입구역 2번출구', count: 260 },
    { name: '서울역 1번출구', count: 240 },
    { name: '합정역 7번출구', count: 220 },
  ],
  scatterData: Array.from({ length: 50 }, () => ({
    distance: Math.random() * 2000 + 500,
    carbon: Math.random() * 500 + 100,
  })),
  turnover: [
    { name: '대여소', value: 95 },
    { name: '대여소 회전율', value: 60 },
    { name: '이전율', value: 40 },
  ],
  timeDistance: [
    { time: 0, count: 10 },
    { time: 15, count: 40 },
    { time: 30, count: 80 },
    { time: 45, count: 140 },
    { time: 60, count: 180 },
    { time: 75, count: 170 },
    { time: 90, count: 130 },
    { time: 105, count: 90 },
    { time: 120, count: 60 },
    { time: 135, count: 40 },
    { time: 150, count: 20 },
  ]
};
