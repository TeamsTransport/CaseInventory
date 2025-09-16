package internal

import (
    "database/sql"
    "encoding/json"
    "net/http"
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

type CaseModelResponse struct {
    ID                 int     `json:"id"`
    ModelName          string  `json:"model_name"`
    WidthInches        *float64 `json:"width_inches"`
    DepthInches        *float64 `json:"depth_inches"`
    Sqft               *float64 `json:"sqft"`
    SqftRounded        *int     `json:"sqft_rounded"`
    WarehouseSpaceSqft *float64 `json:"warehouse_space_sqft"`
    CreatedAt          *string  `json:"created_at"`
}

func (h *Handler) ListCaseModels(w http.ResponseWriter, r *http.Request) {
    rows, err := h.DB.Query(`
        SELECT id, model_name, width_inches, depth_inches, sqft, sqft_rounded, warehouse_space_sqft, created_at
        FROM case_models_stage
    `)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    var models []CaseModel
    for rows.Next() {
        var m CaseModel
        err := rows.Scan(&m.ID, &m.ModelName, &m.WidthInches, &m.DepthInches, &m.Sqft, &m.SqftRounded, &m.WarehouseSpaceSqft, &m.CreatedAt)
        if err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }
        models = append(models, m)
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(models)
}

// Define these helper functions at the package level
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

// Your handler function
func YourHandlerFunction(w http.ResponseWriter, r *http.Request) {
    var models []CaseModelResponse
    
    // Your database query code here
    rows, err := db.Query("SELECT ...")
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()
    
    for rows.Next() {
        var (
            id int
            modelName string
            width, depth, sqft, warehouse sql.NullFloat64
            sqftRounded sql.NullInt64
            createdAt sql.NullTime
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
            ID: id,
            ModelName: modelName,
            WidthInches: nullableFloat(width),
            DepthInches: nullableFloat(depth),
            Sqft: nullableFloat(sqft),
            SqftRounded: nullableInt(sqftRounded),
            WarehouseSpaceSqft: nullableFloat(warehouse),
            CreatedAt: createdAtStr,
        })
    }
    
    // Check for errors from iterating over rows
    if err := rows.Err(); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    // Return the response
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(models)
}