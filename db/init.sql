-- Safety first
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE;
SET SQL_MODE='STRICT_ALL_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- Create database (optional)
CREATE DATABASE IF NOT EXISTS casedb
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;
USE casedb;

-- ----------------------------------------------------------------------
-- DROP existing normalized objects to allow re-run (idempotent-ish)
-- ----------------------------------------------------------------------
DROP TABLE IF EXISTS job_inventory;
DROP TABLE IF EXISTS job_cost_estimates;
DROP TABLE IF EXISTS quotes;
DROP TABLE IF EXISTS comp_stores;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS case_models;
DROP TABLE IF EXISTS addresses;

-- ----------------------------------------------------------------------
-- NORMALIZED TABLES
-- ----------------------------------------------------------------------

/* Addresses are shared by Companies and Stores */
CREATE TABLE addresses (
    address_id  INT UNSIGNED NOT NULL AUTO_INCREMENT,
    street      VARCHAR(255) NOT NULL,
    city        VARCHAR(128) NOT NULL,
    province    VARCHAR(64)  NOT NULL,
    postal_code VARCHAR(16)  NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (address_id),
    -- Ensures de-duplication on normalized components
    UNIQUE KEY uq_address_components (street, city, province, postal_code)
) ENGINE=InnoDB;

CREATE TABLE companies (
    company_id   INT UNSIGNED NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    address_id   INT UNSIGNED NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_id),
    KEY ix_companies_address (address_id),
    CONSTRAINT fk_companies_address
      FOREIGN KEY (address_id) REFERENCES addresses(address_id)
      ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

/* Stores (locations) belong to a company and can have their own address */
CREATE TABLE comp_stores (
    store_id   INT UNSIGNED NOT NULL,
    company_id INT UNSIGNED NOT NULL,
    store_name VARCHAR(255) NOT NULL,
    address_id INT UNSIGNED,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (store_id),
    KEY ix_stores_company (company_id),
    KEY ix_stores_address (address_id),
    CONSTRAINT fk_stores_company
      FOREIGN KEY (company_id) REFERENCES companies(company_id)
      ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_stores_address
      FOREIGN KEY (address_id) REFERENCES addresses(address_id)
      ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

/* Case models: store physical dimensions; square footage is generated */
CREATE TABLE case_models (
    case_model_id         INT UNSIGNED NOT NULL,
    model_name            VARCHAR(255) NOT NULL,
    width_inches          DECIMAL(10,2) NOT NULL,
    depth_inches          DECIMAL(10,2) NOT NULL,
    warehouse_space_sqft  DECIMAL(10,2) NOT NULL,
    sqft                  DECIMAL(12,4)
        AS ((width_inches * depth_inches) / 144.0) VIRTUAL,
    sqft_rounded          INT
        AS (ROUND((width_inches * depth_inches) / 144.0, 0)) VIRTUAL,
    created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (case_model_id),
    UNIQUE KEY uq_case_model_name (model_name),
    KEY ix_case_models_sqft (sqft_rounded)
) ENGINE=InnoDB;

/* Quotes reference stores; business columns preserved */
CREATE TABLE quotes (
    quote_id       INT UNSIGNED NOT NULL,
    store_id       INT UNSIGNED NOT NULL,
    quote_num      VARCHAR(255) NULL,
    quote_date     DATE NULL,
    quote_expiry   DATE NULL,
    sap_vendor     BIGINT NULL,
    purchase_order BIGINT NULL,
    prepared_by    VARCHAR(255) NULL,
    sales_rep      VARCHAR(255) NULL,
    store_job_pm   VARCHAR(255) NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (quote_id),
    KEY ix_quotes_store (store_id),
    KEY ix_quotes_quote_num (quote_num),
    CONSTRAINT fk_quotes_store
      FOREIGN KEY (store_id) REFERENCES comp_stores(store_id)
      ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

/* Job cost estimate belongs to a quote and store */
CREATE TABLE job_cost_estimates (
    job_id           INT UNSIGNED NOT NULL,
    quote_id         INT UNSIGNED NOT NULL,
    store_id         INT UNSIGNED NOT NULL,
    ship_origin      VARCHAR(255) NULL,
    ship_destination VARCHAR(255) NULL,
    equipment        VARCHAR(255) NULL,
    num_of_loads     INT NULL,
    linehaul         DECIMAL(12,2) NULL,
    fuel_pct         DECIMAL(5,2) NULL,
    accessorials     DECIMAL(12,2) NULL,
    intra_canada     TINYINT(1) NULL,
    extended_price   DECIMAL(12,2) NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (job_id),
    KEY ix_jobs_quote (quote_id),
    KEY ix_jobs_store (store_id),
    CONSTRAINT fk_jobs_quote
      FOREIGN KEY (quote_id) REFERENCES quotes(quote_id)
      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_jobs_store
      FOREIGN KEY (store_id) REFERENCES comp_stores(store_id)
      ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

/* Inventory lines belong to a job; link to case model to avoid duplicates */
CREATE TABLE job_inventory (
    job_inventory_id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
    quote_id               INT NOT NULL,
    job_id                 INT UNSIGNED NOT NULL,
    store_id               INT UNSIGNED NOT NULL,
    shipping_order_id      VARCHAR(255) NULL,
    line_up_id             VARCHAR(255) NULL,
    case_model_id          INT UNSIGNED NULL,
    case_serial_num        VARCHAR(255) NULL,
    department             VARCHAR(255) NULL,
    estimated_ship_date    DATE NULL,
    warehouse_arrival_date DATE NULL,
    storage_start_date     DATE NULL,
    storage_end_date       DATE NULL,
    scheduled_date         DATE NULL,
    scheduled_time         VARCHAR(64) NULL,
    warehouse_location     VARCHAR(255) NULL,
    trailer_or_warehouse   VARCHAR(255) NULL,
    original_order_id      VARCHAR(255) NULL,
    original_trailer_id    VARCHAR(255) NULL,
    touched_not_touched    VARCHAR(255) NULL,
    damage                 TINYINT(1) NULL,
    stripped_date          VARCHAR(255) NULL,
    delivery_order_id      VARCHAR(255) NULL,
    delivery_trailer_id    VARCHAR(255) NULL,
    storage_charge         DECIMAL(12,2) NULL,
    original_store_tag     VARCHAR(255) NULL,
    lh_gable               TINYINT(1) NULL,
    rh_gable               TINYINT(1) NULL,
    no_gable               TINYINT(1) NULL,
    created_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (job_inventory_id),
    KEY ix_inv_job (job_id),
    KEY ix_inv_store (store_id),
    KEY ix_inv_case_serial (case_serial_num),
    KEY ix_inv_delivery (delivery_order_id),
    KEY ix_inv_shipping (original_order_id),
    CONSTRAINT fk_inv_job
      FOREIGN KEY (job_id) REFERENCES job_cost_estimates(job_id)
      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_inv_store
      FOREIGN KEY (store_id) REFERENCES comp_stores(store_id)
      ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_inv_case_model
      FOREIGN KEY (case_model_id) REFERENCES case_models(case_model_id)
      ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_gable_boolean_values
      CHECK (
        (lh_gable IN (0,1) OR lh_gable IS NULL) AND
        (rh_gable IN (0,1) OR rh_gable IS NULL) AND
        (no_gable IN (0,1)  OR no_gable  IS NULL)
      ),
    CONSTRAINT chk_gable_exactly_one
      CHECK (
        COALESCE(lh_gable,0) + COALESCE(rh_gable,0) + COALESCE(no_gable,0) = 1
      )
) ENGINE=InnoDB;

-- ======================================================================
-- STAGING TABLES (match Access export columns)
-- Load your CSVs into these via LOAD DATA INFILE or external tooling.
-- ======================================================================

-- Drop staging to re-run easily
DROP TABLE IF EXISTS stg_companies;
DROP TABLE IF EXISTS stg_compstores;
DROP TABLE IF EXISTS stg_casemodels;
DROP TABLE IF EXISTS stg_quote;
DROP TABLE IF EXISTS stg_jobcostestimate;
DROP TABLE IF EXISTS stg_jobinventory;

-- Basic staging reflecting Access columns
CREATE TABLE stg_companies (
    ID INT UNSIGNED PRIMARY KEY,
    Company VARCHAR(255),
    CompAddress VARCHAR(255),
    CompCity VARCHAR(255),
    CompProv VARCHAR(255),
    CompPostalCode VARCHAR(32)
) ENGINE=InnoDB;

CREATE TABLE stg_compstores (
    ID INT UNSIGNED PRIMARY KEY,
    CompID INT UNSIGNED,
    Store VARCHAR(255),
    StoreAddress VARCHAR(255),
    StoreCity VARCHAR(255),
    StoreProv VARCHAR(255),
    StorePostalCode VARCHAR(32)
) ENGINE=InnoDB;

CREATE TABLE stg_casemodels (
    ID INT UNSIGNED PRIMARY KEY,
    `Case Model` VARCHAR(255),
    `Width (inches)` DECIMAL(10,2),
    `Depth (inches)` DECIMAL(10,2),
    `Bolea Square Footage` VARCHAR(255),
    `Square Footage with Space in Warehouse` DECIMAL(10,2),
    `Case Size` VARCHAR(50),
    `AltDescription` VARCHAR(255),
    `Square Footage` DECIMAL(10,2),
    `Rounded Square Footage` DECIMAL(10,2)
) ENGINE=InnoDB;


CREATE TABLE stg_quote (
    ID INT UNSIGNED PRIMARY KEY,
    QuoteNum VARCHAR(255) NULL,
    QuoteDate DATE,
    QuoteExpiry DATE,
    SAPVendor BIGINT,
    PurchaseOrder BIGINT NULL,
    CompStoreID INT,
    PreparedBy VARCHAR(255),
    SalesRep VARCHAR(255),
    StoreJobPM VARCHAR(255)
) ENGINE=InnoDB;

CREATE TABLE stg_jobcostestimate (
    ID INT UNSIGNED PRIMARY KEY,
    QuoteID INT,
    CompStoreID INT,
    ShipOrigin VARCHAR(255) NULL,
    ShipDestination VARCHAR(255) NULL,
    Equipment VARCHAR(255) NULL,
    NumOfLoads INT NULL,
    LineHaul DECIMAL(12,2) NULL,
    Fuel DECIMAL(6,3) NULL,            -- as decimal percent (e.g., 0.125 or 12.5) - we’ll normalize
    Accessorials DECIMAL(12,2) NULL,
    IntraCanada TINYINT(1) NULL,
    ExtendedPrice DECIMAL(12,2) NULL
) ENGINE=InnoDB;

CREATE TABLE stg_jobinventory (
    ID INT UNSIGNED PRIMARY KEY,
    QuoteID INT NULL,
    JobID INT NULL,
    Store VARCHAR(255) NULL,
    ShippingOrderID VARCHAR(255) NULL,
    LineUpID VARCHAR(255) NULL,
    CaseID VARCHAR(255) NULL,
    CaseModel VARCHAR(255) NULL,
    CaseSerialNum VARCHAR(255) NULL,
    Department VARCHAR(255) NULL,
    EstimatedShipDate DATE NULL,
    WarehouseArrivalDate DATE NULL,
    StorageStartDate DATE NULL,
    StorageEndDate DATE NULL,
    ScheduledDate DATE NULL,
    ScheduledTime VARCHAR(64) NULL,
    WarehouseLocation VARCHAR(255) NULL,
    TrailerOrWarehouse VARCHAR(255) NULL,
    OriginalOrderID VARCHAR(255) NULL,
    OriginalTrailerID VARCHAR(255) NULL,
    TouchedNotTouched VARCHAR(255) NULL,
    Damage TINYINT(1) NULL,
    StrippedDate VARCHAR(255) NULL,
    DeliveryOrderID VARCHAR(255) NULL,
    DeliveryTrailerID VARCHAR(255) NULL,
    DaysInStorage INT NULL,
    SquareFootageofCase INT NULL,
    StorageCharge DECIMAL(12,2) NULL,
    ExtendedPrice DECIMAL(12,2) NULL,
    OriginalStoreTag VARCHAR(255) NULL,
    LHGable TINYINT(1) NULL,
    RHGable TINYINT(1) NULL,
    NoGable TINYINT(1) NULL,
    CompStoreID INT NULL
) ENGINE=InnoDB;

-- ======================================================================
-- LOAD DATA INTO STAGING (adjust file paths and formats as needed)
-- Example commands; comment out if loading with external ETL/tooling.
-- ======================================================================

LOAD DATA INFILE '/import/JODB-tbl_Companies.csv'
INTO TABLE stg_companies
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(ID, Company, CompAddress, CompCity, CompProv, CompPostalCode);

LOAD DATA INFILE '/import/JODB-tbl_CompStores.csv'
INTO TABLE stg_compstores
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(ID, CompID, Store, StoreAddress, StoreCity, StoreProv, StorePostalCode);

LOAD DATA INFILE '/import/JODB-tbl_CaseModels.csv'
INTO TABLE stg_casemodels
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(ID, `Case Model`, `Width (inches)`, `Depth (inches)`,
 `Bolea Square Footage`, @sfww,
 `Case Size`, `AltDescription`, `Square Footage`, `Rounded Square Footage`)
SET `Square Footage with Space in Warehouse` = NULLIF(@sfww, '');

LOAD DATA INFILE '/import/JODB-tbl_Quote.csv'
INTO TABLE stg_quote
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(ID, QuoteNum, @var_quote_date, @var_quote_expiry, SAPVendor, PurchaseOrder,
 CompStoreID, PreparedBy, SalesRep, StoreJobPM)
SET QuoteDate = STR_TO_DATE(@var_quote_date, '%m/%d/%Y %H:%i'),
    QuoteExpiry = STR_TO_DATE(@var_quote_expiry, '%m/%d/%Y %H:%i');
    PurchaseOrder = NULLIF(@var_purchase_order, '');

LOAD DATA INFILE '/import/JODB-tbl_JobCostEstimate.csv'
INTO TABLE stg_jobcostestimate
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(ID, QuoteID, CompStoreID, ShipOrigin, ShipDestination, Equipment,
 NumOfLoads, LineHaul, Fuel, Accessorials, IntraCanada, ExtendedPrice);

LOAD DATA INFILE '/import/JODB-tbl_JobInventory.csv'
INTO TABLE stg_jobinventory
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(ID, QuoteID, JobID, Store, ShippingOrderID, LineUpID, CaseID, CaseModel,
 CaseSerialNum, Department, EstimatedShipDate, WarehouseArrivalDate,
 StorageStartDate, StorageEndDate, ScheduledDate, ScheduledTime,
 WarehouseLocation, TrailerOrWarehouse, OriginalOrderID, OriginalTrailerID,
 TouchedNotTouched, Damage, StrippedDate, DeliveryOrderID, DeliveryTrailerID,
 DaysInStorage, SquareFootageofCase, StorageCharge, ExtendedPrice,
 OriginalStoreTag, LHGable, RHGable, NoGable, CompStoreID);

-- ======================================================================
-- MIGRATION: STAGING -> NORMALIZED
-- ======================================================================

/* 1) Addresses from Companies */
INSERT INTO addresses (street, city, province, postal_code)
SELECT DISTINCT
    TRIM(COALESCE(CompAddress,'')) AS street,
    TRIM(COALESCE(CompCity,''))    AS city,
    TRIM(COALESCE(CompProv,''))    AS province,
    UPPER(REPLACE(TRIM(COALESCE(CompPostalCode,'')), ' ', '')) AS postal_code
FROM stg_companies
WHERE COALESCE(CompAddress,'') <> ''
  AND COALESCE(CompCity,'') <> ''
  AND COALESCE(CompProv,'') <> ''
  AND COALESCE(CompPostalCode,'') <> ''
ON DUPLICATE KEY UPDATE street=VALUES(street);

/* 2) Addresses from Stores */
INSERT INTO addresses (street, city, province, postal_code)
SELECT DISTINCT
    TRIM(COALESCE(StoreAddress,'')),
    TRIM(COALESCE(StoreCity,'')),
    TRIM(COALESCE(StoreProv,'')),
    UPPER(REPLACE(TRIM(COALESCE(StorePostalCode,'')), ' ', ''))
FROM stg_compstores
WHERE COALESCE(StoreAddress,'') <> ''
  AND COALESCE(StoreCity,'') <> ''
  AND COALESCE(StoreProv,'') <> ''
  AND COALESCE(StorePostalCode,'') <> ''
ON DUPLICATE KEY UPDATE street=VALUES(street);

/* 3) Companies (preserve IDs) */
INSERT INTO companies (company_id, company_name, address_id)
SELECT
    s.ID AS company_id,
    TRIM(COALESCE(s.Company,'')) AS company_name,
    a.address_id
FROM stg_companies s
LEFT JOIN addresses a
  ON a.street      = TRIM(COALESCE(s.CompAddress,''))
 AND a.city        = TRIM(COALESCE(s.CompCity,''))
 AND a.province    = TRIM(COALESCE(s.CompProv,''))
 AND a.postal_code = UPPER(REPLACE(TRIM(COALESCE(s.CompPostalCode,'')), ' ', ''));

/* 4) Stores (preserve IDs; map to companies + address) */
INSERT INTO comp_stores (store_id, company_id, store_name, address_id)
SELECT
    st.ID AS store_id,
    st.CompID AS company_id,
    TRIM(COALESCE(st.Store,'')) AS store_name,
    a.address_id
FROM stg_compstores st
LEFT JOIN addresses a
  ON a.street      = TRIM(COALESCE(st.StoreAddress,''))
 AND a.city        = TRIM(COALESCE(st.StoreCity,''))
 AND a.province    = TRIM(COALESCE(st.StoreProv,''))
 AND a.postal_code = UPPER(REPLACE(TRIM(COALESCE(st.StorePostalCode,'')), ' ', ''));

/* 5) Case Models (preserve IDs) */
INSERT INTO case_models (case_model_id, model_name, width_inches, depth_inches, warehouse_space_sqft)
SELECT
    ID,
    TRIM(COALESCE(`Case Model`,'')) AS model_name,
    COALESCE(`Width (inches)`,0),
    COALESCE(`Depth (inches)`,0),
    `Square Footage with Space in Warehouse`
FROM stg_casemodels;

/* 6) Quotes (preserve IDs; store_id from CompStoreID) */
INSERT INTO quotes (quote_id, store_id, quote_num, quote_date, quote_expiry,
                    sap_vendor, purchase_order, prepared_by, sales_rep, store_job_pm)
SELECT
    ID, COALESCE(CompStoreID, 0),
    TRIM(QuoteNum), QuoteDate, QuoteExpiry,
    SAPVendor, PurchaseOrder, TRIM(PreparedBy), TRIM(SalesRep), TRIM(StoreJobPM)
FROM stg_quote;

/* 7) Job Cost Estimates (preserve IDs; normalize fuel to percent 0-100 if needed) */
-- If stg_jobcostestimate.Fuel is 0.15 or 15 depending on source; choose one rule.
-- Below we assume values like 0.15 (i.e., 15%) → multiply by 100 to store 15.00
INSERT INTO job_cost_estimates (
    job_id, quote_id, store_id, ship_origin, ship_destination, equipment,
    num_of_loads, linehaul, fuel_pct, accessorials, intra_canada, extended_price
)
SELECT
    ID, QuoteID, COALESCE(CompStoreID, 0),
    TRIM(ShipOrigin), TRIM(ShipDestination), TRIM(Equipment),
    NumOfLoads, LineHaul,
    CASE
      WHEN Fuel IS NULL THEN NULL
      WHEN Fuel <= 1 THEN ROUND(Fuel*100,2)  -- treat 0.15 as 15%
      ELSE ROUND(Fuel,2)
    END AS fuel_pct,
    Accessorials, IntraCanada, ExtendedPrice
FROM stg_jobcostestimate;

/* 8) Job Inventory (new surrogate key; link to job + store; resolve case_model_id by name) */
INSERT INTO job_inventory (
    quote_id, job_id, store_id, shipping_order_id, line_up_id, case_model_id, 
    case_serial_num, department, estimated_ship_date, warehouse_arrival_date,
    storage_start_date, storage_end_date, scheduled_date, scheduled_time, 
    warehouse_location, trailer_or_warehouse, original_order_id, original_trailer_id,
    touched_not_touched, damage, stripped_date, delivery_order_id, delivery_trailer_id,
    storage_charge, original_store_tag, lh_gable, rh_gable, no_gable
)
SELECT
    s.JobID,
    j.store_id,                         -- derive store from job for consistency
    cm.case_model_id,
    TRIM(s.CaseSerialNum),
    TRIM(s.Department),
    s.EstimatedShipDate,
    s.WarehouseArrivalDate,
    s.StorageStartDate,
    s.StorageEndDate,
    s.ScheduledDate,
    s.ScheduledTime,
    TRIM(s.WarehouseLocation),
    TRIM(s.TrailerOrWarehouse),
    TRIM(s.OriginalOrderID),
    TRIM(s.OriginalTrailerID),
    TRIM(s.TouchedNotTouched),
    s.Damage,
    TRIM(s.StrippedDate),
    TRIM(s.DeliveryOrderID),
    TRIM(s.DeliveryTrailerID),
    s.StorageCharge,
    TRIM(s.OriginalStoreTag),
    s.LHGable,
    s.RHGable,
    s.NoGable
FROM stg_jobinventory s
JOIN job_cost_estimates j
  ON j.job_id = s.JobID
LEFT JOIN case_models cm
  ON cm.model_name = TRIM(COALESCE(s.CaseModel,''));   -- resolve by model name

-- ======================================================================
-- SANITY CHECKS (row counts)
-- ======================================================================
SELECT 'companies' AS table_name, COUNT(*) AS rows FROM companies
UNION ALL
SELECT 'comp_stores', COUNT(*) FROM comp_stores
UNION ALL
SELECT 'case_models', COUNT(*) FROM case_models
UNION ALL
SELECT 'quotes', COUNT(*) FROM quotes
UNION ALL
SELECT 'job_cost_estimates', COUNT(*) FROM job_cost_estimates
UNION ALL
SELECT 'job_inventory', COUNT(*) FROM job_inventory;

-- Example: how many inventory rows could NOT resolve a case model?
SELECT COUNT(*) AS inv_rows_without_case_model
FROM job_inventory ji
LEFT JOIN case_models cm ON cm.case_model_id = ji.case_model_id
WHERE ji.case_model_id IS NULL
  AND EXISTS (SELECT 1 FROM stg_jobinventory s WHERE s.JobID = ji.job_id AND TRIM(COALESCE(s.CaseModel,'')) <> '');

-- ======================================================================
-- CLEANUP & FINALIZE
-- ======================================================================
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
SET SQL_MODE=@OLD_SQL_MODE;

DROP TABLE IF EXISTS stg_companies;
DROP TABLE IF EXISTS stg_compstores;
DROP TABLE IF EXISTS stg_casemodels;
DROP TABLE IF EXISTS stg_quote;
DROP TABLE IF EXISTS stg_jobcostestimate;
DROP TABLE IF EXISTS stg_jobinventory;
