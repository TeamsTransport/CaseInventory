import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
// If you have Gemini service, but you might need to update this path
// import { getSafetyInsights } from '../services/geminiService';
import { Driver, SafetyEvent, DriverType, Truck } from '../types';

const Drivers = () => {
  // State for data
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [safetyEvents, setSafetyEvents] = useState<SafetyEvent[]>([]);
  const [driverTypes, setDriverTypes] = useState<DriverType[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  
  // State for UI
  const [typeFilter, setTypeFilter] = useState<number | 'all'>('all');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [insights, setInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // NEW: Fetch all data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch all data in parallel
        const [driversData, eventsData, typesData, trucksData] = await Promise.all([
          api.getDrivers(),
          api.getSafetyEvents(),
          api.getDriverTypes(),
          api.getTrucks(),
        ]);
        
        setDrivers(driversData);
        setSafetyEvents(eventsData);
        setDriverTypes(typesData);
        setTrucks(trucksData);
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // NEW: Calculate driver stats locally
  const getDriverStats = (driverId: number) => {
    const driverEvents = safetyEvents.filter(e => e.driver_id === driverId);
    const totalBonusScore = driverEvents.reduce((sum, e) => sum + e.bonus_score, 0);
    const status = totalBonusScore > 5 ? 'Warning' : 'Good';
    
    return {
      eventCount: driverEvents.length,
      totalBonusScore,
      totalPIScore: driverEvents.reduce((sum, e) => sum + e.p_i_score, 0),
      status,
    };
  };

  // ADD THIS: Filter drivers based on type
  const filteredDrivers = typeFilter === 'all' 
    ? drivers 
    : drivers.filter(d => d.driver_type_id === typeFilter);

  // ADD THIS: Format date function
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // ADD THIS: Handle showing driver details
  const handleShowDetails = async (driver: Driver) => {
    setSelectedDriver(driver);
    setInsights('');
    setLoadingInsights(true);
    
    try {
      // If you have an AI insights API, use it here
      // For now, simulate or create a simple analysis
      const driverEvents = safetyEvents.filter(e => e.driver_id === driver.driver_id);
      const totalEvents = driverEvents.length;
      const totalScore = driverEvents.reduce((sum, e) => sum + e.bonus_score, 0);
      
      let analysis = "";
      if (totalEvents === 0) {
        analysis = "This driver has a clean safety record with no recorded incidents. Continue to monitor and encourage safe driving practices.";
      } else if (totalScore <= 2) {
        analysis = "Driver shows minimal safety incidents. Maintain regular training and monitoring to reinforce good habits.";
      } else if (totalScore <= 5) {
        analysis = "Moderate safety record observed. Consider additional training focused on the specific incidents recorded.";
      } else {
        analysis = "High safety incident count detected. Recommend immediate safety review, additional training, and close monitoring.";
      }
      
      setInsights(analysis);
    } catch (error) {
      console.error('Error getting insights:', error);
      setInsights('Unable to generate AI insights at this time.');
    } finally {
      setLoadingInsights(false);
    }
  };

  // ADD THIS: Loading UI
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-lg">Loading driver data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Driver Roster</h2>
          <p className="text-base-content/60">Fleet performance and safety monitoring</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="form-control">
            <select 
              className="select select-bordered w-full sm:w-48"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            >
              <option value="all">All Driver Types</option>
              {driverTypes.map(type => (
                <option key={type.driver_type_id} value={type.driver_type_id}>
                  {type.driver_type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="card bg-base-100 shadow-xl border border-base-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr className="bg-base-200/50">
                <th>Driver Name</th>
                <th>Code</th>
                <th>Driver Type</th>
                <th>Assigned Truck</th>
                <th>Start Date</th>
                <th>Bonus Score</th>
                <th>Status</th>
                <th className="text-right">Insights</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-20 opacity-40 italic">
                    <div className="flex flex-col items-center gap-2">
                      <i className="fa-solid fa-user-slash text-4xl"></i>
                      <p>No drivers found matching this filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDrivers.map(driver => {
                  const stats = getDriverStats(driver.driver_id);
                  const truck = trucks.find(t => t.truck_id === driver.truck_id);
                  const type = driverTypes.find(t => t.driver_type_id === driver.driver_type_id);
                  const avatarUrl = driver.profile_pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${driver.first_name} ${driver.last_name}`)}&background=random&color=fff&size=64&font-size=0.45&bold=true`;
                  
                  return (
                    <tr key={driver.driver_id} className="hover:bg-base-200/30 transition-colors">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar">
                            <div className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden bg-base-300">
                              <img src={avatarUrl} alt={`${driver.first_name} ${driver.last_name}`} />
                            </div>
                          </div>
                          <div className="font-bold">{driver.first_name} {driver.last_name}</div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-ghost font-mono text-xs">{driver.driver_code}</span>
                      </td>
                      <td>
                        <span className={`badge badge-sm border font-medium px-3 py-2 h-auto ${
                          type?.driver_type === 'Company Driver' 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : type?.driver_type === 'Owner Operator'
                            ? 'bg-gray-700 text-gray-100 border-gray-800'
                            : 'badge-outline border-base-300'
                        }`}>
                          {type?.driver_type || 'Unassigned'}
                        </span>
                      </td>
                      <td>
                        {truck ? (
                          <div className="flex items-center gap-2 text-sm">
                            <i className="fa-solid fa-truck text-primary"></i>
                            {truck.unit_number}
                          </div>
                        ) : (
                          <span className="text-xs opacity-40 italic">None</span>
                        )}
                      </td>
                      <td>
                        <span className="text-sm opacity-70">{formatDate(driver.start_date)}</span>
                      </td>
                      <td>
                        <div className={`font-bold ${stats.totalBonusScore > 5 ? 'text-error' : 'text-success'}`}>
                          {stats.totalBonusScore}
                        </div>
                      </td>
                      <td>
                        <div className={`badge badge-sm ${stats.status === 'Good' ? 'badge-success' : 'badge-error'}`}>
                          {stats.status}
                        </div>
                      </td>
                      <td className="text-right">
                        <button 
                          className="btn btn-ghost btn-sm text-primary hover:bg-primary/10"
                          onClick={() => handleShowDetails(driver)}
                        >
                          <i className="fa-solid fa-magnifying-glass-chart mr-1"></i>
                          AI Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Insights Modal */}
      {selectedDriver && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-2xl">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="avatar">
                  <div className="w-12 rounded-full overflow-hidden bg-base-300">
                    <img src={selectedDriver.profile_pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${selectedDriver.first_name} ${selectedDriver.last_name}`)}&background=random&color=fff&bold=true`} alt="Driver Avatar" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-2xl flex items-center gap-2">
                    <i className="fa-solid fa-brain text-purple-500"></i>
                    AI Safety Insights
                  </h3>
                  <p className="text-sm opacity-60">
                    {selectedDriver.first_name} {selectedDriver.last_name} • 
                    <span className="ml-1 font-bold text-base-content">Start Date: {formatDate(selectedDriver.start_date)}</span>
                  </p>
                </div>
              </div>
              <button className="btn btn-sm btn-circle btn-ghost" onClick={() => setSelectedDriver(null)}>✕</button>
            </div>
            
            <div className="bg-base-200 p-6 rounded-xl min-h-[100px] relative overflow-hidden border border-base-300">
              {loadingInsights ? (
                <div className="flex flex-col items-center justify-center gap-4 py-8">
                  <span className="loading loading-spinner loading-lg text-primary"></span>
                  <p className="text-sm animate-pulse">Analyzing safety logs...</p>
                </div>
              ) : (
                <div className="prose max-w-none">
                  <p className="italic text-lg text-base-content/80 leading-relaxed">"{insights}"</p>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-4">
              <h4 className="font-bold border-b border-base-300 pb-2 flex items-center gap-2">
                <i className="fa-solid fa-list-check text-xs opacity-50"></i>
                Historical Safety Summary
              </h4>
              {safetyEvents.filter(e => e.driver_id === selectedDriver.driver_id).length === 0 ? (
                <p className="text-sm opacity-50 py-4 text-center italic">No safety events recorded for this driver.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto pr-2 space-y-2">
                  {safetyEvents
                    .filter(e => e.driver_id === selectedDriver.driver_id)
                    .map(e => (
                      <div key={e.event_id} className="flex justify-between text-sm bg-base-100 p-3 rounded-lg border border-base-200">
                        <div className="flex flex-col">
                          <span className="font-semibold">{formatDate(e.event_date)}</span>
                          <span className="opacity-70">{e.notes}</span>
                        </div>
                        <span className={`font-black ${e.bonus_score > 0 ? 'text-error' : 'text-success'}`}>
                          {e.bonus_score > 0 ? `+${e.bonus_score}` : e.bonus_score} pts
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setSelectedDriver(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => setSelectedDriver(null)}>Acknowledge</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drivers;