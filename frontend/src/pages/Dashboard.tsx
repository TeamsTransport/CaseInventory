import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { api } from '../services/api';
import { Driver, SafetyEvent, SafetyCategory, Truck } from '../types';

const Dashboard = () => {
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [safetyEvents, setSafetyEvents] = useState<SafetyEvent[]>([]);
  const [safetyCategories, setSafetyCategories] = useState<SafetyCategory[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all necessary data in parallel
        const [driversData, eventsData, categoriesData, trucksData, statsData] = await Promise.all([
          api.getDrivers(),
          api.getSafetyEvents(),
          api.getSafetyCategories(),
          api.getTrucks(),
          api.getDashboardStats()
        ]);
        
        setDrivers(driversData);
        setSafetyEvents(eventsData);
        setSafetyCategories(categoriesData);
        setTrucks(trucksData);
        setDashboardStats(statsData);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // If you don't have a dashboard stats endpoint, calculate locally
  // Otherwise use the stats from API
  const totalEvents = dashboardStats?.totalEvents || safetyEvents.length;
  const avgBonusScore = dashboardStats?.avgBonusScore || 
    (safetyEvents.length > 0 
      ? safetyEvents.reduce((s, e) => s + e.bonus_score, 0) / safetyEvents.length 
      : 0);
  const activeTrucks = trucks.filter(t => t.status === 'assigned').length;

  // --- Logic for Weekly Trend of Top 5 Safety Events (3 Month Period) ---
  const trendData = useMemo(() => {
    if (safetyEvents.length === 0 || safetyCategories.length === 0) {
      return { weeks: [], top5Details: [] };
    }

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentEvents = safetyEvents.filter(e => new Date(e.event_date) >= threeMonthsAgo);

    // 1. Identify Top 5 Categories by frequency
    const categoryCounts: Record<number, number> = {};
    recentEvents.forEach(e => {
      categoryCounts[e.category_id] = (categoryCounts[e.category_id] || 0) + 1;
    });

    const top5CategoryIds = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id]) => Number(id));

    const top5Details = top5CategoryIds.map(id => ({
      id,
      code: safetyCategories.find(c => c.category_id === id)?.code || `CAT-${id}`
    }));

    // 2. Generate 12 weeks of data points
    const weeks: any[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - (i * 7));
      // Get the Monday of that week
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      
      const label = `${monday.getMonth() + 1}/${monday.getDate()}`;
      const weekStart = new Date(monday.setHours(0,0,0,0));
      const weekEnd = new Date(monday);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const dataPoint: any = { week: label };
      
      top5Details.forEach(cat => {
        const count = recentEvents.filter(e => {
          const evDate = new Date(e.event_date);
          return e.category_id === cat.id && evDate >= weekStart && evDate < weekEnd;
        }).length;
        dataPoint[cat.code] = count;
      });

      weeks.push(dataPoint);
    }
    return { weeks, top5Details };
  }, [safetyEvents, safetyCategories]);

  const pieData = [
    { name: 'Low Risk', value: 70, color: '#10b981' },
    { name: 'Med Risk', value: 20, color: '#f59e0b' },
    { name: 'High Risk', value: 10, color: '#ef4444' }
  ];

  const lineColors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Helper function to get driver by ID
  const getDriverById = (driverId: number) => {
    return drivers.find(d => d.driver_id === driverId);
  };

  // Helper function to get safety category by ID
  const getSafetyCategoryById = (categoryId: number) => {
    return safetyCategories.find(c => c.category_id === categoryId);
  };

  // Format date function
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-lg">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Fleet Overview</h2>
          <p className="text-base-content/60">Safety performance monitoring & bonus metrics</p>
        </div>
        <div className="badge badge-success gap-2 p-4">
          <i className="fa-solid fa-circle-check"></i>
          System Active
        </div>
      </header>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stats shadow bg-base-100">
          <div className="stat">
            <div className="stat-figure text-primary">
              <i className="fa-solid fa-users text-3xl"></i>
            </div>
            <div className="stat-title">Active Drivers</div>
            <div className="stat-value">{drivers.length}</div>
            <div className="stat-desc">Jan 1 - Dec 31</div>
          </div>
        </div>

        <div className="stats shadow bg-base-100">
          <div className="stat">
            <div className="stat-figure text-secondary">
              <i className="fa-solid fa-triangle-exclamation text-3xl"></i>
            </div>
            <div className="stat-title">Safety Events</div>
            <div className="stat-value text-secondary">{totalEvents}</div>
            <div className="stat-desc">Trailing 30 days</div>
          </div>
        </div>

        <div className="stats shadow bg-base-100">
          <div className="stat">
            <div className="stat-figure text-success">
              <i className="fa-solid fa-award text-3xl"></i>
            </div>
            <div className="stat-title">Avg Bonus Score</div>
            <div className="stat-value text-success">{avgBonusScore.toFixed(1)}</div>
            <div className="stat-desc">Lower is better</div>
          </div>
        </div>

        <div className="stats shadow bg-base-100">
          <div className="stat">
            <div className="stat-figure text-warning">
              <i className="fa-solid fa-truck text-3xl"></i>
            </div>
            <div className="stat-title">Active Trucks</div>
            <div className="stat-value">{activeTrucks}</div>
            <div className="stat-desc">Total fleet: {trucks.length}</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card bg-base-100 shadow-xl col-span-2">
          <div className="card-body">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="card-title">Top 5 Safety Event Trends</h3>
                <p className="text-xs opacity-50">Weekly frequency over the last 3 months</p>
              </div>
              <div className="badge badge-outline text-[10px] font-bold">12 WEEK WINDOW</div>
            </div>
            <div className="h-[300px] w-full">
              {trendData.weeks.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData.weeks}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis 
                      dataKey="week" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fill: 'currentColor', opacity: 0.5}}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fill: 'currentColor', opacity: 0.5}}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', fontSize: '12px' }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconType="circle"
                      wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}}
                    />
                    {trendData.top5Details.map((cat, idx) => (
                      <Line 
                        key={cat.id}
                        type="monotone" 
                        dataKey={cat.code} 
                        stroke={lineColors[idx % lineColors.length]} 
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No safety event data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Risk Profile</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {pieData.map(item => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                    {item.name}
                  </span>
                  <span className="font-bold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="card bg-base-100 shadow-xl overflow-hidden">
        <div className="card-body p-0">
          <div className="p-6 border-b border-base-200">
            <h3 className="card-title">Recent Safety Logs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Event Date</th>
                  <th>Category</th>
                  <th>Bonus Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {safetyEvents.slice(0, 5).map(event => {
                  const driver = getDriverById(event.driver_id);
                  const cat = getSafetyCategoryById(event.category_id);
                  const avatarUrl = driver?.profile_pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${driver?.first_name || ''} ${driver?.last_name || ''}`)}&background=random&color=fff&bold=true`;
                  
                  return (
                    <tr key={event.event_id}>
                      <td className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="avatar">
                            <div className="w-8 rounded-full bg-base-300 overflow-hidden">
                              <img src={avatarUrl} alt="Avatar" />
                            </div>
                          </div>
                          <span>{driver?.first_name || 'Unknown'} {driver?.last_name || 'Driver'}</span>
                        </div>
                      </td>
                      <td>{formatDate(event.event_date)}</td>
                      <td><div className="badge badge-ghost truncate max-w-[200px]">{cat?.description || 'Unknown Category'}</div></td>
                      <td className={event.bonus_score > 0 ? 'text-error font-bold' : 'text-success font-bold'}>
                        {event.bonus_score > 0 ? `+${event.bonus_score}` : event.bonus_score}
                      </td>
                      <td>
                        {event.bonus_period ? (
                          <div className="badge badge-primary badge-sm">Active Period</div>
                        ) : (
                          <div className="badge badge-ghost badge-sm">Historical</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {safetyEvents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No safety events found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;