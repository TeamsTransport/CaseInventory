import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Driver, DriverType, Truck } from '../types';

const DriverSetup = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverTypes, setDriverTypes] = useState<DriverType[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Omit<Driver, 'driver_id'>>({
    driver_code: '',
    first_name: '',
    last_name: '',
    start_date: new Date().toISOString().split('T')[0],
    truck_id: null,
    driver_type_id: 2,
    profile_pic: ''
  });

  // Load all data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [driversData, typesData, trucksData] = await Promise.all([
          api.getDrivers(),
          api.getDriverTypes(),
          api.getTrucks(),
        ]);
        
        setDrivers(driversData);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for localStorage sanity
        alert("Image is too large. Please select an image under 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profile_pic: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!formData.first_name || !formData.last_name || !formData.driver_code) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      if (editingDriver) {
        // Update existing driver
        await api.updateDriver(editingDriver.driver_id, formData);
      } else {
        // Create new driver
        await api.createDriver(formData);
      }

      // Refresh the drivers list
      const updatedDrivers = await api.getDrivers();
      setDrivers(updatedDrivers);
      
      resetForm();
      setEditingDriver(null);
      (window as any).driver_modal?.close();
      
    } catch (error) {
      console.error('Error saving driver:', error);
      alert('Failed to save driver. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      driver_code: '',
      first_name: '',
      last_name: '',
      start_date: new Date().toISOString().split('T')[0],
      truck_id: null,
      driver_type_id: 2,
      profile_pic: ''
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      driver_code: driver.driver_code,
      first_name: driver.first_name,
      last_name: driver.last_name,
      start_date: driver.start_date,
      truck_id: driver.truck_id,
      driver_type_id: driver.driver_type_id || 2,
      profile_pic: driver.profile_pic || ''
    });
    (window as any).driver_modal?.showModal();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Permanently delete this driver? All safety events and scorecards linked to this driver will also be removed.')) {
      try {
        await api.deleteDriver(id);
        // Remove from local state
        setDrivers(drivers.filter(d => d.driver_id !== id));
      } catch (error) {
        console.error('Error deleting driver:', error);
        alert('Failed to delete driver');
      }
    }
  };

  const filteredDrivers = drivers.filter(d => 
    `${d.first_name} ${d.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.driver_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper function to get truck info
  const getTruckInfo = (truckId: number | null) => {
    if (!truckId) return null;
    return trucks.find(t => t.truck_id === truckId);
  };

  // Helper function to get driver type info
  const getDriverTypeInfo = (driverTypeId: number | null) => {
    if (!driverTypeId) return null;
    return driverTypes.find(t => t.driver_type_id === driverTypeId);
  };

  // Loading state
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
          <h2 className="text-3xl font-bold">Driver Administration</h2>
          <p className="text-base-content/60">Maintain driver profiles and database records</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setEditingDriver(null);
            resetForm();
            (window as any).driver_modal?.showModal();
          }}
        >
          <i className="fa-solid fa-user-plus mr-2"></i> Register New Driver
        </button>
      </header>

      <div className="card bg-base-100 shadow-xl border border-base-200">
        <div className="p-4 border-b border-base-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 opacity-40"></i>
            <input 
              type="text" 
              placeholder="Search by name or code..." 
              className="input input-bordered w-full pl-11" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="badge badge-outline gap-2">{filteredDrivers.length} Registered</div>
        </div>

        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr className="bg-base-200/50">
                <th>Avatar</th>
                <th>Code</th>
                <th>Driver Name</th>
                <th>Hire Date</th>
                <th>Type</th>
                <th>Current Asset</th>
                <th className="text-right">Manage</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 opacity-40 italic">No drivers found.</td>
                </tr>
              ) : (
                filteredDrivers.map(d => {
                  const type = getDriverTypeInfo(d.driver_type_id);
                  const truck = getTruckInfo(d.truck_id);
                  const avatarUrl = d.profile_pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${d.first_name} ${d.last_name}`)}&background=random&color=fff&bold=true`;
                  
                  return (
                    <tr key={d.driver_id} className="hover">
                      <td>
                        <div className="avatar">
                          <div className="w-8 rounded-full bg-base-300">
                            <img src={avatarUrl} alt="Avatar" />
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-xs">{d.driver_code}</td>
                      <td>
                        <div className="font-bold">{d.first_name} {d.last_name}</div>
                      </td>
                      <td>{new Date(d.start_date).toLocaleDateString()}</td>
                      <td>
                        <span className="badge badge-sm badge-ghost">{type?.driver_type || 'Unassigned'}</span>
                      </td>
                      <td>
                        {truck ? (
                          <span className="flex items-center gap-1 text-xs">
                            <i className="fa-solid fa-truck text-primary"></i> {truck.unit_number}
                          </span>
                        ) : (
                          <span className="text-xs opacity-40">Unassigned</span>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            className="btn btn-ghost btn-xs text-info"
                            onClick={() => handleEdit(d)}
                          >
                            <i className="fa-solid fa-user-pen"></i>
                          </button>
                          <button 
                            className="btn btn-ghost btn-xs text-error"
                            onClick={() => handleDelete(d.driver_id)}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <dialog id="driver_modal" className="modal">
        <div className="modal-box w-11/12 max-w-lg">
          <h3 className="font-bold text-xl mb-6">
            {editingDriver ? 'Update Driver Profile' : 'New Driver Registration'}
          </h3>
          
          <div className="flex flex-col items-center mb-6">
            <div className="avatar mb-4 relative group">
              <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 bg-base-200 overflow-hidden">
                <img 
                  src={formData.profile_pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${formData.first_name || 'D'} ${formData.last_name || 'U'}`)}&background=888&color=fff&bold=true&size=128`} 
                  alt="Profile Preview" 
                />
              </div>
              <button 
                type="button"
                className="btn btn-circle btn-xs btn-primary absolute bottom-0 right-0 shadow-lg"
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="fa-solid fa-camera"></i>
              </button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
            <p className="text-[10px] opacity-50 uppercase font-bold">Profile Picture</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-control col-span-2">
              <label className="label font-bold text-xs uppercase opacity-70">Driver Code</label>
              <input 
                type="text" 
                className="input input-bordered" 
                placeholder="D000"
                value={formData.driver_code}
                onChange={e => setFormData({...formData, driver_code: e.target.value})}
              />
            </div>
            
            <div className="form-control">
              <label className="label font-bold text-xs uppercase opacity-70">First Name</label>
              <input 
                type="text" 
                className="input input-bordered" 
                value={formData.first_name}
                onChange={e => setFormData({...formData, first_name: e.target.value})}
              />
            </div>

            <div className="form-control">
              <label className="label font-bold text-xs uppercase opacity-70">Last Name</label>
              <input 
                type="text" 
                className="input input-bordered" 
                value={formData.last_name}
                onChange={e => setFormData({...formData, last_name: e.target.value})}
              />
            </div>

            <div className="form-control">
              <label className="label font-bold text-xs uppercase opacity-70">Start Date</label>
              <input 
                type="date" 
                className="input input-bordered" 
                value={formData.start_date}
                onChange={e => setFormData({...formData, start_date: e.target.value})}
              />
            </div>

            <div className="form-control">
              <label className="label font-bold text-xs uppercase opacity-70">Driver Type</label>
              <select 
                className="select select-bordered"
                value={formData.driver_type_id || 2}
                onChange={e => setFormData({...formData, driver_type_id: Number(e.target.value)})}
              >
                {driverTypes.map(t => (
                  <option key={t.driver_type_id} value={t.driver_type_id}>{t.driver_type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-action">
            <button className="btn btn-ghost" onClick={() => (window as any).driver_modal.close()}>Cancel</button>
            <button className="btn btn-primary px-8" onClick={handleSave}>
              {editingDriver ? 'Update Profile' : 'Save Driver'}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default DriverSetup;