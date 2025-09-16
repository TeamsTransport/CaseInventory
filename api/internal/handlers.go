package internal

import (
    "database/sql"
    "encoding/json"
    "net/http"
    "time"
)

type Handler struct {
    DB *sql.DB
}

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type","application/json")
    json.NewEncoder(w).Encode(map[string]string{"status":"ok"})
}

type Customer struct {
    ID        int     `json:"id"`
    Name      string  `json:"name"`
    Email     *string `json:"email,omitempty"`
    CreatedAt string  `json:"created_at"`
}

func (h *Handler) ListCustomers(w http.ResponseWriter, r *http.Request) {
    rows, err := h.DB.Query(`SELECT id, name, email, created_at FROM customers ORDER BY id DESC LIMIT 200`)
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    defer rows.Close()

    out := []Customer{}
    for rows.Next() {
        var c Customer
        if err := rows.Scan(&c.ID, &c.Name, &c.Email, &c.CreatedAt); err != nil {
            http.Error(w, err.Error(), 500)
            return
        }
        out = append(out, c)
    }
    w.Header().Set("Content-Type","application/json")
    json.NewEncoder(w).Encode(out)
}

// CaseModelResponse defines the JSON response structure
type CaseModelResponse struct {
    ID                 int      `json:"id"`
    ModelName          string   `json:"modelName"`
    WidthInches        *float64 `json:"widthInches,omitempty"`
    DepthInches        *float64 `json:"depthInches,omitempty"`
    Sqft               *float64 `json:"sqft,omitempty"`
    SqftRounded        *int     `json:"sqftRounded,omitempty"`
    WarehouseSpaceSqft *float64 `json:"warehouseSpaceSqft,omitempty"`
    CreatedAt          *string  `json:"createdAt,omitempty"`
}

// Health check endpoint
func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// ListCustomers endpoint
func (h *Handler) ListCustomers(w http.ResponseWriter, r *http.Request) {
    // Your customers logic here
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode([]interface{}{}) // Empty array for now
}

// ListCaseModels endpoint
func (h *Handler) ListCaseModels(w http.ResponseWriter, r *http.Request) {
    var models []CaseModelResponse
    
    // Query the database
    rows, err := h.DB.Query(`
        SELECT id, model_name, width, depth, sqft, sqft_rounded, warehouse_space, created_at 
        FROM case_models
    `)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    for rows.Next() {
        var (
            id           int
            modelName    string
            width, depth, sqft, warehouse sql.NullFloat64
            sqftRounded  sql.NullInt64
            createdAt    sql.NullTime
        )

        err := rows.Scan(&id, &modelName, &width, &depth, &sqft, &sqftRounded, &warehouse, &createdAt)
        if err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }

        var createdAtStr *string
        if createdAt.Valid {
            s := createdAt.Time.Format(time.RFC3339)
            createdAtStr = &s
        }

        models = append(models, CaseModelResponse{
            ID:                 id,
            ModelName:          modelName,
            WidthInches:        h.nullableFloat(width),
            DepthInches:        h.nullableFloat(depth),
            Sqft:               h.nullableFloat(sqft),
            SqftRounded:        h.nullableInt(sqftRounded),
            WarehouseSpaceSqft: h.nullableFloat(warehouse),
            CreatedAt:          createdAtStr,
        })
    }

    if err := rows.Err(); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(models)
}package internal

import (
    "database/sql"
    "encoding/json"
    "net/http"
    "time"
)

type Handler struct {
    DB *sql.DB
}

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

type Customer struct {
    ID        int     `json:"id"`
    Name      string  `json:"name"`
    Email     *string `json:"email,omitempty"`
    CreatedAt string  `json:"created_at"`
}

func (h *Handler) ListCustomers(w http.ResponseWriter, r *http.Request) {
    rows, err := h.DB.Query(`SELECT id, name, email, created_at FROM customers ORDER BY id DESC LIMIT 200`)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    out := []Customer{}
    for rows.Next() {
        var c Customer
        if err := rows.Scan(&c.ID, &c.Name, &c.Email, &c.CreatedAt); err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }
        out = append(out, c)
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(out)
}

// CaseModelResponse defines the JSON response structure
type CaseModelResponse struct {
    ID                 int      `json:"id"`
    ModelName          string   `json:"modelName"`
    WidthInches        *float64 `json:"widthInches,omitempty"`
    DepthInches        *float64 `json:"depthInches,omitempty"`
    Sqft               *float64 `json:"sqft,omitempty"`
    SqftRounded        *int     `json:"sqftRounded,omitempty"`
    WarehouseSpaceSqft *float64 `json:"warehouseSpaceSqft,omitempty"`
    CreatedAt          *string  `json:"createdAt,omitempty"`
}

// ListCaseModels endpoint
func (h *Handler) ListCaseModels(w http.ResponseWriter, r *http.Request) {
    var models []CaseModelResponse
    
    // Query the database
    rows, err := h.DB.Query(`
        SELECT id, model_name, width, depth, sqft, sqft_rounded, warehouse_space, created_at 
        FROM case_models
    `)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    for rows.Next() {
        var (
            id           int
            modelName    string
            width, depth, sqft, warehouse sql.NullFloat64
            sqftRounded  sql.NullInt64
            createdAt    sql.NullTime
        )

        err := rows.Scan(&id, &modelName, &width, &depth, &sqft, &sqftRounded, &warehouse, &createdAt)
        if err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }

        var createdAtStr *string
        if createdAt.Valid {
            s := createdAt.Time.Format(time.RFC3339)
            createdAtStr = &s
        }

        models = append(models, CaseModelResponse{
            ID:                 id,
            ModelName:          modelName,
            WidthInches:        nullableFloat(width),
            DepthInches:        nullableFloat(depth),
            Sqft:               nullableFloat(sqft),
            SqftRounded:        nullableInt(sqftRounded),
            WarehouseSpaceSqft: nullableFloat(warehouse),
            CreatedAt:          createdAtStr,
        })
    }

    if err := rows.Err(); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(models)
}

// Helper functions (not methods since they don't need DB access)
func nullableFloat(f sql.NullFloat64) *float64 {
    if f.Valid {
        return &f.Float64
    }
    return nil
}

func nullableInt(i sql.NullInt64) *int {
    if i.Valid {
        val := int(i.Int64)
        return &val
    }
    return nil
}

// Helper methods for the Handler struct
func (h *Handler) nullableFloat(f sql.NullFloat64) *float64 {
    if f.Valid {
        return &f.Float64
    }
    return nil
}

func (h *Handler) nullableInt(i sql.NullInt64) *int {
    if i.Valid {
        val := int(i.Int64)
        return &val
    }
    return nil
}