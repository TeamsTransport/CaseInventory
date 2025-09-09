package main

import (
    "log"
    "net/http"
    "os"
    "time"

    "example.com/api/internal"
    _ "github.com/go-sql-driver/mysql"
    "github.com/gorilla/mux"
)

func main() {
    db, err := internal.OpenDB()
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    db.SetConnMaxLifetime(2 * time.Minute)
    db.SetMaxOpenConns(10)
    db.SetMaxIdleConns(5)

    h := &internal.Handler{DB: db}
    r := mux.NewRouter()

    r.HandleFunc("/api/health", h.Health).Methods("GET")
    r.HandleFunc("/api/customers", h.ListCustomers).Methods("GET")

    port := getenv("PORT", "8081")
    log.Println("API listening on :" + port)
    log.Fatal(http.ListenAndServe(":"+port, cors(r)))
}

func getenv(k, def string) string {
    if v := os.Getenv(k); v != "" { return v }
    return def
}

func cors(h http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin","*")
        w.Header().Set("Access-Control-Allow-Headers","Content-Type, Authorization")
        w.Header().Set("Access-Control-Allow-Methods","GET, POST, PUT, PATCH, DELETE, OPTIONS")
        if r.Method == http.MethodOptions {
            w.WriteHeader(http.StatusNoContent)
            return
        }
        h.ServeHTTP(w, r)
    })
}