// frontend/src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error (${response.status}): ${error}`);
  }
  
  return response.json();
}

export const api = {
  // ========== DRIVERS ==========
  getDrivers: () => fetchAPI('/drivers'),
  getDriver: (id: number) => fetchAPI(`/drivers/${id}`),
  createDriver: (driver: any) => 
    fetchAPI('/drivers', {
      method: 'POST',
      body: JSON.stringify(driver),
    }),
  updateDriver: (id: number, driver: any) =>
    fetchAPI(`/drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(driver),
    }),
  deleteDriver: (id: number) =>
    fetchAPI(`/drivers/${id}`, { method: 'DELETE' }),

  // ========== TRUCKS ==========
  getTrucks: () => fetchAPI('/trucks'),
  createTruck: (truck: any) =>
    fetchAPI('/trucks', {
      method: 'POST',
      body: JSON.stringify(truck),
    }),
  deleteTruck: (id: number) =>
    fetchAPI(`/trucks/${id}`, { method: 'DELETE' }),
  assignDriverToTruck: (driverId: number | null, truckId: number) =>
    fetchAPI('/assign-driver', {
      method: 'POST',
      body: JSON.stringify({ driverId, truckId }),
    }),

  // ========== SAFETY EVENTS ==========
  getSafetyEvents: (params?: { driverId?: number; startDate?: string; endDate?: string }) => {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return fetchAPI(`/safety-events${query}`);
  },
  createSafetyEvent: (event: any) =>
    fetchAPI('/safety-events', {
      method: 'POST',
      body: JSON.stringify(event),
    }),
  deleteSafetyEvent: (id: number) =>
    fetchAPI(`/safety-events/${id}`, { method: 'DELETE' }),

  // ========== DRIVER TYPES ==========
  getDriverTypes: () => fetchAPI('/driver-types'),
  createDriverType: (driverType: any) =>
    fetchAPI('/driver-types', {
      method: 'POST',
      body: JSON.stringify(driverType),
    }),
  updateDriverType: (id: number, driverType: any) =>
    fetchAPI(`/driver-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(driverType),
    }),
  deleteDriverType: (id: number) =>
    fetchAPI(`/driver-types/${id}`, { method: 'DELETE' }),

  // ========== SAFETY CATEGORIES ==========
  getSafetyCategories: () => fetchAPI('/safety-categories'),
  createSafetyCategory: (category: any) =>
    fetchAPI('/safety-categories', {
      method: 'POST',
      body: JSON.stringify(category),
    }),
  updateSafetyCategory: (id: number, category: any) =>
    fetchAPI(`/safety-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    }),
  deleteSafetyCategory: (id: number) =>
    fetchAPI(`/safety-categories/${id}`, { method: 'DELETE' }),

  // ========== SCORECARD ITEMS ==========
  getScoreCardItems: () => fetchAPI('/scorecard-items'),
  addScoreCardItem: (item: any) =>
    fetchAPI('/scorecard-items', {
      method: 'POST',
      body: JSON.stringify(item),
    }),
  updateScoreCardItem: (id: number, item: any) =>
    fetchAPI(`/scorecard-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    }),
  deleteScoreCardItem: (id: number) =>
    fetchAPI(`/scorecard-items/${id}`, { method: 'DELETE' }),

  // ========== SCORECARD EVENTS ==========
  getScoreCardEvents: (driverId: number, date: string, category: string) =>
    fetchAPI(`/scorecard-events?driverId=${driverId}&date=${date}&category=${category}`),
  addScoreCardEvent: (event: any) =>
    fetchAPI('/scorecard-events', {
      method: 'POST',
      body: JSON.stringify(event),
    }),
  deleteScoreCardEvents: (driverId: number, date: string, category: string) =>
    fetchAPI(`/scorecard-events?driverId=${driverId}&date=${date}&category=${category}`, {
      method: 'DELETE',
    }),

  // ========== DASHBOARD ==========
  getDashboardStats: () => fetchAPI('/dashboard/stats'),
  getTruckHistory: (truckId: number) => 
    fetchAPI(`/truck-history/${truckId}`),
};