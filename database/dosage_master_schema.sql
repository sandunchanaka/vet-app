-- Dosage Master Tables Schema

-- Dosage Types Table (frequency and timing instructions)
CREATE TABLE IF NOT EXISTS dosage_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    abbreviation VARCHAR(20),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Doses Table (specific dosage amounts and units)
CREATE TABLE IF NOT EXISTS doses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    dosage_type VARCHAR(50) NOT NULL, -- ml, tablet, capsule, mg, gram, etc.
    ml_equivalent DECIMAL(10,3), -- for liquid doses
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Duration Types Table (treatment duration categories)
CREATE TABLE IF NOT EXISTS duration_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Duration Weeks Table (specific duration periods)
CREATE TABLE IF NOT EXISTS duration_weeks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    weeks INT,
    days INT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_dosage_types_name ON dosage_types(name);
CREATE INDEX idx_dosage_types_active ON dosage_types(is_active);
CREATE INDEX idx_doses_name ON doses(name);
CREATE INDEX idx_doses_type ON doses(dosage_type);
CREATE INDEX idx_doses_active ON doses(is_active);
CREATE INDEX idx_duration_types_name ON duration_types(name);
CREATE INDEX idx_duration_types_active ON duration_types(is_active);
CREATE INDEX idx_duration_weeks_name ON duration_weeks(name);
CREATE INDEX idx_duration_weeks_active ON duration_weeks(is_active);

-- Insert Dosage Types Data (frequency and timing instructions)
INSERT INTO dosage_types (name, abbreviation, description) VALUES
('Once daily', 'qd', 'Take medication once every day'),
('Twice daily', 'bid', 'Take medication twice every day'),
('Three times daily', 'tid', 'Take medication three times every day'),
('Four times daily', 'qid', 'Take medication four times every day'),
('Every 6 hours', 'q6h', 'Take medication every 6 hours'),
('Every 8 hours', 'q8h', 'Take medication every 8 hours'),
('Every 12 hours', 'q12h', 'Take medication every 12 hours'),
('As needed', 'prn', 'Take medication only when necessary'),
('Before meals', 'ac', 'Take medication before eating'),
('After meals', 'pc', 'Take medication after eating');

-- Insert Doses Data (specific amounts and units)
INSERT INTO doses (name, dosage_type, ml_equivalent) VALUES
-- Liquid Volume Doses
('1 teaspoon', 'ml', 5.000),
('1 tablespoon', 'ml', 15.000),
('1/4 teaspoon', 'ml', 1.250),
('1/2 teaspoon', 'ml', 2.500),
('3/4 teaspoon', 'ml', 3.750),
('1/2 tablespoon', 'ml', 7.500),
('1/4 tablespoon', 'ml', 3.750),
('1 drop', 'ml', 0.050),
('2 drops', 'ml', 0.100),
('5 drops', 'ml', 0.250),
-- Solid Form Doses
('1/4 tablet', 'tablet', NULL),
('1/2 tablet', 'tablet', NULL),
('3/4 tablet', 'tablet', NULL),
('1 tablet', 'tablet', NULL),
('1.5 tablets', 'tablet', NULL),
('2 tablets', 'tablet', NULL),
('1 capsule', 'capsule', NULL),
('2 capsules', 'capsule', NULL),
('1 chewable', 'chewable', NULL),
('2 chewables', 'chewable', NULL),
-- Weight-Based Doses
('1 gram', 'gram', NULL),
('500 mg', 'mg', NULL),
('250 mg', 'mg', NULL),
('100 mg', 'mg', NULL),
('50 mg', 'mg', NULL);

-- Insert Duration Types Data (treatment duration categories)
INSERT INTO duration_types (name, description) VALUES
('1 day', 'Single day treatment'),
('3 days', 'Three day treatment course'),
('5 days', 'Five day treatment course'),
('7 days', 'One week treatment course'),
('10 days', 'Ten day treatment course'),
('14 days', 'Two week treatment course'),
('21 days', 'Three week treatment course'),
('28 days', 'Four week treatment course'),
('1 month', 'One month treatment course'),
('Until symptoms subside', 'Continue until symptoms improve'),
('Until the course is finished', 'Complete the full prescribed course'),
('As needed', 'Take only when symptoms occur'),
('Long-term/Chronic use', 'Ongoing treatment for chronic conditions'),
('Every other day', 'Alternate day treatment'),
('Twice a week', 'Two times per week treatment'),
('Weekly', 'Once per week treatment');

-- Insert Duration Weeks Data (specific duration periods)
INSERT INTO duration_weeks (name, weeks, days, description) VALUES
('1W', 1, 7, 'One week duration'),
('2W', 2, 14, 'Two weeks duration'),
('3W', 3, 21, 'Three weeks duration'),
('4W', 4, 28, 'Four weeks duration'),
('1Y', 52, 365, 'One year duration');
