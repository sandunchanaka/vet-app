-- Billing System Tables

-- Bills Table
CREATE TABLE IF NOT EXISTS bills (
    bill_id INT AUTO_INCREMENT PRIMARY KEY,
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    pet_id INT NOT NULL,
    veterinarian_id INT,
    owner_id INT NOT NULL,
    billing_date DATE NOT NULL,
    next_treatment_date DATE,
    history_complaint TEXT,
    clinical_observation TEXT,
    treatment_remarks TEXT,
    net_total DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    grand_total DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('draft', 'pending', 'paid', 'cancelled') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(pet_id),
    FOREIGN KEY (veterinarian_id) REFERENCES veterinarians(vet_id),
    FOREIGN KEY (owner_id) REFERENCES pet_owners(owner_id)
);

-- Bill Services Table (services provided)
CREATE TABLE IF NOT EXISTS bill_services (
    service_id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES bills(bill_id) ON DELETE CASCADE
);

-- Bill Prescriptions Table
CREATE TABLE IF NOT EXISTS bill_prescriptions (
    prescription_id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    drug_name VARCHAR(100) NOT NULL,
    dose VARCHAR(50),
    dosage VARCHAR(50),
    duration VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES bills(bill_id) ON DELETE CASCADE
);

-- Bill Vaccinations Table
CREATE TABLE IF NOT EXISTS bill_vaccinations (
    vaccination_id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    vaccine_id INT,
    vaccine_name VARCHAR(100) NOT NULL,
    next_vaccination_date DATE,
    duration_slots VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES bills(bill_id) ON DELETE CASCADE,
    FOREIGN KEY (vaccine_id) REFERENCES vaccination_types(id) ON DELETE SET NULL
);

-- Indexes for better performance
CREATE INDEX idx_bills_pet_id ON bills(pet_id);
CREATE INDEX idx_bills_veterinarian_id ON bills(veterinarian_id);
CREATE INDEX idx_bills_owner_id ON bills(owner_id);
CREATE INDEX idx_bills_billing_date ON bills(billing_date);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bill_services_bill_id ON bill_services(bill_id);
CREATE INDEX idx_bill_prescriptions_bill_id ON bill_prescriptions(bill_id);
CREATE INDEX idx_bill_vaccinations_bill_id ON bill_vaccinations(bill_id);
CREATE INDEX idx_bill_vaccinations_vaccine_id ON bill_vaccinations(vaccine_id);
