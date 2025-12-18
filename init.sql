-- init.sql
CREATE DATABASE IF NOT EXISTS safe_drive;
USE safe_drive;

-- Table for driver_types
CREATE TABLE driver_types (
    driver_type_id INT AUTO_INCREMENT PRIMARY KEY,
    driver_type VARCHAR(255) NOT NULL
);

-- Table for trucks
CREATE TABLE trucks (
    truck_id INT AUTO_INCREMENT PRIMARY KEY,
    unit_number VARCHAR(255) NOT NULL,
    year INT,
    status ENUM('available', 'maintenance', 'assigned') DEFAULT 'available'
);

-- Table for drivers
CREATE TABLE drivers (
    driver_id INT AUTO_INCREMENT PRIMARY KEY,
    driver_code VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    start_date DATE,
    truck_id INT,
    driver_type_id INT,
    profile_pic TEXT,
    FOREIGN KEY (truck_id) REFERENCES trucks(truck_id) ON DELETE SET NULL,
    FOREIGN KEY (driver_type_id) REFERENCES driver_types(driver_type_id) ON DELETE SET NULL
);

-- Table for safety_categories
CREATE TABLE safety_categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(255) NOT NULL,
    description TEXT,
    scoring_system INT,
    p_i_score INT
);

-- Table for safety_events
CREATE TABLE safety_events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id INT NOT NULL,
    event_date DATE,
    category_id INT,
    notes TEXT,
    bonus_score INT,
    p_i_score INT,
    bonus_period BOOLEAN DEFAULT true,
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES safety_categories(category_id) ON DELETE SET NULL
);

-- Table for scorecard_items
CREATE TABLE scorecard_items (
    sc_category_id INT AUTO_INCREMENT PRIMARY KEY,
    sc_category ENUM('SAFETY', 'MAINTENANCE', 'DISPATCH') NOT NULL,
    sc_description TEXT NOT NULL,
    driver_type_id INT,
    FOREIGN KEY (driver_type_id) REFERENCES driver_types(driver_type_id) ON DELETE SET NULL
);

-- Table for scorecard_events
CREATE TABLE scorecard_events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id INT NOT NULL,
    event_date DATE,
    sc_category_id INT,
    sc_score INT,
    notes TEXT,
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id) ON DELETE CASCADE,
    FOREIGN KEY (sc_category_id) REFERENCES scorecard_items(sc_category_id) ON DELETE CASCADE
);

-- Table for truck_history
CREATE TABLE truck_history (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    truck_id INT NOT NULL,
    date DATE,
    type ENUM('assignment', 'maintenance', 'status_change') NOT NULL,
    description TEXT,
    FOREIGN KEY (truck_id) REFERENCES trucks(truck_id) ON DELETE CASCADE
);

-- Insert initial data
INSERT INTO driver_types (driver_type) VALUES ('Owner Operator'), ('Company Driver');
INSERT INTO safety_categories (code, description, scoring_system, p_i_score) VALUES
('B00001', 'Minor Preventable Accident (<$5000)', 5, 5),
('P00001', 'Major Preventable Accident (>$5000)', 10, 10),
('B00013', 'Speeding 0-10 MPH', 3, 0),
('P00003', 'Passed Level 1 Inspection', -5, -5),
('P00014', 'Passed Spot Check', -1, -1);