package internal

import (
    "database/sql"
    "encoding/json"
    "net/http"
    "time"
)

// All type declarations come after imports
type Handler struct {
    DB *sql.DB
}

type Customer struct {
    ID        int     `json:"id"`
    Name      string  `json:"name"`
    Email     *string `json:"email,omitempty"`
    CreatedAt string  `json:"created_at"`
}

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

// Then function/method implementations
func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
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

func (h *Handler) ListCaseModels(w http.ResponseWriter, r *http.Request) {
    var models []CaseModelResponse
    
    rows, err := h.DB.Query(`
        SELECT id, model_name, width_inches, depth_inches, sqft, sqft_rounded, warehouse_space_sqft, created_at 
        FROM case_models_stage
    `)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    for rows.Next() {
        var (
            id                  int
            modelName           string
            widthInches         sql.NullFloat64
            depthInches         sql.NullFloat64
            sqft                sql.NullFloat64
            sqftRounded         sql.NullInt64
            warehouseSpaceSqft  sql.NullFloat64
            createdAt           sql.NullTime
        )

        // Fixed the Scan parameters to match the declared variables
        err := rows.Scan(&id, &modelName, &widthInches, &depthInches, &sqft, &sqftRounded, &warehouseSpaceSqft, &createdAt)
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
            WidthInches:        nullableFloat(widthInches),
            DepthInches:        nullableFloat(depthInches),
            Sqft:               nullableFloat(sqft),
            SqftRounded:        nullableInt(sqftRounded),
            WarehouseSpaceSqft: nullableFloat(warehouseSpaceSqft),
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