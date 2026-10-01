'use client';

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#6366F1'];

interface RecruitmentAnalyticsChartsProps {
  variant: 'pipeline' | 'department';
  pipelineFunnel: Array<{ stage: string; count: number }>;
  applicationsByDepartment: Array<{ departmentName: string; count: number }>;
}

export default function RecruitmentAnalyticsCharts({ variant, pipelineFunnel, applicationsByDepartment }: RecruitmentAnalyticsChartsProps) {
  if (variant === 'pipeline') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={pipelineFunnel} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
          <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="count" fill="#F59E0B" radius={[6, 6, 0, 0]}>
            {pipelineFunnel.map((_, index) => (
              <Cell key={`pipeline-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <>
      {applicationsByDepartment.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={applicationsByDepartment}
              dataKey="count"
              nameKey="departmentName"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} (${((percent || 0) * 100).toFixed(0)}%)`}
            >
              {applicationsByDepartment.map((_, index) => (
                <Cell key={`department-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      ) : null}
    </>
  );
}
