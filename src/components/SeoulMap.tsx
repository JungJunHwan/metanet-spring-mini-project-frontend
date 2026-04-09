import React from 'react';
import { motion } from 'motion/react';

interface SeoulMapProps {
  selectedDistrict: string;
  onDistrictSelect: (district: string) => void;
}

// Simplified paths for Seoul districts (approximate)
const DISTRICT_PATHS = [
  { id: '강서구', name: '강서구', d: 'M 50,150 L 100,120 L 150,150 L 130,220 L 70,220 Z' },
  { id: '양천구', name: '양천구', d: 'M 130,220 L 170,220 L 170,260 L 130,260 Z' },
  { id: '구로구', name: '구로구', d: 'M 100,260 L 150,260 L 150,310 L 100,310 Z' },
  { id: '금천구', name: '금천구', d: 'M 150,310 L 190,310 L 190,350 L 150,350 Z' },
  { id: '영등포구', name: '영등포구', d: 'M 170,220 L 230,220 L 230,280 L 170,280 Z' },
  { id: '동작구', name: '동작구', d: 'M 230,280 L 280,280 L 280,330 L 230,330 Z' },
  { id: '관악구', name: '관악구', d: 'M 230,330 L 300,330 L 300,380 L 230,380 Z' },
  { id: '마포구', name: '마포구', d: 'M 150,150 L 220,150 L 220,210 L 150,210 Z' },
  { id: '서대문구', name: '서대문구', d: 'M 220,150 L 270,150 L 270,200 L 220,200 Z' },
  { id: '은평구', name: '은평구', d: 'M 200,80 L 270,80 L 270,140 L 200,140 Z' },
  { id: '종로구', name: '종로구', d: 'M 270,100 L 330,100 L 330,160 L 270,160 Z' },
  { id: '중구', name: '중구', d: 'M 270,160 L 330,160 L 330,210 L 270,210 Z' },
  { id: '용산구', name: '용산구', d: 'M 270,210 L 330,210 L 330,270 L 270,270 Z' },
  { id: '서초구', name: '서초구', d: 'M 330,270 L 400,270 L 400,380 L 330,380 Z' },
  { id: '강남구', name: '강남구', d: 'M 400,270 L 470,270 L 470,380 L 400,380 Z' },
  { id: '송파구', name: '송파구', d: 'M 470,270 L 550,270 L 550,380 L 470,380 Z' },
  { id: '강동구', name: '강동구', d: 'M 550,220 L 620,220 L 620,300 L 550,300 Z' },
  { id: '성동구', name: '성동구', d: 'M 330,180 L 400,180 L 400,240 L 330,240 Z' },
  { id: '광진구', name: '광진구', d: 'M 400,180 L 470,180 L 470,240 L 400,240 Z' },
  { id: '동대문구', name: '동대문구', d: 'M 380,120 L 450,120 L 450,180 L 380,180 Z' },
  { id: '중랑구', name: '중랑구', d: 'M 450,120 L 520,120 L 520,180 L 450,180 Z' },
  { id: '성북구', name: '성북구', d: 'M 330,80 L 420,80 L 420,140 L 330,140 Z' },
  { id: '강북구', name: '강북구', d: 'M 350,20 L 420,20 L 420,80 L 350,80 Z' },
  { id: '도봉구', name: '도봉구', d: 'M 420,20 L 480,20 L 480,80 L 420,80 Z' },
  { id: '노원구', name: '노원구', d: 'M 480,20 L 580,20 L 580,120 L 480,120 Z' },
];

export const SeoulMap: React.FC<SeoulMapProps> = ({ selectedDistrict, onDistrictSelect }) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      <svg
        viewBox="0 0 650 400"
        className="w-full h-full max-h-[500px]"
        style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}
      >
        {DISTRICT_PATHS.map((district) => {
          const isSelected = selectedDistrict === district.name;
          // Generate a random green intensity for the choropleth effect
          const intensity = Math.floor(Math.random() * 50) + 20;
          const fillColor = isSelected ? '#10b981' : `rgba(16, 185, 129, 0.${intensity})`;

          return (
            <motion.path
              key={district.id}
              d={district.d}
              fill={fillColor}
              stroke="#fff"
              strokeWidth="2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02, fill: '#059669', transition: { duration: 0.2 } }}
              onClick={() => onDistrictSelect(district.name)}
              className="cursor-pointer transition-colors duration-200"
            >
              <title>{district.name}</title>
            </motion.path>
          );
        })}
        {DISTRICT_PATHS.map((district) => {
          // Calculate center of path (very rough approximation)
          const coords = district.d.match(/\d+/g)?.map(Number) || [];
          if (coords.length < 4) return null;
          const centerX = (coords[0] + coords[2]) / 2;
          const centerY = (coords[1] + coords[3]) / 2;

          return (
            <text
              key={`${district.id}-label`}
              x={centerX}
              y={centerY}
              textAnchor="middle"
              className="text-[10px] font-bold pointer-events-none fill-slate-800"
            >
              {district.name}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
