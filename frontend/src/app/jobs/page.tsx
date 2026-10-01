'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  MapPin,
  Clock,
  Building2,
  Search,
  Filter,
  Users,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import api from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';

interface JobDepartment {
  id: string;
  name: string;
  code: string;
}

interface JobItem {
  id: string;
  title: string;
  slug: string;
  jobCode: string;
  vacancies: number;
  employmentType: string;
  workMode: string;
  locationCity: string;
  locationState: string;
  minExperience: number;
  maxExperience: number | null;
  minSalary: number | null;
  maxSalary: number | null;
  currency: string;
  salaryVisibility: boolean;
  summary: string | null;
  description: string;
  postedAt: string | null;
  deadline: string | null;
  department: {
    id: string;
    name: string;
    code: string;
  };
}

interface PublicJobsResponse {
  success?: boolean;
  jobs?: JobItem[];
  departments?: JobDepartment[];
}

type JobDropdownOption = {
  value: string;
  label: string;
};

type JobDropdownProps = {
  value: string;
  placeholder: string;
  options: JobDropdownOption[];
  onChange: (value: string) => void;
  icon: LucideIcon;
};

const JobDropdown = ({ value, placeholder, options, onChange, icon: Icon }: JobDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-left text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-[#FFC107] focus:ring-2 focus:ring-[#FFC107]/20"
      >
        <Icon className="h-4 w-4 shrink-0 text-slate-500" />
        <span className={`min-w-0 flex-1 truncate ${selectedOption ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>{selectedOption?.label || placeholder}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white p-1.5 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.25)]">
          <div className="max-h-64 space-y-0.5 overflow-y-auto">
            <button type="button" onClick={() => { onChange(''); setIsOpen(false); }} className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-xs transition-colors ${!value ? 'bg-amber-50/80 font-bold text-gray-950' : 'font-medium text-gray-700 hover:bg-gray-100'}`}>
              <span className="text-[13px]">{placeholder}</span>
              {!value ? <Check className="h-4 w-4 shrink-0 text-[#E5A700] stroke-[2.5]" /> : null}
            </button>
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button key={option.value} type="button" onClick={() => { onChange(option.value); setIsOpen(false); }} className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-xs transition-colors ${isSelected ? 'bg-amber-50/80 font-bold text-gray-950' : 'font-medium text-gray-700 hover:bg-gray-100'}`}>
                  <span className="text-[13px]">{option.label}</span>
                  {isSelected ? <Check className="h-4 w-4 shrink-0 text-[#E5A700] stroke-[2.5]" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default function JobsPage() {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [departments, setDepartments] = useState<JobDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedEmploymentType, setSelectedEmploymentType] = useState('');
  const [selectedWorkMode, setSelectedWorkMode] = useState('');
  const [selectedExperience, setSelectedExperience] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string> = {
        sortBy,
      };

      if (searchTerm.trim()) params.q = searchTerm.trim();
      if (selectedDepartment) params.departmentId = selectedDepartment;
      if (selectedLocation.trim()) params.location = selectedLocation.trim();
      if (selectedEmploymentType) params.employmentType = selectedEmploymentType;
      if (selectedWorkMode) params.workMode = selectedWorkMode;
      if (selectedExperience) params.experienceLevel = selectedExperience;

      const res = await api.get<PublicJobsResponse>('/recruitment/public/jobs', { params });
      if (res.data?.success) {
        setJobs(res.data.jobs || []);
        if (res.data.departments) {
          setDepartments(res.data.departments);
        }
      }
    } catch (err: unknown) {
      console.error('Failed to load jobs:', err);
      setError(t('careers.unableToLoad', 'Unable to load job postings right now. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedDepartment, selectedEmploymentType, selectedExperience, selectedLocation, selectedWorkMode, sortBy, t]);

  // Search is submitted explicitly; filters re-fetch using the latest search term.
  // The callback is intentionally excluded so typing does not trigger a request.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchJobs();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [selectedDepartment, selectedEmploymentType, selectedExperience, selectedWorkMode, sortBy]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return t('careers.bestInIndustry', 'Best in Industry');
    const formatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
    if (min && max) return `₹${formatter.format(min)} - ₹${formatter.format(max)} / yr`;
    if (min) return `From ₹${formatter.format(min)} / yr`;
    return `Up to ₹${formatter.format(max!)} / yr`;
  };

  const formatEmploymentType = (type: string) => {
    switch (type) {
      case 'FULL_TIME': return t('careers.fullTime', 'Full Time');
      case 'PART_TIME': return t('careers.partTime', 'Part Time');
      case 'CONTRACT': return t('careers.contract', 'Contract');
      case 'INTERNSHIP': return t('careers.internship', 'Internship');
      case 'FREELANCE': return t('careers.freelance', 'Freelance');
      default: return type;
    }
  };

  const formatWorkMode = (mode: string) => {
    switch (mode) {
      case 'ON_SITE': return t('careers.onSite', 'On-site');
      case 'REMOTE': return t('careers.remote', 'Remote');
      case 'HYBRID': return t('careers.hybrid', 'Hybrid');
      default: return mode;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-amber-950 text-white py-10 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent opacity-60"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          {/* Search Box inside Hero */}
          <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto pt-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 bg-white/10 p-2 rounded-2xl border border-white/20 backdrop-blur-md shadow-2xl">
              <div className="relative flex-1 w-full flex items-center">
                <Search size={18} className="absolute left-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('careers.searchPlaceholder', 'Job title, keyword, or skill...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white text-gray-900 rounded-xl placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="relative w-full sm:w-48 flex items-center">
                <MapPin size={18} className="absolute left-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('careers.locationPlaceholder', 'City or State')}
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white text-gray-900 rounded-xl placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <span>{t('careers.searchJobs', 'Search Jobs')}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow">
        {/* Filters and Sorting Toolbar */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 mb-8 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <Filter size={16} className="text-amber-600 shrink-0" />
              <span>{t('careers.filterTitle', 'Filter Job Openings')}</span>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
              <span className="text-xs text-gray-500 font-medium shrink-0">{t('careers.sortBy', 'Sort by:')}</span>
              <div className="w-44">
                <JobDropdown
                  value={sortBy}
                  placeholder={t('careers.sortBy', 'Sort by:')}
                  icon={Calendar}
                  options={[
                    { value: 'latest', label: t('careers.sortLatest', 'Latest First') },
                    { value: 'oldest', label: t('careers.sortOldest', 'Oldest First') },
                    { value: 'closingSoon', label: t('careers.sortClosingSoon', 'Closing Soon') },
                  ]}
                  onChange={setSortBy}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Department Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('careers.department', 'Department')}</label>
              <JobDropdown
                value={selectedDepartment}
                placeholder={t('careers.allDepartments', 'All Departments')}
                icon={Building2}
                options={departments.map((dept) => ({ value: dept.id, label: dept.name }))}
                onChange={setSelectedDepartment}
              />
            </div>

            {/* Employment Type Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('careers.employmentType', 'Employment Type')}</label>
              <JobDropdown
                value={selectedEmploymentType}
                placeholder={t('careers.allTypes', 'All Types')}
                icon={Briefcase}
                options={[
                  { value: 'FULL_TIME', label: t('careers.fullTime', 'Full Time') },
                  { value: 'PART_TIME', label: t('careers.partTime', 'Part Time') },
                  { value: 'CONTRACT', label: t('careers.contract', 'Contract') },
                  { value: 'INTERNSHIP', label: t('careers.internship', 'Internship') },
                  { value: 'FREELANCE', label: t('careers.freelance', 'Freelance') },
                ]}
                onChange={setSelectedEmploymentType}
              />
            </div>

            {/* Work Mode Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('careers.workMode', 'Work Mode')}</label>
              <JobDropdown
                value={selectedWorkMode}
                placeholder={t('careers.allModes', 'All Modes')}
                icon={Building2}
                options={[
                  { value: 'ON_SITE', label: t('careers.onSite', 'On-site') },
                  { value: 'REMOTE', label: t('careers.remote', 'Remote') },
                  { value: 'HYBRID', label: t('careers.hybrid', 'Hybrid') },
                ]}
                onChange={setSelectedWorkMode}
              />
            </div>

            {/* Experience Level Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('careers.experienceLevel', 'Experience Level')}</label>
              <JobDropdown
                value={selectedExperience}
                placeholder={t('careers.anyExperience', 'Any Experience')}
                icon={Users}
                options={[
                  { value: 'FRESHER', label: t('careers.fresher', 'Fresher (0-1 yrs)') },
                  { value: 'JUNIOR', label: t('careers.junior', 'Junior (1-3 yrs)') },
                  { value: 'MID_LEVEL', label: t('careers.midLevel', 'Mid Level (3-6 yrs)') },
                  { value: 'SENIOR', label: t('careers.senior', 'Senior (5+ yrs)') },
                ]}
                onChange={setSelectedExperience}
              />
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">
            {t('careers.openVacancies', 'Open Vacancies')} {!loading && `(${jobs.length})`}
          </h2>
          {(selectedDepartment || selectedEmploymentType || selectedWorkMode || selectedExperience || searchTerm || selectedLocation) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDepartment('');
                setSelectedLocation('');
                setSelectedEmploymentType('');
                setSelectedWorkMode('');
                setSelectedExperience('');
              }}
              className="text-xs font-medium text-amber-600 hover:text-amber-700 underline"
            >
              {t('careers.clearAllFilters', 'Clear all filters')}
            </button>
          )}
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-6 border border-gray-200/80 animate-pulse space-y-4">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                <div className="h-12 bg-gray-50 rounded"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center space-y-3">
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={fetchJobs}
              className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-all"
            >
              {t('careers.tryAgain', 'Try Again')}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && jobs.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600">
              <Briefcase size={28} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{t('careers.noJobsTitle', 'No Jobs Match Your Filter Criteria')}</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              {t('careers.noJobsSubtitle', "We couldn't find any active job postings matching your current search parameters. Try clearing some filters or searching with different keywords.")}
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDepartment('');
                setSelectedLocation('');
                setSelectedEmploymentType('');
                setSelectedWorkMode('');
                setSelectedExperience('');
              }}
              className="px-5 py-2.5 bg-amber-500 text-gray-950 font-bold text-xs rounded-xl hover:bg-amber-600 transition-all shadow-sm"
            >
              {t('careers.resetFilters', 'Reset Search Filters')}
            </button>
          </div>
        )}

        {/* Jobs Grid */}
        {!loading && !error && jobs.length > 0 && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-6">
            {jobs.map((job) => (
              <article
                key={job.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#FFC107] hover:shadow-[0_16px_36px_-18px_rgba(15,23,42,0.45)] sm:p-6"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#FFC107] via-amber-400 to-[#F59E0B] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="space-y-5">
                  {/* Top Badge Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/70 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
                      <Building2 size={12} />
                      {job.department?.name || 'Department'}
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                      {formatWorkMode(job.workMode)}
                    </span>
                  </div>

                  {/* Title & Location */}
                  <div>
                    <h3 className="line-clamp-2 text-xl font-extrabold leading-snug text-slate-950 transition-colors group-hover:text-[#C88700]">
                      <Link href={`/jobs/${job.slug}`}>
                        {job.title}
                      </Link>
                    </h3>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5">
                        <MapPin size={13} className="text-slate-400" />
                        {job.locationCity}, {job.locationState}
                      </span>

                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5">
                        <Clock size={13} className="text-slate-400" />
                        {formatEmploymentType(job.employmentType)}
                      </span>

                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5">
                        <Briefcase size={13} className="text-slate-400" />
                        {job.minExperience} - {job.maxExperience ? `${job.maxExperience} ${t('careers.yrsLabel', 'yrs')}` : t('careers.yrsPlusLabel', 'yrs+')}
                      </span>
                    </div>
                  </div>

                  {/* Summary */}
                  {job.summary && (
                    <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
                      {job.summary}
                    </p>
                  )}

                  {/* Metadata Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs">
                    <div className="rounded-xl bg-amber-50/70 p-3">
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-amber-700">{t('careers.salaryRange', 'Salary Range')}</span>
                      <span className="font-extrabold leading-relaxed text-slate-950">
                        {job.salaryVisibility
                          ? formatSalary(job.minSalary, job.maxSalary)
                          : t('careers.notDisclosed', 'Not Disclosed')}
                      </span>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">{t('careers.vacancies', 'Vacancies')}</span>
                      <span className="flex items-center gap-1.5 font-extrabold text-slate-950">
                        <Users size={13} className="text-amber-600" />
                        {job.vacancies} {job.vacancies === 1 ? t('careers.vacancyAvailable', 'Opening') : t('careers.vacanciesAvailable', 'Openings')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-5 sm:mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Calendar size={12} />
                    {job.postedAt ? `${t('careers.postedAt', 'Posted')} ${new Date(job.postedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}` : t('careers.recentlyPosted', 'Recently posted')}
                  </span>

                  <Link
                    href={`/jobs/${job.slug}`}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all group-hover:bg-[#FFC107] group-hover:text-slate-950"
                  >
                    <span>{t('careers.viewDetails', 'View Details')}</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
