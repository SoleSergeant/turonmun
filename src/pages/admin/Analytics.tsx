import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart3,
  TrendingUp,
  Users,
  Globe,
  School,
  MapPin,
  Award,
  Loader2,
  DollarSign,
  Calendar
} from 'lucide-react';

interface AnalyticsData {
  totalRegistrations: number;
  schoolsCount: number;
  countriesCount: number;
  acceptanceRate: number;
  committeeDistribution: { name: string; delegates: number; percentage: number }[];
  statusDistribution: { status: string; count: number; color: string }[];
  paymentDistribution: { status: string; count: number; color: string }[];
  topSchools: { name: string; count: number }[];
  topCountries: { name: string; count: number }[];
  registrationsByDay: { date: string; count: number }[];
  totalRevenue: number;
  avgPayment: number;
}

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData>({
    totalRegistrations: 0,
    schoolsCount: 0,
    countriesCount: 0,
    acceptanceRate: 0,
    committeeDistribution: [],
    statusDistribution: [],
    paymentDistribution: [],
    topSchools: [],
    topCountries: [],
    registrationsByDay: [],
    totalRevenue: 0,
    avgPayment: 0
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch all applications
      const { data: applications, error } = await supabase
        .from('applications')
        .select('id, institution, country, status, payment_status, payment_amount, assigned_committee_id, created_at');

      if (error) throw error;

      // Fetch committees for mapping
      const { data: committees } = await supabase
        .from('committees')
        .select('id, name');

      // Fetch country assignments
      const { data: assignments } = await supabase
        .from('country_assignments')
        .select('application_id, committee_id');

      if (!applications || applications.length === 0) {
        setLoading(false);
        return;
      }

      const apps = applications as any[];
      const total = apps.length;

      // ── Unique schools & countries ──
      const schoolMap: Record<string, number> = {};
      const countryMap: Record<string, number> = {};
      apps.forEach(a => {
        const school = (a.institution || 'Unknown').trim();
        const rawCountry = (a.country || 'Unknown').trim();
        let country = rawCountry;
        
        // Simple normalization for common variants
        const lowerCountry = country.toLowerCase();
        const cities = ['fergana', 'andijan', 'namangan', 'kokand', 'tashkent', 'samarkand', 'bukhara', 'khiva', 'nukus', 'navoi', 'jizzakh', 'gulistan', 'termez'];
        
        if (lowerCountry.includes('uzbekistan') || cities.some(city => lowerCountry.includes(city))) {
          // Extract city/region if Uzbekistan is mentioned
          if (lowerCountry.includes('uzbekistan')) {
            const parts = country.split(/[,\s]+/).filter(p => p.toLowerCase() !== 'uzbekistan' && p.length > 0);
            if (parts.length > 0) {
              country = parts[0]; 
            } else {
              country = 'Uzbekistan';
            }
          }
        }
        
        // Capitalize first letter of fixed country
        country = country.charAt(0).toUpperCase() + country.slice(1).toLowerCase();
        
        schoolMap[school] = (schoolMap[school] || 0) + 1;
        countryMap[country] = (countryMap[country] || 0) + 1;
      });

      const schoolsCount = Object.keys(schoolMap).length;
      const countriesCount = Object.keys(countryMap).length;

      const topSchools = Object.entries(schoolMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      const topCountries = Object.entries(countryMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      // ── Acceptance rate ──
      const approved = apps.filter(a => a.status === 'approved').length;
      const acceptanceRate = total > 0 ? Math.round((approved / total) * 100) : 0;

      // ── Status Distribution ──
      const statusCounts = apps.reduce((acc, app) => {
        const status = app.status || 'pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statusDistribution = [
        { status: 'Approved', count: statusCounts['approved'] || 0, color: 'bg-green-500' },
        { status: 'Pending', count: statusCounts['pending'] || 0, color: 'bg-yellow-500' },
        { status: 'Waitlisted', count: statusCounts['waitlisted'] || 0, color: 'bg-blue-500' },
        { status: 'Rejected', count: statusCounts['rejected'] || 0, color: 'bg-red-500' }
      ];

      // ── Payment Distribution ──
      const paymentCounts = apps.reduce((acc, app) => {
        const status = app.payment_status || 'pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const paymentDistribution = [
        { status: 'Paid', count: paymentCounts['paid'] || 0, color: 'bg-green-500' },
        { status: 'Pending', count: paymentCounts['pending'] || 0, color: 'bg-yellow-500' },
        { status: 'Overdue', count: paymentCounts['overdue'] || 0, color: 'bg-red-500' }
      ];

      // ── Revenue ──
      const totalRevenue = apps.reduce((sum, a) => sum + (a.payment_amount || 0), 0);
      const paidApps = apps.filter(a => a.payment_amount && a.payment_amount > 0);
      const avgPayment = paidApps.length > 0 ? Math.round(totalRevenue / paidApps.length) : 0;

      // ── Committee Distribution (from country_assignments) ──
      const committeeMap = new Map(committees?.map(c => [c.id, c.name]));
      const committeeCounts: Record<string, number> = {};

      // Count based on ACTUAL assignments, not just assigned_committee_id
      if (assignments && assignments.length > 0) {
        assignments.forEach(a => {
          const name = committeeMap.get(a.committee_id) || 'Unknown';
          committeeCounts[name] = (committeeCounts[name] || 0) + 1;
        });
      }

      // Count unassigned
      const assignedIds = new Set(assignments?.map(a => a.application_id) || []);
      const unassigned = apps.filter(a => !assignedIds.has(a.id)).length;
      if (unassigned > 0) {
        committeeCounts['Unassigned'] = unassigned;
      }

      const committeeDistribution = Object.entries(committeeCounts)
        .map(([name, count]) => ({
          name,
          delegates: count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0
        }))
        .sort((a, b) => b.delegates - a.delegates);

      // ── Registrations by day (last 14 days) ──
      const dayMap: Record<string, number> = {};
      const now = new Date();
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dayMap[d.toISOString().split('T')[0]] = 0;
      }
      apps.forEach(a => {
        if (a.created_at) {
          const day = new Date(a.created_at).toISOString().split('T')[0];
          if (day in dayMap) {
            dayMap[day]++;
          }
        }
      });
      const registrationsByDay = Object.entries(dayMap).map(([date, count]) => ({ date, count }));

      setData({
        totalRegistrations: total,
        schoolsCount,
        countriesCount,
        acceptanceRate,
        committeeDistribution,
        statusDistribution,
        paymentDistribution,
        topSchools,
        topCountries,
        registrationsByDay,
        totalRevenue,
        avgPayment
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxBarValue = Math.max(...data.registrationsByDay.map(d => d.count), 1);

  if (loading) {
    return (
      <AdminLayout title="Analytics Dashboard">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Analytics Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Real-time registration trends and insights</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Registrations</p>
                <p className="text-2xl font-semibold text-gray-900">{data.totalRegistrations}</p>
                <p className="text-xs text-blue-600">Live data</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Schools Participating</p>
                <p className="text-2xl font-semibold text-gray-900">{data.schoolsCount}</p>
                <p className="text-xs text-green-600">Unique institutions</p>
              </div>
              <School className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Geographic Reach</p>
                <p className="text-2xl font-semibold text-gray-900">{data.countriesCount}</p>
                <p className="text-xs text-purple-600">Regional diversity</p>
              </div>
              <Globe className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Acceptance Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{data.acceptanceRate}%</p>
                <p className="text-xs text-orange-600">{data.statusDistribution.find(s => s.status === 'Approved')?.count || 0} approved</p>
              </div>
              <Award className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Registration Trend */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Registration Trend</h3>
              <p className="text-xs text-gray-500">Last 14 days</p>
            </div>
            <Calendar className="h-5 w-5 text-blue-500" />
          </div>
          <div className="relative" style={{ height: '160px' }}>
            {/* Y-axis guides */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
              {[1, 0.75, 0.5, 0.25, 0].map(ratio => (
                <div key={ratio} className="flex items-center gap-1">
                  <span className="text-[9px] text-gray-300 w-5 text-right">{Math.round(maxBarValue * ratio)}</span>
                  <div className="flex-1 border-t border-gray-100" />
                </div>
              ))}
            </div>
            {/* Bars */}
            <div className="absolute inset-0 flex items-end gap-0.5 pl-7 pb-6">
              {data.registrationsByDay.map((day) => {
                const BAR_AREA = 110; // px available for bars
                const barHeight = maxBarValue > 0 ? Math.max(Math.round((day.count / maxBarValue) * BAR_AREA), day.count > 0 ? 3 : 0) : 0;
                const dateLabel = new Date(day.date + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' });
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center justify-end group h-full">
                    {/* Count on top */}
                    {day.count > 0 && (
                      <span className="text-[9px] font-bold text-blue-700 mb-0.5">{day.count}</span>
                    )}
                    {/* Bar */}
                    <div
                      className="w-full bg-blue-500 hover:bg-blue-600 transition-colors rounded-t"
                      style={{ height: `${barHeight}px` }}
                      title={`${dateLabel}: ${day.count} registrations`}
                    />
                    {/* Label */}
                    <span className="text-[8px] text-gray-400 mt-1 whitespace-nowrap overflow-hidden text-center" style={{ maxWidth: '100%' }}>
                      {dateLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Charts Row: Committee + Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Committee Distribution */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Committee Assignments</h3>
              <Globe className="h-5 w-5 text-blue-500" />
            </div>
            <div className="space-y-3">
              {data.committeeDistribution.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No committee assignments yet.</p>
              ) : (
                data.committeeDistribution.map((committee, idx) => {
                  const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-teal-500', 'bg-emerald-500', 'bg-gray-400'];
                  const barColor = committee.name === 'Unassigned' ? 'bg-gray-400' : colors[idx % colors.length];
                  return (
                    <div key={committee.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{committee.name}</span>
                        <span className="text-sm font-semibold text-gray-900">{committee.delegates} <span className="text-gray-400 font-normal text-xs">({committee.percentage}%)</span></span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div className={`${barColor} h-2.5 rounded-full transition-all`} style={{ width: `${committee.percentage}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Application Status */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status</h3>
            <div className="space-y-3">
              {data.statusDistribution.map((item) => {
                const pct = data.totalRegistrations > 0 ? Math.round((item.count / data.totalRegistrations) * 100) : 0;
                return (
                  <div key={item.status}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 ${item.color} rounded-full`} />
                        <span className="text-sm font-medium text-gray-700">{item.status}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{item.count} <span className="text-gray-400 font-normal text-xs">({pct}%)</span></span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Payment + Revenue Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Status */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Payment Status</h3>
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div className="space-y-3">
              {data.paymentDistribution.map((item) => {
                const pct = data.totalRegistrations > 0 ? Math.round((item.count / data.totalRegistrations) * 100) : 0;
                return (
                  <div key={item.status}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 ${item.color} rounded-full`} />
                        <span className="text-sm font-medium text-gray-700">{item.status}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{item.count} <span className="text-gray-400 font-normal text-xs">({pct}%)</span></span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Revenue summary */}
            <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Total Revenue</p>
                <p className="text-lg font-bold text-gray-900">{data.totalRevenue.toLocaleString()} <span className="text-xs font-normal text-gray-500">UZS</span></p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg. Payment</p>
                <p className="text-lg font-bold text-gray-900">{data.avgPayment.toLocaleString()} <span className="text-xs font-normal text-gray-500">UZS</span></p>
              </div>
            </div>
          </div>

          {/* Top Locations */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Top Locations</h3>
              <MapPin className="h-5 w-5 text-purple-500" />
            </div>
            {data.topCountries.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No data yet</p>
            ) : (
              <div className="space-y-2">
                {data.topCountries.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 w-5">{idx + 1}</span>
                      <span className="text-sm text-gray-800">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${(item.count / data.topCountries[0].count) * 100}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 w-8 text-right">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Schools */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Schools</h3>
            <School className="h-5 w-5 text-green-500" />
          </div>
          {data.topSchools.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No data yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
              {data.topSchools.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-5">{idx + 1}</span>
                    <span className="text-sm text-gray-800 truncate max-w-[250px]">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <Users className="h-3 w-3 text-gray-400" /> {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Analytics;
