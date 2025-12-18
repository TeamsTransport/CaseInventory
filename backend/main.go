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
    
    // Assign Driver to Truck
    router.HandleFunc("/api/assign-driver", assignDriverToTruck).Methods("POST")
    
    // Truck History
    router.HandleFunc("/api/truck-history/{truckId}", getTruckHistory).Methods("GET")
    
    // Scorecard APIs
    router.HandleFunc("/api/scorecard-items", getScoreCardItems).Methods("GET")
    router.HandleFunc("/api/scorecard-events", getScoreCardEvents).Methods("GET")
    router.HandleFunc("/api/scorecard-events", createScoreCardEvent).Methods("POST")
    router.HandleFunc("/api/scorecard-events/batch", deleteScoreCardEvents).Methods("DELETE")
    
    // Dashboard stats
    router.HandleFunc("/api/dashboard/stats", getDashboardStats).Methods("GET")
    
    // Enable CORS
    c := cors.New(cors.Options{
        AllowedOrigins:   []string{"http://localhost", "http://frontend"},
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

// Example handler - you'll need to implement all handlers
func getDrivers(w http.ResponseWriter, r *http.Request) {
    rows, err := db.Query("SELECT * FROM drivers")
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()
    
    var drivers []Driver
    for rows.Next() {
        var d Driver
        err := rows.Scan(&d.DriverID, &d.DriverCode, &d.FirstName, &d.LastName, 
                         &d.StartDate, &d.TruckID, &d.DriverTypeID, &d.ProfilePic)
        if err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }
        drivers = append(drivers, d)
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(drivers)
}

func createDriver(w http.ResponseWriter, r *http.Request) {
    var driver Driver
    if err := json.NewDecoder(r.Body).Decode(&driver); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    
    result, err := db.Exec("INSERT INTO drivers (driver_code, first_name, last_name, start_date, truck_id, driver_type_id, profile_pic) VALUES (?, ?, ?, ?, ?, ?, ?)",
        driver.DriverCode, driver.FirstName, driver.LastName, driver.StartDate, 
        driver.TruckID, driver.DriverTypeID, driver.ProfilePic)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    id, _ := result.LastInsertId()
    driver.DriverID = int(id)
    
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(driver)
}

// ... Implement all other handlers similarly