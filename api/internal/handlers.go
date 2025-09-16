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

type CaseModel struct {
    ID                 int             `json:"id"`
    ModelName          string          `json:"model_name"`
    WidthInches        sql.NullFloat64 `json:"width_inches"`
    DepthInches        sql.NullFloat64 `json:"depth_inches"`
    Sqft               sql.NullFloat64 `json:"sqft"`
    SqftRounded        sql.NullInt64   `json:"sqft_rounded"`
    WarehouseSpaceSqft sql.NullFloat64 `json:"warehouse_space_sqft"`
    CreatedAt          sql.NullTime    `json:"created_at"`
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