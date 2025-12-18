package main

import (
    "database/sql"
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "os"
    "strconv"
    "time"

    "github.com/gorilla/mux"
    "github.com/rs/cors"
    _ "github.com/go-sql-driver/mysql"
)

var db *sql.DB

// Define all struct types
type Truck struct {
    TruckID    int    `json:"truck_id"`
    UnitNumber string `json:"unit_number"`
    Year       int    `json:"year"`
    Status     string `json:"status"`
}

type Driver struct {
    DriverID      int    `json:"driver_id"`
    DriverCode    string `json:"driver_code"`
    FirstName     string `json:"first_name"`
    LastName      string `json:"last_name"`
    StartDate     string `json:"start_date"`
    TruckID       *int   `json:"truck_id"`
    DriverTypeID  *int   `json:"driver_type_id"`
    ProfilePic    string `json:"profile_pic"`
}

type DriverType struct {
    DriverTypeID int    `json:"driver_type_id"`
    DriverType   string `json:"driver_type"`
}

type SafetyCategory struct {
    CategoryID    int    `json:"category_id"`
    Code          string `json:"code"`
    Description   string `json:"description"`
    ScoringSystem int    `json:"scoring_system"`
    PIScore       int    `json:"p_i_score"`
}

type SafetyEvent struct {
    EventID     int    `json:"event_id"`
    DriverID    int    `json:"driver_id"`
    EventDate   string `json:"event_date"`
    CategoryID  int    `json:"category_id"`
    Notes       string `json:"notes"`
    BonusScore  int    `json:"bonus_score"`
    PIScore     int    `json:"p_i_score"`
    BonusPeriod bool   `json:"bonus_period"`
}

type ScoreCardItem struct {
    ScCategoryID  int    `json:"sc_category_id"`
    ScCategory    string `json:"sc_category"`
    ScDescription string `json:"sc_description"`
    DriverTypeID  *int   `json:"driver_type_id"`
}

type ScoreCardEvent struct {
    EventID       int    `json:"event_id"`
    DriverID      int    `json:"driver_id"`
    EventDate     string `json:"event_date"`
    ScCategoryID  int    `json:"sc_category_id"`
    ScScore       int    `json:"sc_score"`
    Notes         string `json:"notes"`
}

type TruckHistoryEvent struct {
    EventID     int    `json:"event_id"`
    TruckID     int    `json:"truck_id"`
    Date        string `json:"date"`
    Type        string `json:"type"`
    Description string `json:"description"`
}

type DashboardStats struct {
    TotalDrivers  int     `json:"totalDrivers"`
    TotalEvents   int     `json:"totalEvents"`
    AvgBonusScore float64 `json:"avgBonusScore"`
    ActiveTrucks  int     `json:"activeTrucks"`
    TotalTrucks   int     `json:"totalTrucks"`
}

func initDB() {
    var err error
    dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true",
        os.Getenv("DB_USER"),
        os.Getenv("DB_PASSWORD"),
        os.Getenv("DB_HOST"),
        os.Getenv("DB_PORT"),
        os.Getenv("DB_NAME"))
    
    db, err = sql.Open("mysql", dsn)
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }
    
    db.SetMaxOpenConns(25)
    db.SetMaxIdleConns(25)
    db.SetConnMaxLifetime(5 * time.Minute)
    
    if err = db.Ping(); err != nil {
        log.Fatal("Failed to ping database:", err)
    }
    log.Println("Connected to database")
}

func jsonResponse(w http.ResponseWriter, data interface{}, status int) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(data)
}

func jsonError(w http.ResponseWriter, message string, status int) {
    jsonResponse(w, map[string]string{"error": message}, status)
}

// ========== DRIVER HANDLERS ==========
func getDrivers(w http.ResponseWriter, r *http.Request) {
    rows, err := db.Query("SELECT * FROM drivers")
    if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()
    
    var drivers []Driver
    for rows.Next() {
        var d Driver
        err := rows.Scan(&d.DriverID, &d.DriverCode, &d.FirstName, &d.LastName, 
                         &d.StartDate, &d.TruckID, &d.DriverTypeID, &d.ProfilePic)
        if err != nil {
            jsonError(w, err.Error(), http.StatusInternalServerError)
            return
        }
        drivers = append(drivers, d)
    }
    
    jsonResponse(w, drivers, http.StatusOK)
}

func getDriver(w http.ResponseWriter, r *http.Request) {
    params := mux.Vars(r)
    id, err := strconv.Atoi(params["id"])
    if err != nil {
        jsonError(w, "Invalid driver ID", http.StatusBadRequest)
        return
    }
    
    var driver Driver
    err = db.QueryRow("SELECT * FROM drivers WHERE driver_id = ?", id).Scan(
        &driver.DriverID, &driver.DriverCode, &driver.FirstName, &driver.LastName,
        &driver.StartDate, &driver.TruckID, &driver.DriverTypeID, &driver.ProfilePic)
    
    if err == sql.ErrNoRows {
        jsonError(w, "Driver not found", http.StatusNotFound)
        return
    } else if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    jsonResponse(w, driver, http.StatusOK)
}

func createDriver(w http.ResponseWriter, r *http.Request) {
    var driver Driver
    if err := json.NewDecoder(r.Body).Decode(&driver); err != nil {
        jsonError(w, err.Error(), http.StatusBadRequest)
        return
    }
    
    result, err := db.Exec("INSERT INTO drivers (driver_code, first_name, last_name, start_date, truck_id, driver_type_id, profile_pic) VALUES (?, ?, ?, ?, ?, ?, ?)",
        driver.DriverCode, driver.FirstName, driver.LastName, driver.StartDate, 
        driver.TruckID, driver.DriverTypeID, driver.ProfilePic)
    if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    id, _ := result.LastInsertId()
    driver.DriverID = int(id)
    
    jsonResponse(w, driver, http.StatusCreated)
}

func updateDriver(w http.ResponseWriter, r *http.Request) {
    params := mux.Vars(r)
    id, err := strconv.Atoi(params["id"])
    if err != nil {
        jsonError(w, "Invalid driver ID", http.StatusBadRequest)
        return
    }
    
    var driver Driver
    if err := json.NewDecoder(r.Body).Decode(&driver); err != nil {
        jsonError(w, err.Error(), http.StatusBadRequest)
        return
    }
    driver.DriverID = id
    
    _, err = db.Exec("UPDATE drivers SET driver_code=?, first_name=?, last_name=?, start_date=?, truck_id=?, driver_type_id=?, profile_pic=? WHERE driver_id=?",
        driver.DriverCode, driver.FirstName, driver.LastName, driver.StartDate,
        driver.TruckID, driver.DriverTypeID, driver.ProfilePic, id)
    if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    jsonResponse(w, driver, http.StatusOK)
}

func deleteDriver(w http.ResponseWriter, r *http.Request) {
    params := mux.Vars(r)
    id, err := strconv.Atoi(params["id"])
    if err != nil {
        jsonError(w, "Invalid driver ID", http.StatusBadRequest)
        return
    }
    
    _, err = db.Exec("DELETE FROM drivers WHERE driver_id = ?", id)
    if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    jsonResponse(w, map[string]string{"message": "Driver deleted"}, http.StatusOK)
}

// ========== TRUCK HANDLERS ==========
func getTrucks(w http.ResponseWriter, r *http.Request) {
    rows, err := db.Query("SELECT * FROM trucks")
    if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()
    
    var trucks []Truck
    for rows.Next() {
        var t Truck
        err := rows.Scan(&t.TruckID, &t.UnitNumber, &t.Year, &t.Status)
        if err != nil {
            jsonError(w, err.Error(), http.StatusInternalServerError)
            return
        }
        trucks = append(trucks, t)
    }
    
    jsonResponse(w, trucks, http.StatusOK)
}

func getTruck(w http.ResponseWriter, r *http.Request) {
    params := mux.Vars(r)
    id, err := strconv.Atoi(params["id"])
    if err != nil {
        jsonError(w, "Invalid truck ID", http.StatusBadRequest)
        return
    }
    
    var truck Truck
    err = db.QueryRow("SELECT * FROM trucks WHERE truck_id = ?", id).Scan(
        &truck.TruckID, &truck.UnitNumber, &truck.Year, &truck.Status)
    
    if err == sql.ErrNoRows {
        jsonError(w, "Truck not found", http.StatusNotFound)
        return
    } else if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    jsonResponse(w, truck, http.StatusOK)
}

func createTruck(w http.ResponseWriter, r *http.Request) {
    var truck Truck
    if err := json.NewDecoder(r.Body).Decode(&truck); err != nil {
        jsonError(w, err.Error(), http.StatusBadRequest)
        return
    }
    
    result, err := db.Exec("INSERT INTO trucks (unit_number, year, status) VALUES (?, ?, ?)",
        truck.UnitNumber, truck.Year, truck.Status)
    if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    id, _ := result.LastInsertId()
    truck.TruckID = int(id)
    
    jsonResponse(w, truck, http.StatusCreated)
}

func updateTruck(w http.ResponseWriter, r *http.Request) {
    params := mux.Vars(r)
    id, err := strconv.Atoi(params["id"])
    if err != nil {
        jsonError(w, "Invalid truck ID", http.StatusBadRequest)
        return
    }
    
    var truck Truck
    if err := json.NewDecoder(r.Body).Decode(&truck); err != nil {
        jsonError(w, err.Error(), http.StatusBadRequest)
        return
    }
    truck.TruckID = id
    
    _, err = db.Exec("UPDATE trucks SET unit_number=?, year=?, status=? WHERE truck_id=?",
        truck.UnitNumber, truck.Year, truck.Status, id)
    if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    jsonResponse(w, truck, http.StatusOK)
}

func deleteTruck(w http.ResponseWriter, r *http.Request) {
    params := mux.Vars(r)
    id, err := strconv.Atoi(params["id"])
    if err != nil {
        jsonError(w, "Invalid truck ID", http.StatusBadRequest)
        return
    }
    
    _, err = db.Exec("DELETE FROM trucks WHERE truck_id = ?", id)
    if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    jsonResponse(w, map[string]string{"message": "Truck deleted"}, http.StatusOK)
}

// ========== SAFETY CATEGORY HANDLERS ==========
func getSafetyCategories(w http.ResponseWriter, r *http.Request) {
    rows, err := db.Query("SELECT * FROM safety_categories")
    if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()
    
    var categories []SafetyCategory
    for rows.Next() {
        var c SafetyCategory
        err := rows.Scan(&c.CategoryID, &c.Code, &c.Description, &c.ScoringSystem, &c.PIScore)
        if err != nil {
            jsonError(w, err.Error(), http.StatusInternalServerError)
            return
        }
        categories = append(categories, c)
    }
    
    jsonResponse(w, categories, http.StatusOK)
}

func getSafetyCategory(w http.ResponseWriter, r *http.Request) {
    params := mux.Vars(r)
    id, err := strconv.Atoi(params["id"])
    if err != nil {
        jsonError(w, "Invalid category ID", http.StatusBadRequest)
        return
    }
    
    var category SafetyCategory
    err = db.QueryRow("SELECT * FROM safety_categories WHERE category_id = ?", id).Scan(
        &category.CategoryID, &category.Code, &category.Description, &category.ScoringSystem, &category.PIScore)
    
    if err == sql.ErrNoRows {
        jsonError(w, "Category not found", http.StatusNotFound)
        return
    } else if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    jsonResponse(w, category, http.StatusOK)
}

func createSafetyCategory(w http.ResponseWriter, r *http.Request) {
    var category SafetyCategory
    if err := json.NewDecoder(r.Body).Decode(&category); err != nil {
        jsonError(w, err.Error(), http.StatusBadRequest)
        return
    }
    
    result, err := db.Exec("INSERT INTO safety_categories (code, description, scoring_system, p_i_score) VALUES (?, ?, ?, ?)",
        category.Code, category.Description, category.ScoringSystem, category.PIScore)
    if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    id, _ := result.LastInsertId()
    category.CategoryID = int(id)
    
    jsonResponse(w, category, http.StatusCreated)
}

func updateSafetyCategory(w http.ResponseWriter, r *http.Request) {
    params := mux.Vars(r)
    id, err := strconv.Atoi(params["id"])
    if err != nil {
        jsonError(w, "Invalid category ID", http.StatusBadRequest)
        return
    }
    
    var category SafetyCategory
    if err := json.NewDecoder(r.Body).Decode(&category); err != nil {
        jsonError(w, err.Error(), http.StatusBadRequest)
        return
    }
    category.CategoryID = id
    
    _, err = db.Exec("UPDATE safety_categories SET code=?, description=?, scoring_system=?, p_i_score=? WHERE category_id=?",
        category.Code, category.Description, category.ScoringSystem, category.PIScore, id)
    if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    jsonResponse(w, category, http.StatusOK)
}

func deleteSafetyCategory(w http.ResponseWriter, r *http.Request) {
    params := mux.Vars(r)
    id, err := strconv.Atoi(params["id"])
    if err != nil {
        jsonError(w, "Invalid category ID", http.StatusBadRequest)
        return
    }
    
    _, err = db.Exec("DELETE FROM safety_categories WHERE category_id = ?", id)
    if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    jsonResponse(w, map[string]string{"message": "Category deleted"}, http.StatusOK)
}

// ========== SAFETY EVENT HANDLERS ==========
func getSafetyEvents(w http.ResponseWriter, r *http.Request) {
    query := "SELECT * FROM safety_events WHERE 1=1"
    args := []interface{}{}
    
    // Parse query parameters
    driverID := r.URL.Query().Get("driverId")
    startDate := r.URL.Query().Get("startDate")
    endDate := r.URL.Query().Get("endDate")
    
    if driverID != "" && driverID != "0" {
        query += " AND driver_id = ?"
        id, _ := strconv.Atoi(driverID)
        args = append(args, id)
    }
    if startDate != "" {
        query += " AND event_date >= ?"
        args = append(args, startDate)
    }
    if endDate != "" {
        query += " AND event_date <= ?"
        args = append(args, endDate)
    }
    
    query += " ORDER BY event_date DESC"
    
    rows, err := db.Query(query, args...)
    if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()
    
    var events []SafetyEvent
    for rows.Next() {
        var e SafetyEvent
        err := rows.Scan(&e.EventID, &e.DriverID, &e.EventDate, &e.CategoryID, 
                         &e.Notes, &e.BonusScore, &e.PIScore, &e.BonusPeriod)
        if err != nil {
            jsonError(w, err.Error(), http.StatusInternalServerError)
            return
        }
        events = append(events, e)
    }
    
    jsonResponse(w, events, http.StatusOK)
}

func getSafetyEvent(w http.ResponseWriter, r *http.Request) {
    params := mux.Vars(r)
    id, err := strconv.Atoi(params["id"])
    if err != nil {
        jsonError(w, "Invalid event ID", http.StatusBadRequest)
        return
    }
    
    var event SafetyEvent
    err = db.QueryRow("SELECT * FROM safety_events WHERE event_id = ?", id).Scan(
        &event.EventID, &event.DriverID, &event.EventDate, &event.CategoryID,
        &event.Notes, &event.BonusScore, &event.PIScore, &event.BonusPeriod)
    
    if err == sql.ErrNoRows {
        jsonError(w, "Event not found", http.StatusNotFound)
        return
    } else if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    jsonResponse(w, event, http.StatusOK)
}

func createSafetyEvent(w http.ResponseWriter, r *http.Request) {
    var event SafetyEvent
    if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
        jsonError(w, err.Error(), http.StatusBadRequest)
        return
    }
    
    result, err := db.Exec("INSERT INTO safety_events (driver_id, event_date, category_id, notes, bonus_score, p_i_score, bonus_period) VALUES (?, ?, ?, ?, ?, ?, ?)",
        event.DriverID, event.EventDate, event.CategoryID, event.Notes, 
        event.BonusScore, event.PIScore, event.BonusPeriod)
    if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    id, _ := result.LastInsertId()
    event.EventID = int(id)
    
    jsonResponse(w, event, http.StatusCreated)
}

func updateSafetyEvent(w http.ResponseWriter, r *http.Request) {
    params := mux.Vars(r)
    id, err := strconv.Atoi(params["id"])
    if err != nil {
        jsonError(w, "Invalid event ID", http.StatusBadRequest)
        return
    }
    
    var event SafetyEvent
    if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
        jsonError(w, err.Error(), http.StatusBadRequest)
        return
    }
    event.EventID = id
    
    _, err = db.Exec("UPDATE safety_events SET driver_id=?, event_date=?, category_id=?, notes=?, bonus_score=?, p_i_score=?, bonus_period=? WHERE event_id=?",
        event.DriverID, event.EventDate, event.CategoryID, event.Notes,
        event.BonusScore, event.PIScore, event.BonusPeriod, id)
    if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    jsonResponse(w, event, http.StatusOK)
}

func deleteSafetyEvent(w http.ResponseWriter, r *http.Request) {
    params := mux.Vars(r)
    id, err := strconv.Atoi(params["id"])
    if err != nil {
        jsonError(w, "Invalid event ID", http.StatusBadRequest)
        return
    }
    
    _, err = db.Exec("DELETE FROM safety_events WHERE event_id = ?", id)
    if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    jsonResponse(w, map[string]string{"message": "Safety event deleted"}, http.StatusOK)
}

// ========== DRIVER TYPE HANDLERS ==========
func getDriverTypes(w http.ResponseWriter, r *http.Request) {
    rows, err := db.Query("SELECT * FROM driver_types")
    if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()
    
    var types []DriverType
    for rows.Next() {
        var t DriverType
        err := rows.Scan(&t.DriverTypeID, &t.DriverType)
        if err != nil {
            jsonError(w, err.Error(), http.StatusInternalServerError)
            return
        }
        types = append(types, t)
    }
    
    jsonResponse(w, types, http.StatusOK)
}

func createDriverType(w http.ResponseWriter, r *http.Request) {
    var driverType DriverType
    if err := json.NewDecoder(r.Body).Decode(&driverType); err != nil {
        jsonError(w, err.Error(), http.StatusBadRequest)
        return
    }
    
    result, err := db.Exec("INSERT INTO driver_types (driver_type) VALUES (?)",
        driverType.DriverType)
    if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    id, _ := result.LastInsertId()
    driverType.DriverTypeID = int(id)
    
    jsonResponse(w, driverType, http.StatusCreated)
}

func updateDriverType(w http.ResponseWriter, r *http.Request) {
    params := mux.Vars(r)
    id, err := strconv.Atoi(params["id"])
    if err != nil {
        jsonError(w, "Invalid driver type ID", http.StatusBadRequest)
        return
    }
    
    var driverType DriverType
    if err := json.NewDecoder(r.Body).Decode(&driverType); err != nil {
        jsonError(w, err.Error(), http.StatusBadRequest)
        return
    }
    driverType.DriverTypeID = id
    
    _, err = db.Exec("UPDATE driver_types SET driver_type=? WHERE driver_type_id=?",
        driverType.DriverType, id)
    if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    jsonResponse(w, driverType, http.StatusOK)
}

func deleteDriverType(w http.ResponseWriter, r *http.Request) {
    params := mux.Vars(r)
    id, err := strconv.Atoi(params["id"])
    if err != nil {
        jsonError(w, "Invalid driver type ID", http.StatusBadRequest)
        return
    }
    
    _, err = db.Exec("DELETE FROM driver_types WHERE driver_type_id = ?", id)
    if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    jsonResponse(w, map[string]string{"message": "Driver type deleted"}, http.StatusOK)
}

// ========== ASSIGN DRIVER TO TRUCK HANDLER ==========
func assignDriverToTruck(w http.ResponseWriter, r *http.Request) {
    var data struct {
        DriverID *int `json:"driverId"`
        TruckID  int  `json:"truckId"`
    }
    
    if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
        jsonError(w, err.Error(), http.StatusBadRequest)
        return
    }
    
    // Start transaction
    tx, err := db.Begin()
    if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    // First, unassign any driver from this truck
    _, err = tx.Exec("UPDATE drivers SET truck_id = NULL WHERE truck_id = ?", data.TruckID)
    if err != nil {
        tx.Rollback()
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    // Update truck status
    truckStatus := "available"
    if data.DriverID != nil {
        truckStatus = "assigned"
        // Assign the driver
        _, err = tx.Exec("UPDATE drivers SET truck_id = ? WHERE driver_id = ?", data.TruckID, *data.DriverID)
        if err != nil {
            tx.Rollback()
            jsonError(w, err.Error(), http.StatusInternalServerError)
            return
        }
    }
    
    // Update truck status
    _, err = tx.Exec("UPDATE trucks SET status = ? WHERE truck_id = ?", truckStatus, data.TruckID)
    if err != nil {
        tx.Rollback()
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    // Add to truck history
    today := time.Now().Format("2006-01-02")
    var description string
    if data.DriverID != nil {
        var driverName string
        db.QueryRow("SELECT CONCAT(first_name, ' ', last_name) FROM drivers WHERE driver_id = ?", *data.DriverID).Scan(&driverName)
        description = fmt.Sprintf("Assigned to %s", driverName)
    } else {
        description = "Driver unassigned"
    }
    
    _, err = tx.Exec("INSERT INTO truck_history (truck_id, date, type, description) VALUES (?, ?, ?, ?)",
        data.TruckID, today, "assignment", description)
    if err != nil {
        tx.Rollback()
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    // Commit transaction
    if err = tx.Commit(); err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    jsonResponse(w, map[string]string{"message": "Driver assignment updated"}, http.StatusOK)
}

// ========== TRUCK HISTORY HANDLER ==========
func getTruckHistory(w http.ResponseWriter, r *http.Request) {
    params := mux.Vars(r)
    truckID, err := strconv.Atoi(params["truckId"])
    if err != nil {
        jsonError(w, "Invalid truck ID", http.StatusBadRequest)
        return
    }
    
    rows, err := db.Query("SELECT * FROM truck_history WHERE truck_id = ? ORDER BY date DESC", truckID)
    if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()
    
    var history []TruckHistoryEvent
    for rows.Next() {
        var h TruckHistoryEvent
        err := rows.Scan(&h.EventID, &h.TruckID, &h.Date, &h.Type, &h.Description)
        if err != nil {
            jsonError(w, err.Error(), http.StatusInternalServerError)
            return
        }
        history = append(history, h)
    }
    
    jsonResponse(w, history, http.StatusOK)
}

// ========== SCORECARD ITEM HANDLERS ==========
func getScoreCardItems(w http.ResponseWriter, r *http.Request) {
    rows, err := db.Query("SELECT * FROM scorecard_items")
    if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()
    
    var items []ScoreCardItem
    for rows.Next() {
        var i ScoreCardItem
        err := rows.Scan(&i.ScCategoryID, &i.ScCategory, &i.ScDescription, &i.DriverTypeID)
        if err != nil {
            jsonError(w, err.Error(), http.StatusInternalServerError)
            return
        }
        items = append(items, i)
    }
    
    jsonResponse(w, items, http.StatusOK)
}

func createScoreCardItem(w http.ResponseWriter, r *http.Request) {
    var item ScoreCardItem
    if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
        jsonError(w, err.Error(), http.StatusBadRequest)
        return
    }
    
    result, err := db.Exec("INSERT INTO scorecard_items (sc_category, sc_description, driver_type_id) VALUES (?, ?, ?)",
        item.ScCategory, item.ScDescription, item.DriverTypeID)
    if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    id, _ := result.LastInsertId()
    item.ScCategoryID = int(id)
    
    jsonResponse(w, item, http.StatusCreated)
}

func updateScoreCardItem(w http.ResponseWriter, r *http.Request) {
    params := mux.Vars(r)
    id, err := strconv.Atoi(params["id"])
    if err != nil {
        jsonError(w, "Invalid scorecard item ID", http.StatusBadRequest)
        return
    }
    
    var item ScoreCardItem
    if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
        jsonError(w, err.Error(), http.StatusBadRequest)
        return
    }
    item.ScCategoryID = id
    
    _, err = db.Exec("UPDATE scorecard_items SET sc_category=?, sc_description=?, driver_type_id=? WHERE sc_category_id=?",
        item.ScCategory, item.ScDescription, item.DriverTypeID, id)
    if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    jsonResponse(w, item, http.StatusOK)
}

func deleteScoreCardItem(w http.ResponseWriter, r *http.Request) {
    params := mux.Vars(r)
    id, err := strconv.Atoi(params["id"])
    if err != nil {
        jsonError(w, "Invalid scorecard item ID", http.StatusBadRequest)
        return
    }
    
    _, err = db.Exec("DELETE FROM scorecard_items WHERE sc_category_id = ?", id)
    if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    jsonResponse(w, map[string]string{"message": "Scorecard item deleted"}, http.StatusOK)
}

// ========== SCORECARD EVENT HANDLERS ==========
func getScoreCardEvents(w http.ResponseWriter, r *http.Request) {
    driverID := r.URL.Query().Get("driverId")
    date := r.URL.Query().Get("date")
    category := r.URL.Query().Get("category")
    
    if driverID == "" || date == "" {
        jsonError(w, "Missing required parameters: driverId and date", http.StatusBadRequest)
        return
    }
    
    query := "SELECT e.* FROM scorecard_events e INNER JOIN scorecard_items i ON e.sc_category_id = i.sc_category_id WHERE e.driver_id = ? AND e.event_date LIKE ?"
    args := []interface{}{driverID, date + "%"}
    
    if category != "" {
        query += " AND i.sc_category = ?"
        args = append(args, category)
    }
    
    rows, err := db.Query(query, args...)
    if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()
    
    var events []ScoreCardEvent
    for rows.Next() {
        var e ScoreCardEvent
        err := rows.Scan(&e.EventID, &e.DriverID, &e.EventDate, &e.ScCategoryID, &e.ScScore, &e.Notes)
        if err != nil {
            jsonError(w, err.Error(), http.StatusInternalServerError)
            return
        }
        events = append(events, e)
    }
    
    jsonResponse(w, events, http.StatusOK)
}

func createScoreCardEvent(w http.ResponseWriter, r *http.Request) {
    var event ScoreCardEvent
    if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
        jsonError(w, err.Error(), http.StatusBadRequest)
        return
    }
    
    result, err := db.Exec("INSERT INTO scorecard_events (driver_id, event_date, sc_category_id, sc_score, notes) VALUES (?, ?, ?, ?, ?)",
        event.DriverID, event.EventDate, event.ScCategoryID, event.ScScore, event.Notes)
    if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    id, _ := result.LastInsertId()
    event.EventID = int(id)
    
    jsonResponse(w, event, http.StatusCreated)
}

func deleteScoreCardEvents(w http.ResponseWriter, r *http.Request) {
    driverID := r.URL.Query().Get("driverId")
    date := r.URL.Query().Get("date")
    category := r.URL.Query().Get("category")
    
    if driverID == "" || date == "" || category == "" {
        jsonError(w, "Missing required parameters: driverId, date, and category", http.StatusBadRequest)
        return
    }
    
    query := "DELETE e FROM scorecard_events e INNER JOIN scorecard_items i ON e.sc_category_id = i.sc_category_id WHERE e.driver_id = ? AND e.event_date LIKE ? AND i.sc_category = ?"
    _, err := db.Exec(query, driverID, date+"%", category)
    if err != nil {
        jsonError(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    jsonResponse(w, map[string]string{"message": "Scorecard events deleted"}, http.StatusOK)
}

// ========== DASHBOARD HANDLER ==========
func getDashboardStats(w http.ResponseWriter, r *http.Request) {
    var stats DashboardStats
    
    // Get total drivers
    db.QueryRow("SELECT COUNT(*) FROM drivers").Scan(&stats.TotalDrivers)
    
    // Get total events (last 30 days)
    thirtyDaysAgo := time.Now().AddDate(0, 0, -30).Format("2006-01-02")
    db.QueryRow("SELECT COUNT(*) FROM safety_events WHERE event_date >= ?", thirtyDaysAgo).Scan(&stats.TotalEvents)
    
    // Get average bonus score
    db.QueryRow("SELECT AVG(bonus_score) FROM safety_events WHERE event_date >= ?", thirtyDaysAgo).Scan(&stats.AvgBonusScore)
    
    // Get truck stats
    db.QueryRow("SELECT COUNT(*) FROM trucks WHERE status = 'assigned'").Scan(&stats.ActiveTrucks)
    db.QueryRow("SELECT COUNT(*) FROM trucks").Scan(&stats.TotalTrucks)
    
    jsonResponse(w, stats, http.StatusOK)
}

func main() {
    initDB()
    
    router := mux.NewRouter()
    
    // Drivers API
    router.HandleFunc("/api/drivers", getDrivers).Methods("GET")
    router.HandleFunc("/api/drivers/{id}", getDriver).Methods("GET")
    router.HandleFunc("/api/drivers", createDriver).Methods("POST")
    router.HandleFunc("/api/drivers/{id}", updateDriver).Methods("PUT")
    router.HandleFunc("/api/drivers/{id}", deleteDriver).Methods("DELETE")
    
    // Trucks API
    router.HandleFunc("/api/trucks", getTrucks).Methods("GET")
    router.HandleFunc("/api/trucks/{id}", getTruck).Methods("GET")
    router.HandleFunc("/api/trucks", createTruck).Methods("POST")
    router.HandleFunc("/api/trucks/{id}", updateTruck).Methods("PUT")
    router.HandleFunc("/api/trucks/{id}", deleteTruck).Methods("DELETE")
    
    // Safety Categories API
    router.HandleFunc("/api/safety-categories", getSafetyCategories).Methods("GET")
    router.HandleFunc("/api/safety-categories/{id}", getSafetyCategory).Methods("GET")
    router.HandleFunc("/api/safety-categories", createSafetyCategory).Methods("POST")
    router.HandleFunc("/api/safety-categories/{id}", updateSafetyCategory).Methods("PUT")
    router.HandleFunc("/api/safety-categories/{id}", deleteSafetyCategory).Methods("DELETE")
    
    // Safety Events API
    router.HandleFunc("/api/safety-events", getSafetyEvents).Methods("GET")
    router.HandleFunc("/api/safety-events/{id}", getSafetyEvent).Methods("GET")
    router.HandleFunc("/api/safety-events", createSafetyEvent).Methods("POST")
    router.HandleFunc("/api/safety-events/{id}", updateSafetyEvent).Methods("PUT")
    router.HandleFunc("/api/safety-events/{id}", deleteSafetyEvent).Methods("DELETE")
    
    // Driver Types API
    router.HandleFunc("/api/driver-types", getDriverTypes).Methods("GET")
    router.HandleFunc("/api/driver-types", createDriverType).Methods("POST")
    router.HandleFunc("/api/driver-types/{id}", updateDriverType).Methods("PUT")
    router.HandleFunc("/api/driver-types/{id}", deleteDriverType).Methods("DELETE")
    
    // Assign Driver to Truck
    router.HandleFunc("/api/assign-driver", assignDriverToTruck).Methods("POST")
    
    // Truck History
    router.HandleFunc("/api/truck-history/{truckId}", getTruckHistory).Methods("GET")
    
    // Scorecard Items (Configuration)
    router.HandleFunc("/api/scorecard-items", getScoreCardItems).Methods("GET")
    router.HandleFunc("/api/scorecard-items", createScoreCardItem).Methods("POST")
    router.HandleFunc("/api/scorecard-items/{id}", updateScoreCardItem).Methods("PUT")
    router.HandleFunc("/api/scorecard-items/{id}", deleteScoreCardItem).Methods("DELETE")
    
    // Scorecard Events
    router.HandleFunc("/api/scorecard-events", getScoreCardEvents).Methods("GET")
    router.HandleFunc("/api/scorecard-events", createScoreCardEvent).Methods("POST")
    router.HandleFunc("/api/scorecard-events", deleteScoreCardEvents).Methods("DELETE")
    
    // Dashboard stats
    router.HandleFunc("/api/dashboard/stats", getDashboardStats).Methods("GET")
    
    // Health check
    router.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
        jsonResponse(w, map[string]string{"status": "healthy"}, http.StatusOK)
    }).Methods("GET")
    
    // Enable CORS
    c := cors.New(cors.Options{
        AllowedOrigins:   []string{"http://localhost", "http://frontend", "http://localhost:3000", "http://localhost:5173"},
        AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowedHeaders:   []string{"*"},
        AllowCredentials: true,
    })
    
    handler := c.Handler(router)
    
    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }
    
    log.Printf("Server starting on port %s", port)
    log.Fatal(http.ListenAndServe(":"+port, handler))
}