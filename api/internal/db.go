package internal

import (
    "database/sql"
    "fmt"
    "os"
)

func OpenDB() (*sql.DB, error) {
    host := getenv("DB_HOST", "localhost")
    port := getenv("DB_PORT", "3306")
    name := getenv("DB_NAME", "appdb")
    user := getenv("DB_USER", "appuser")
    pass := getenv("DB_PASS", "changeme_app")

    dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4,utf8",
        user, pass, host, port, name)

    return sql.Open("mysql", dsn)
}

func getenv(k, def string) string {
    if v := os.Getenv(k); v != "" {
        return v
    }
    return def
}