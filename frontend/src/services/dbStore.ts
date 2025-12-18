
import { 
  Truck, Driver, DriverType, SafetyCategory, 
  ScoreCardItem, SafetyEvent, ScoreCardEvent, TruckHistoryEvent 
} from '../types';

class DBStore {
  trucks: Truck[] = [
    { truck_id: 1, unit_number: 'T-100', year: 2022, status: 'assigned' },
    { truck_id: 2, unit_number: 'T-205', year: 2023, status: 'available' },
    { truck_id: 3, unit_number: 'T-309', year: 2021, status: 'maintenance' }
  ];

  truckHistory: TruckHistoryEvent[] = [
    { event_id: 1, truck_id: 1, date: '2023-01-15', type: 'assignment', description: 'Assigned to John Doe (D001)' },
    { event_id: 2, truck_id: 2, date: '2023-03-10', type: 'assignment', description: 'Assigned to Jane Smith (D002)' },
    { event_id: 3, truck_id: 2, date: '2024-05-20', type: 'status_change', description: 'Unassigned, returned to available fleet' },
    { event_id: 4, truck_id: 3, date: '2024-06-01', type: 'maintenance', description: 'Routine brake service and tire rotation' },
    { event_id: 5, truck_id: 3, date: '2024-06-05', type: 'status_change', description: 'Moved to maintenance status' }
  ];

  driverTypes: DriverType[] = [
    { driver_type_id: 1, driver_type: 'Owner Operator' },
    { driver_type_id: 2, driver_type: 'Company Driver' }
  ];

  drivers: Driver[] = [
    { driver_id: 1, driver_code: 'D001', first_name: 'John', last_name: 'Doe', start_date: '2023-01-15', truck_id: 1, driver_type_id: 2 },
    { driver_id: 2, driver_code: 'D002', first_name: 'Jane', last_name: 'Smith', start_date: '2023-03-10', truck_id: null, driver_type_id: 1 }
  ];

  safetyCategories: SafetyCategory[] = [
    { category_id: 1, code: 'B00001', description: 'Minor Preventable Accident (<$5000)', scoring_system: 5, p_i_score: 5 },
    { category_id: 2, code: 'P00001', description: 'Major Preventable Accident (>$5000)', scoring_system: 10, p_i_score: 10 },
    { category_id: 3, code: 'B00013', description: 'Speeding 0-10 MPH', scoring_system: 3, p_i_score: 0 },
    { category_id: 4, code: 'P00003', description: 'Passed Level 1 Inspection', scoring_system: -5, p_i_score: -5 },
    { category_id: 5, code: 'P00014', description: 'Passed Spot Check', scoring_system: -1, p_i_score: -1 }
  ];

  scoreCard: ScoreCardItem[] = [
    { sc_category_id: 1, sc_category: 'SAFETY', sc_description: 'Speeding 6-10 MPH Over' },
    { sc_category_id: 2, sc_category: 'SAFETY', sc_description: 'HOS Violation' },
    { sc_category_id: 3, sc_category: 'MAINTENANCE', sc_description: 'DVIRs Completed for Truck' },
    { sc_category_id: 4, sc_category: 'DISPATCH', sc_description: 'On Time for Appointments' }
  ];

  safetyEvents: SafetyEvent[] = [
    { event_id: 1, driver_id: 1, event_date: '2025-01-10', category_id: 4, notes: 'Great inspection result', bonus_score: -5, p_i_score: -5, bonus_period: true },
    { event_id: 2, driver_id: 1, event_date: '2025-02-02', category_id: 3, notes: 'Caught on telematics', bonus_score: 3, p_i_score: 0, bonus_period: true }
  ];

  scoreCardEvents: ScoreCardEvent[] = [];

  private save() {
    localStorage.setItem('safe_drive_db', JSON.stringify({
      trucks: this.trucks,
      drivers: this.drivers,
      safetyEvents: this.safetyEvents,
      scoreCardEvents: this.scoreCardEvents,
      scoreCard: this.scoreCard,
      truckHistory: this.truckHistory,
      safetyCategories: this.safetyCategories,
      driverTypes: this.driverTypes
    }));
  }

  constructor() {
    const saved = localStorage.getItem('safe_drive_db');
    if (saved) {
      const parsed = JSON.parse(saved);
      this.trucks = parsed.trucks || this.trucks;
      this.drivers = parsed.drivers || this.drivers;
      this.safetyEvents = parsed.safetyEvents || this.safetyEvents;
      this.scoreCardEvents = parsed.scoreCardEvents || this.scoreCardEvents;
      this.scoreCard = parsed.scoreCard || this.scoreCard;
      this.truckHistory = parsed.truckHistory || this.truckHistory;
      this.safetyCategories = parsed.safetyCategories || this.safetyCategories;
      this.driverTypes = parsed.driverTypes || this.driverTypes;
    }
  }

  // Scorecard Event Management
  getScoreCardEvents(driverId: number, datePrefix: string, category: string) {
    const validMetricIds = this.scoreCard
      .filter(item => item.sc_category === category)
      .map(item => item.sc_category_id);

    return this.scoreCardEvents.filter(e => 
      e.driver_id === driverId && 
      e.event_date.startsWith(datePrefix) &&
      validMetricIds.includes(e.sc_category_id)
    );
  }

  deleteScoreCardEvents(driverId: number, datePrefix: string, category: string) {
    const validMetricIds = this.scoreCard
      .filter(item => item.sc_category === category)
      .map(item => item.sc_category_id);

    this.scoreCardEvents = this.scoreCardEvents.filter(e => 
      !(e.driver_id === driverId && 
        e.event_date.startsWith(datePrefix) &&
        validMetricIds.includes(e.sc_category_id))
    );
    this.save();
  }

  // Safety Event Management
  deleteSafetyEvent(id: number) {
    this.safetyEvents = this.safetyEvents.filter(e => e.event_id !== id);
    this.save();
  }

  // Truck Management
  addTruck(truck: Omit<Truck, 'truck_id'>) {
    const newTruck = { ...truck, truck_id: Date.now() };
    this.trucks.push(newTruck);
    this.save();
    return newTruck;
  }

  deleteTruck(id: number) {
    this.trucks = this.trucks.filter(t => t.truck_id !== id);
    this.drivers.forEach(d => {
      if (d.truck_id === id) d.truck_id = null;
    });
    this.save();
  }

  addDriver(driver: Omit<Driver, 'driver_id'>) {
    const newDriver = { ...driver, driver_id: Date.now() };
    this.drivers.push(newDriver);
    this.save();
    return newDriver;
  }

  updateDriver(updatedDriver: Driver) {
    const index = this.drivers.findIndex(d => d.driver_id === updatedDriver.driver_id);
    if (index !== -1) {
      this.drivers[index] = updatedDriver;
      this.save();
    }
  }

  deleteDriver(id: number) {
    this.drivers = this.drivers.filter(d => d.driver_id !== id);
    this.safetyEvents = this.safetyEvents.filter(e => e.driver_id !== id);
    this.scoreCardEvents = this.scoreCardEvents.filter(e => e.driver_id !== id);
    this.save();
  }

  addDriverType(type: Omit<DriverType, 'driver_type_id'>) {
    const newType = { ...type, driver_type_id: Date.now() };
    this.driverTypes.push(newType);
    this.save();
    return newType;
  }

  updateDriverType(updatedType: DriverType) {
    const index = this.driverTypes.findIndex(t => t.driver_type_id === updatedType.driver_type_id);
    if (index !== -1) {
      this.driverTypes[index] = updatedType;
      this.save();
    }
  }

  deleteDriverType(id: number) {
    this.driverTypes = this.driverTypes.filter(t => t.driver_type_id !== id);
    this.save();
  }

  addSafetyCategory(category: Omit<SafetyCategory, 'category_id'>) {
    const newCategory = { ...category, category_id: Date.now() };
    this.safetyCategories.push(newCategory);
    this.save();
    return newCategory;
  }

  updateSafetyCategory(updatedCategory: SafetyCategory) {
    const index = this.safetyCategories.findIndex(c => c.category_id === updatedCategory.category_id);
    if (index !== -1) {
      this.safetyCategories[index] = updatedCategory;
      this.save();
    }
  }

  deleteSafetyCategory(id: number) {
    this.safetyCategories = this.safetyCategories.filter(c => c.category_id !== id);
    this.save();
  }

  addSafetyEvent(event: Omit<SafetyEvent, 'event_id'>) {
    const newEvent = { ...event, event_id: Date.now() };
    this.safetyEvents.push(newEvent);
    this.save();
    return newEvent;
  }

  addScoreCardEvent(event: Omit<ScoreCardEvent, 'event_id'>) {
    const newEvent = { ...event, event_id: Date.now() + Math.random() };
    this.scoreCardEvents.push(newEvent);
    this.save();
    return newEvent;
  }

  addScoreCardItem(item: Omit<ScoreCardItem, 'sc_category_id'>) {
    const newItem = { ...item, sc_category_id: Date.now() };
    this.scoreCard.push(newItem);
    this.save();
    return newItem;
  }

  updateScoreCardItem(updatedItem: ScoreCardItem) {
    const index = this.scoreCard.findIndex(i => i.sc_category_id === updatedItem.sc_category_id);
    if (index !== -1) {
      this.scoreCard[index] = updatedItem;
      this.save();
    }
  }

  deleteScoreCardItem(id: number) {
    this.scoreCard = this.scoreCard.filter(i => i.sc_category_id !== id);
    this.save();
  }

  getDriver(id: number) {
    return this.drivers.find(d => d.driver_id === id);
  }

  getDriverStats(driverId: number) {
    const events = this.safetyEvents.filter(e => e.driver_id === driverId);
    const totalBonusScore = events.reduce((sum, e) => sum + Number(e.bonus_score), 0);
    const totalPIScore = events.reduce((sum, e) => sum + Number(e.p_i_score), 0);
    return {
      eventCount: events.length,
      totalBonusScore,
      totalPIScore,
      status: totalBonusScore > 5 ? 'Warning' : 'Good'
    };
  }

  assignDriverToTruck(driverId: number | null, truckId: number) {
    const truck = this.trucks.find(t => t.truck_id === truckId);
    if (!truck) return;

    const today = new Date().toISOString().split('T')[0];

    const currentDriver = this.drivers.find(d => d.truck_id === truckId);
    if (currentDriver && driverId === null) {
        this.truckHistory.push({
            event_id: Date.now(),
            truck_id: truckId,
            date: today,
            type: 'status_change',
            description: `Driver ${currentDriver.first_name} ${currentDriver.last_name} unassigned.`
        });
    }

    this.drivers.forEach(d => {
      if (d.truck_id === truckId) d.truck_id = null;
    });

    if (driverId === null) {
      truck.status = 'available';
    } else {
      const driver = this.drivers.find(d => d.driver_id === driverId);
      if (driver) {
        if (driver.truck_id && driver.truck_id !== truckId) {
          const oldTruck = this.trucks.find(t => t.truck_id === driver.truck_id);
          if (oldTruck) oldTruck.status = 'available';
        }
        driver.truck_id = truckId;
        truck.status = 'assigned';
        
        this.truckHistory.push({
            event_id: Date.now() + 1,
            truck_id: truckId,
            date: today,
            type: 'assignment',
            description: `Assigned to ${driver.first_name} ${driver.last_name} (${driver.driver_code})`
        });
      }
    }
    this.save();
  }

  getTruckHistory(truckId: number) {
    return this.truckHistory.filter(h => h.truck_id === truckId).sort((a, b) => b.date.localeCompare(a.date));
  }
}

export const db = new DBStore();
