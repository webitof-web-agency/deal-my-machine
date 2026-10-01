'use client';

import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface PlatformGrowthPoint {
  name: string;
  partners: number;
  listings: number;
}

interface PlatformGrowthChartProps {
  data: PlatformGrowthPoint[];
}

export default function PlatformGrowthChart({ data }: PlatformGrowthChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorPartners" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorListings" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FFC107" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#FFC107" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
        <Tooltip
          contentStyle={{
            borderRadius: '12px',
            border: 'none',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          }}
        />
        <Legend verticalAlign="top" height={36} iconType="circle" />
        <Area type="monotone" name="New Partners" dataKey="partners" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorPartners)" />
        <Area type="monotone" name="New Listings" dataKey="listings" stroke="#FFC107" strokeWidth={3} fillOpacity={1} fill="url(#colorListings)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
