CREATE DATABASE drive_safe;
USE drive_safe;

-- 1. Truck Related Tables
CREATE TABLE trucks (
    truck_id INT AUTO_INCREMENT PRIMARY KEY,
    unit_number VARCHAR(50) NOT NULL,
    year INT,
    status ENUM('available', 'maintenance', 'assigned') DEFAULT 'available'
);

CREATE TABLE truck_history (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    truck_id INT,
    event_date DATE,
    type ENUM('assignment', 'maintenance', 'status_change'),
    description TEXT,
    FOREIGN KEY (truck_id) REFERENCES trucks(truck_id) ON DELETE CASCADE
);

-- 2. Driver Related Tables
CREATE TABLE driver_types (
    driver_type_id INT AUTO_INCREMENT PRIMARY KEY,
    driver_type VARCHAR(100) NOT NULL
);

CREATE TABLE drivers (
    driver_id INT AUTO_INCREMENT PRIMARY KEY,
    driver_code VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    start_date DATE,
    truck_id INT NULL,
    driver_type_id INT NULL,
    profile_pic LONGTEXT, -- Stores Base64 string from DriverSetup.tsx
    FOREIGN KEY (truck_id) REFERENCES trucks(truck_id) ON DELETE SET NULL,
    FOREIGN KEY (driver_type_id) REFERENCES driver_types(driver_type_id)
);

-- 3. Safety & Performance Tables
CREATE TABLE safety_categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    description TEXT,
    scoring_system INT,
    p_i_score DECIMAL(5,2)
);

CREATE TABLE safety_events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id INT,
    event_date DATETIME,
    category_id INT,
    notes TEXT,
    bonus_score INT,
    p_i_score DECIMAL(5,2),
    bonus_period BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES safety_categories(category_id)
);

CREATE TABLE scorecard_metrics (
    sc_category_id INT AUTO_INCREMENT PRIMARY KEY,
    sc_category ENUM('SAFETY', 'MAINTENANCE', 'DISPATCH'),
    sc_description TEXT,
    driver_type_id INT NULL,
    FOREIGN KEY (driver_type_id) REFERENCES driver_types(driver_type_id)
);

CREATE TABLE scorecard_events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id INT,
    sc_category_id INT,
    event_date VARCHAR(7), -- Format: YYYY-MM
    grade INT,
    notes TEXT,
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id),
    FOREIGN KEY (sc_category_id) REFERENCES scorecard_metrics(sc_category_id)
);