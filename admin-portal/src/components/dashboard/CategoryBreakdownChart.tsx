'use client';

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { getCategoryChartColor } from '@/lib/dashboardChartConfig.mjs';

export interface CategoryBreakdownPoint {
  name: string;
  value: number;
}

interface CategoryBreakdownChartProps {
  data: CategoryBreakdownPoint[];
}

export default function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} cx="50%" cy="45%" innerRadius={65} outerRadius={100} paddingAngle={5} dataKey="value" nameKey="name">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getCategoryChartColor(index)} strokeWidth={0} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          wrapperStyle={{
            fontSize: '12px',
            fontWeight: 500,
            paddingTop: '20px',
            lineHeight: '1.5',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
