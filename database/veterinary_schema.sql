-- VetCare Hospital Management System - Veterinary Schema
-- This file contains the database schema for veterinary-specific tables

-- Pet Categories Table
CREATE TABLE IF NOT EXISTS pet_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    INDEX idx_category_name (category_name),
    INDEX idx_is_active (is_active)
);

-- Pet Breeds Table
CREATE TABLE IF NOT EXISTS pet_breeds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    breed_name VARCHAR(100) NOT NULL,
    category_id INT NOT NULL,
    description TEXT,
    average_weight DECIMAL(5,2),
    average_lifespan INT,
    temperament VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (category_id) REFERENCES pet_categories(id) ON DELETE CASCADE,
    INDEX idx_breed_name (breed_name),
    INDEX idx_category_id (category_id),
    INDEX idx_is_active (is_active)
);

-- Drugs Table
CREATE TABLE IF NOT EXISTS drugs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    drug_name VARCHAR(100) NOT NULL,
    generic_name VARCHAR(100),
    manufacturer VARCHAR(100),
    drug_type ENUM('antibiotic', 'painkiller', 'vaccine', 'supplement', 'other') DEFAULT 'other',
    dosage_form ENUM('tablet', 'injection', 'liquid', 'cream', 'powder', 'other') DEFAULT 'tablet',
    strength VARCHAR(50),
    unit VARCHAR(20),
    description TEXT,
    side_effects TEXT,
    contraindications TEXT,
    storage_conditions VARCHAR(255),
    expiry_date DATE,
    is_prescription_required BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    INDEX idx_drug_name (drug_name),
    INDEX idx_generic_name (generic_name),
    INDEX idx_drug_type (drug_type),
    INDEX idx_is_active (is_active)
);

-- Services Table
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    service_type ENUM('consultation', 'surgery', 'diagnostic', 'grooming', 'boarding', 'emergency', 'other') DEFAULT 'consultation',
    description TEXT,
    duration_minutes INT DEFAULT 30,
    base_price DECIMAL(10,2) NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    requires_appointment BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    INDEX idx_service_name (service_name),
    INDEX idx_service_type (service_type),
    INDEX idx_is_active (is_active)
);

-- Vaccination Types Table
CREATE TABLE IF NOT EXISTS vaccination_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vaccine_name VARCHAR(100) NOT NULL UNIQUE,
    vaccine_type ENUM('core', 'non_core', 'optional') DEFAULT 'core',
    target_species VARCHAR(100),
    age_requirement_months INT,
    frequency_months INT,
    description TEXT,
    side_effects TEXT,
    contraindications TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    INDEX idx_vaccine_name (vaccine_name),
    INDEX idx_vaccine_type (vaccine_type),
    INDEX idx_target_species (target_species),
    INDEX idx_is_active (is_active)
);

-- Vaccinations Table (for tracking actual vaccinations given)
CREATE TABLE IF NOT EXISTS vaccinations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    vaccine_id INT NOT NULL,
    veterinarian_id INT NOT NULL,
    vaccination_date DATE NOT NULL,
    next_due_date DATE,
    batch_number VARCHAR(50),
    manufacturer VARCHAR(100),
    administered_by VARCHAR(100),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (vaccine_id) REFERENCES vaccination_types(id) ON DELETE CASCADE,
    INDEX idx_patient_id (patient_id),
    INDEX idx_vaccine_id (vaccine_id),
    INDEX idx_veterinarian_id (veterinarian_id),
    INDEX idx_vaccination_date (vaccination_date),
    INDEX idx_next_due_date (next_due_date),
    INDEX idx_is_active (is_active)
);

-- Insert dummy data for pet_categories
INSERT INTO pet_categories (category_name, description, created_by) VALUES
('Dogs', 'Canine pets including all dog breeds', 1),
('Cats', 'Feline pets including all cat breeds', 1),
('Birds', 'Avian pets including parrots, canaries, and other birds', 1),
('Fish', 'Aquatic pets including freshwater and saltwater fish', 1),
('Reptiles', 'Reptilian pets including snakes, lizards, and turtles', 1),
('Small Mammals', 'Small mammals including rabbits, hamsters, and guinea pigs', 1),
('Exotic Animals', 'Exotic pets including ferrets, hedgehogs, and other unique animals', 1);

-- Insert dummy data for pet_breeds
INSERT INTO pet_breeds (breed_name, category_id, description, average_weight, average_lifespan, temperament, created_by) VALUES
-- Dog breeds
('Golden Retriever', 1, 'Friendly and intelligent dog breed', 65.0, 12, 'Friendly, Intelligent, Devoted', 1),
('German Shepherd', 1, 'Loyal and protective working dog', 75.0, 11, 'Confident, Courageous, Smart', 1),
('Labrador Retriever', 1, 'Popular family dog known for its friendly nature', 70.0, 12, 'Outgoing, Active, Friendly', 1),
('French Bulldog', 1, 'Small companion dog with distinctive bat ears', 25.0, 12, 'Adaptable, Playful, Smart', 1),
('Beagle', 1, 'Small to medium-sized scent hound', 30.0, 13, 'Friendly, Curious, Merry', 1),

-- Cat breeds
('Persian', 2, 'Long-haired cat breed with a distinctive face', 12.0, 15, 'Quiet, Sweet, Gentle', 1),
('Maine Coon', 2, 'Large domestic cat breed', 15.0, 13, 'Gentle, Friendly, Intelligent', 1),
('Siamese', 2, 'Short-haired cat with distinctive color points', 10.0, 15, 'Active, Vocal, Social', 1),
('British Shorthair', 2, 'Medium to large cat with a dense coat', 12.0, 14, 'Calm, Easy-going, Affectionate', 1),
('Ragdoll', 2, 'Large, laid-back cat breed', 15.0, 13, 'Docile, Affectionate, Gentle', 1),

-- Bird breeds
('Budgerigar', 3, 'Small, long-tailed, seed-eating parrot', 0.03, 8, 'Social, Active, Intelligent', 1),
('Cockatiel', 3, 'Small parrot with distinctive crest', 0.1, 15, 'Gentle, Affectionate, Playful', 1),
('Canary', 3, 'Small songbird known for its beautiful singing', 0.02, 10, 'Active, Vocal, Social', 1);

-- Insert dummy data for drugs
INSERT INTO drugs (drug_name, generic_name, manufacturer, drug_type, dosage_form, strength, unit, description, side_effects, contraindications, storage_conditions, is_prescription_required, created_by) VALUES
('Amoxicillin', 'Amoxicillin', 'VetPharm Inc.', 'antibiotic', 'tablet', '250', 'mg', 'Broad-spectrum antibiotic for bacterial infections', 'Nausea, diarrhea, allergic reactions', 'Known penicillin allergy', 'Store at room temperature', TRUE, 1),
('Ibuprofen', 'Ibuprofen', 'PetMed Solutions', 'painkiller', 'tablet', '100', 'mg', 'Anti-inflammatory pain reliever', 'Stomach upset, kidney issues', 'Kidney disease, stomach ulcers', 'Store in cool, dry place', TRUE, 1),
('Rabies Vaccine', 'Rabies Vaccine', 'VetVaccines Ltd.', 'vaccine', 'injection', '1', 'ml', 'Core vaccine for rabies prevention', 'Mild fever, lethargy', 'Severe illness', 'Refrigerate at 2-8°C', TRUE, 1),
('Multivitamin', 'Vitamin Complex', 'PetSupplements Co.', 'supplement', 'liquid', '50', 'ml', 'Daily vitamin supplement for pets', 'Rare allergic reactions', 'None known', 'Store at room temperature', FALSE, 1),
('Flea Treatment', 'Fipronil', 'FleaFree Corp.', 'other', 'liquid', '5', 'ml', 'Topical flea and tick prevention', 'Skin irritation', 'Pregnant or nursing animals', 'Store below 30°C', TRUE, 1);

-- Insert dummy data for services
INSERT INTO services (service_name, service_type, description, duration_minutes, base_price, is_recurring, requires_appointment, created_by) VALUES
('General Consultation', 'consultation', 'Routine health check-up and consultation', 30, 75.00, FALSE, TRUE, 1),
('Vaccination', 'consultation', 'Core and non-core vaccination services', 15, 45.00, FALSE, TRUE, 1),
('Spay/Neuter Surgery', 'surgery', 'Routine spay and neuter procedures', 120, 250.00, FALSE, TRUE, 1),
('Dental Cleaning', 'surgery', 'Professional dental cleaning under anesthesia', 90, 180.00, FALSE, TRUE, 1),
('Blood Test', 'diagnostic', 'Complete blood count and biochemistry panel', 20, 85.00, FALSE, TRUE, 1),
('X-Ray', 'diagnostic', 'Radiographic imaging services', 30, 120.00, FALSE, TRUE, 1),
('Grooming', 'grooming', 'Full grooming service including bath and trim', 60, 65.00, FALSE, TRUE, 1),
('Boarding', 'boarding', 'Overnight pet boarding with care', 1440, 35.00, TRUE, TRUE, 1),
('Emergency Visit', 'emergency', 'After-hours emergency consultation', 45, 150.00, FALSE, FALSE, 1),
('Microchipping', 'consultation', 'Pet identification microchip implantation', 15, 55.00, FALSE, TRUE, 1);

-- Insert dummy data for vaccination_types
INSERT INTO vaccination_types (vaccine_name, vaccine_type, target_species, age_requirement_months, frequency_months, description, side_effects, contraindications, created_by) VALUES
('Rabies', 'core', 'Dogs, Cats', 3, 12, 'Core vaccine for rabies prevention', 'Mild fever, lethargy', 'Severe illness', 1),
('DHPP', 'core', 'Dogs', 6, 12, 'Core vaccine for distemper, hepatitis, parainfluenza, and parvovirus', 'Mild fever, soreness', 'Severe illness', 1),
('FVRCP', 'core', 'Cats', 6, 12, 'Core vaccine for feline viral rhinotracheitis, calicivirus, and panleukopenia', 'Mild fever, lethargy', 'Severe illness', 1),
('Bordetella', 'non_core', 'Dogs', 8, 12, 'Kennel cough prevention vaccine', 'Mild respiratory symptoms', 'Severe illness', 1),
('Lyme Disease', 'non_core', 'Dogs', 12, 12, 'Lyme disease prevention vaccine', 'Mild fever, soreness', 'Severe illness', 1),
('Feline Leukemia', 'non_core', 'Cats', 8, 12, 'Feline leukemia virus prevention', 'Mild fever, lethargy', 'Severe illness', 1),
('Canine Influenza', 'optional', 'Dogs', 12, 12, 'Canine influenza prevention vaccine', 'Mild respiratory symptoms', 'Severe illness', 1);

-- Insert dummy data for vaccinations (sample vaccination records)
INSERT INTO vaccinations (patient_id, vaccine_id, veterinarian_id, vaccination_date, next_due_date, batch_number, manufacturer, administered_by, notes, created_by) VALUES
(1, 1, 1, '2024-01-15', '2025-01-15', 'RB2024-001', 'VetVaccines Ltd.', 'Dr. Smith', 'Annual rabies vaccination', 1),
(1, 2, 1, '2024-01-15', '2025-01-15', 'DHPP2024-001', 'VetVaccines Ltd.', 'Dr. Smith', 'Annual DHPP vaccination', 1),
(2, 1, 1, '2024-02-10', '2025-02-10', 'RB2024-002', 'VetVaccines Ltd.', 'Dr. Johnson', 'Annual rabies vaccination', 1),
(2, 3, 1, '2024-02-10', '2025-02-10', 'FVRCP2024-001', 'VetVaccines Ltd.', 'Dr. Johnson', 'Annual FVRCP vaccination', 1),
(3, 1, 1, '2024-03-05', '2025-03-05', 'RB2024-003', 'VetVaccines Ltd.', 'Dr. Smith', 'Annual rabies vaccination', 1);
