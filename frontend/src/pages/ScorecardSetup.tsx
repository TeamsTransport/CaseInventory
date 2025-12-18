import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { ScoreCardItem, DriverType } from '../types';

const ScorecardSetup = () => {
  const addModalRef = useRef<HTMLDialogElement>(null);
  const editModalRef = useRef<HTMLDialogElement>(null);
  const deleteModalRef = useRef<HTMLDialogElement>(null);

  // NEW: State for data from API
  const [items, setItems] = useState<ScoreCardItem[]>([]);
  const [driverTypes, setDriverTypes] = useState<DriverType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [editingItem, setEditingItem] = useState<ScoreCardItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [newItem, setNewItem] = useState<{
    sc_category: string;
    sc_description: string;
    driver_type_id: number | null;
  }>({ 
    sc_category: 'SAFETY', 
    sc_description: '',
    driver_type_id: null 
  });

  // NEW: Load data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [itemsData, driverTypesData] = await Promise.all([
          api.getScoreCardItems(),
          api.getDriverTypes(),
        ]);
        setItems(itemsData);
        setDriverTypes(driverTypesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // NEW: Refresh function now fetches from API
  const refresh = async () => {
    try {
      const updatedItems = await api.getScoreCardItems();
      setItems(updatedItems);
    } catch (error) {
      console.error('Error refreshing data:', error);
      alert('Failed to refresh data');
    }
  };

  // UPDATED: Now uses API instead of db
  const handleAdd = async () => {
    if (!newItem.sc_description) {
      alert('Please enter a description for the metric');
      return;
    }

    try {
      // Create the new item via API
      await api.addScoreCardItem(newItem);
      
      // Refresh the list
      await refresh();
      
      // Reset form and close modal
      setNewItem({ 
        sc_category: 'SAFETY', 
        sc_description: '',
        driver_type_id: null 
      });
      addModalRef.current?.close();
    } catch (error) {
      console.error('Error adding scorecard item:', error);
      alert('Failed to add metric');
    }
  };

  // UPDATED: Now uses API instead of db
  const handleUpdate = async () => {
    if (!editingItem) return;

    try {
      // Update the item via API
      await api.updateScoreCardItem(editingItem);
      
      // Refresh the list
      await refresh();
      
      // Reset and close modal
      setEditingItem(null);
      editModalRef.current?.close();
    } catch (error) {
      console.error('Error updating scorecard item:', error);
      alert('Failed to update metric');
    }
  };

  // UPDATED: Now uses API instead of db
  const confirmDelete = async () => {
    if (itemToDelete !== null) {
      try {
        // Delete the item via API
        await api.deleteScoreCardItem(itemToDelete);
        
        // Remove from local state
        setItems(items.filter(i => i.sc_category_id !== itemToDelete));
        
        setItemToDelete(null);
        deleteModalRef.current?.close();
      } catch (error) {
        console.error('Error deleting scorecard item:', error);
        alert('Failed to delete metric');
      }
    }
  };

  const openDeleteModal = (id: number) => {
    setItemToDelete(id);
    deleteModalRef.current?.showModal();
  };

  const openEdit = (item: ScoreCardItem) => {
    setEditingItem(item);
    editModalRef.current?.showModal();
  };

  const categories = ['SAFETY', 'MAINTENANCE', 'DISPATCH'];
  
  // UPDATED: Uses driverTypes state instead of db.driverTypes
  const getDriverTypeName = (id?: number | null) => {
    if (!id) return 'All Types';
    const type = driverTypes.find(t => t.driver_type_id === id);
    return type?.driver_type || 'Unknown';
  };

  // NEW: Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-lg">Loading scorecard configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Scorecard Configuration</h2>
          <p className="text-base-content/60">Define monthly grading metrics</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => addModalRef.current?.showModal()}
        >
          <i className="fa-solid fa-plus mr-2"></i> Add Metric
        </button>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {categories.map(cat => {
          const categoryItems = items.filter(i => i.sc_category === cat);
          return (
            <div key={cat} className="card bg-base-100 shadow-xl overflow-hidden border border-base-200">
              <div className="bg-base-200 px-6 py-4 flex justify-between items-center font-bold uppercase">
                {cat} METRICS
                <div className="badge badge-outline">{categoryItems.length} Items</div>
              </div>
              {categoryItems.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No metrics configured for this category
                </div>
              ) : (
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th className="w-16">ID</th>
                      <th>Description</th>
                      <th>Type</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryItems.map(item => (
                      <tr key={item.sc_category_id} className="hover">
                        <td className="text-xs opacity-50">{item.sc_category_id.toString().slice(-4)}</td>
                        <td className="font-medium">{item.sc_description}</td>
                        <td>
                          <span className="badge badge-sm">
                            {getDriverTypeName(item.driver_type_id)}
                          </span>
                        </td>
                        <td className="text-right">
                          <button 
                            className="btn btn-ghost btn-xs text-info" 
                            onClick={() => openEdit(item)}
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button 
                            className="btn btn-ghost btn-xs text-error" 
                            onClick={() => openDeleteModal(item.sc_category_id)}
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>

      <dialog ref={deleteModalRef} className="modal">
        <div className="modal-box max-w-md text-center">
          <div className="bg-error/10 text-error p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-trash-can text-2xl"></i>
          </div>
          <h3 className="font-bold text-xl">Delete Metric?</h3>
          <p className="py-2 opacity-70">
            This action will permanently remove this grading criteria.
          </p>
          <div className="modal-action flex justify-center gap-4">
            <button 
              className="btn btn-ghost flex-1" 
              onClick={() => {
                deleteModalRef.current?.close();
                setItemToDelete(null);
              }}
            >
              Cancel
            </button>
            <button 
              className="btn btn-error flex-1" 
              onClick={confirmDelete}
            >
              Delete
            </button>
          </div>
        </div>
      </dialog>

      <dialog ref={addModalRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">New Grading Metric</h3>
          <div className="space-y-4">
            <select 
              className="select select-bordered w-full" 
              value={newItem.sc_category} 
              onChange={(e) => setNewItem({ ...newItem, sc_category: e.target.value })}
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <textarea 
              className="textarea textarea-bordered w-full" 
              placeholder="Metric Description..." 
              value={newItem.sc_description} 
              onChange={(e) => setNewItem({ ...newItem, sc_description: e.target.value })}
            ></textarea>
          </div>
          <div className="modal-action">
            <button 
              className="btn btn-ghost" 
              onClick={() => {
                addModalRef.current?.close();
                setNewItem({ 
                  sc_category: 'SAFETY', 
                  sc_description: '',
                  driver_type_id: null 
                });
              }}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleAdd}
            >
              Save
            </button>
          </div>
        </div>
      </dialog>

      <dialog ref={editModalRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Edit Metric</h3>
          {editingItem && (
            <div className="space-y-4">
              <textarea 
                className="textarea textarea-bordered w-full" 
                value={editingItem.sc_description} 
                onChange={(e) => setEditingItem({ ...editingItem, sc_description: e.target.value })}
              ></textarea>
            </div>
          )}
          <div className="modal-action">
            <button 
              className="btn btn-ghost" 
              onClick={() => {
                editModalRef.current?.close();
                setEditingItem(null);
              }}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleUpdate}
            >
              Update
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default ScorecardSetup;