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