import React, { useState, useEffect } from 'react';
import { api } from '../services/api';  // Changed from './services/dbStore' to '../services/api'
import { DriverType } from '../types';

const DriverTypeSetup = () => {
  const [types, setTypes] = useState<DriverType[]>([]);  // Changed from db.driverTypes to []
  const [editingType, setEditingType] = useState<DriverType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);  // Added loading state
  const [formData, setFormData] = useState<Omit<DriverType, 'driver_type_id'>>({
    driver_type: ''
  });

  // NEW: Fetch driver types on component mount
  useEffect(() => {
    const fetchDriverTypes = async () => {
      setIsLoading(true);
      try {
        const driverTypesData = await api.getDriverTypes();
        setTypes(driverTypesData);
      } catch (error) {
        console.error('Error fetching driver types:', error);
        alert('Failed to load driver types');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDriverTypes();
  }, []);

  // NEW: Refresh function now fetches from API
  const refresh = async () => {
    try {
      const updatedTypes = await api.getDriverTypes();
      setTypes(updatedTypes);
    } catch (error) {
      console.error('Error refreshing driver types:', error);
      alert('Failed to refresh data');
    }
  };

  // UPDATED: Now uses API instead of db
  const handleSave = async () => {
    if (!formData.driver_type) {
      alert('Please fill in the Driver Type Name.');
      return;
    }

    try {
      if (editingType) {
        // Update existing driver type via API
        await api.updateDriverType(editingType.driver_type_id, formData);
      } else {
        // Create new driver type via API
        await api.createDriverType(formData);
      }

      // Refresh the list
      await refresh();
      
      setFormData({
        driver_type: ''
      });
      setEditingType(null);
      (window as any).driver_type_modal?.close();
    } catch (error) {
      console.error('Error saving driver type:', error);
      alert('Failed to save driver type');
    }
  };

  // UPDATED: Handle edit remains similar but we don't need to change db
  const handleEdit = (type: DriverType) => {
    setEditingType(type);
    setFormData({
      driver_type: type.driver_type
    });
    (window as any).driver_type_modal?.showModal();
  };

  // UPDATED: Now uses API delete
  const handleDelete = async (id: number) => {
    if (confirm('Delete this driver type? Note: Drivers currently assigned to this type will lose their classification until updated.')) {
      try {
        await api.deleteDriverType(id);
        // Remove from local state
        setTypes(types.filter(t => t.driver_type_id !== id));
      } catch (error) {
        console.error('Error deleting driver type:', error);
        alert('Failed to delete driver type');
      }
    }
  };

  const filteredTypes = types.filter(t => 
    t.driver_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // NEW: Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-lg">Loading driver types...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Driver Type Administration</h2>
          <p className="text-base-content/60">Configure classifications for your driver fleet</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setEditingType(null);
            setFormData({ driver_type: '' });
            (window as any).driver_type_modal?.showModal();
          }}
        >
          <i className="fa-solid fa-plus mr-2"></i> Add Driver Type
        </button>
      </header>

      <div className="card bg-base-100 shadow-xl border border-base-200">
        <div className="p-4 border-b border-base-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 opacity-40"></i>
            <input 
              type="text" 
              placeholder="Search driver types..." 
              className="input input-bordered w-full pl-11" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-xs opacity-50 font-bold uppercase tracking-wider">{filteredTypes.length} Types Configured</div>
        </div>

        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr className="bg-base-200/50">
                <th className="w-24">ID</th>
                <th>Classification Name</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTypes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-12 opacity-40 italic">No driver types found.</td>
                </tr>
              ) : (
                filteredTypes.map(type => (
                  <tr key={type.driver_type_id} className="hover">
                    <td className="font-mono text-xs opacity-50">{type.driver_type_id.toString().slice(-4)}</td>
                    <td className="font-bold">{type.driver_type}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button 
                          className="btn btn-ghost btn-xs text-info"
                          onClick={() => handleEdit(type)}
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button 
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => handleDelete(type.driver_type_id)}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <dialog id="driver_type_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-xl mb-6">
            {editingType ? 'Update Driver Type' : 'New Driver Type'}
          </h3>
          
          <div className="space-y-4">
            <div className="form-control">
              <label className="label font-bold text-xs uppercase opacity-70">Classification Name</label>
              <input 
                type="text" 
                className="input input-bordered" 
                placeholder="e.g. Owner Operator"
                value={formData.driver_type}
                onChange={e => setFormData({...formData, driver_type: e.target.value})}
              />
            </div>
          </div>

          <div className="modal-action mt-8">
            <button className="btn btn-ghost" onClick={() => (window as any).driver_type_modal.close()}>Cancel</button>
            <button className="btn btn-primary px-8" onClick={handleSave}>
              {editingType ? 'Save Changes' : 'Create Type'}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default DriverTypeSetup;