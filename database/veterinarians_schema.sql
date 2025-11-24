-- Veterinarians Table
CREATE TABLE IF NOT EXISTS veterinarians (
    vet_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    license_number VARCHAR(50) UNIQUE,
    specialization VARCHAR(100),
    experience_years INT,
    qualification VARCHAR(100),
    address TEXT,
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_veterinarians_email ON veterinarians(email);
CREATE INDEX idx_veterinarians_license ON veterinarians(license_number);
CREATE INDEX idx_veterinarians_specialization ON veterinarians(specialization);
CREATE INDEX idx_veterinarians_active ON veterinarians(is_active);

-- Insert sample veterinarians
INSERT INTO veterinarians (first_name, last_name, email, phone, license_number, specialization, experience_years, qualification, address, date_of_birth, gender) VALUES
('Dr. Sarah', 'Wilson', 'sarah.wilson@vetclinic.com', '+94771234567', 'VET001', 'Small Animal Medicine', 8, 'DVM, PhD', '123 Veterinary Street, Colombo 03', '1985-03-15', 'female'),
('Dr. Michael', 'Brown', 'michael.brown@vetclinic.com', '+94771234568', 'VET002', 'Surgery', 12, 'DVM, MS', '456 Animal Care Road, Kandy', '1980-07-22', 'male'),
('Dr. Emily', 'Davis', 'emily.davis@vetclinic.com', '+94771234569', 'VET003', 'Emergency Medicine', 6, 'DVM', '789 Pet Health Avenue, Galle', '1988-11-10', 'female'),
('Dr. James', 'Miller', 'james.miller@vetclinic.com', '+94771234570', 'VET004', 'Large Animal Medicine', 15, 'DVM, PhD', '321 Farm Animal Drive, Negombo', '1978-05-08', 'male'),
('Dr. Lisa', 'Anderson', 'lisa.anderson@vetclinic.com', '+94771234571', 'VET005', 'Dermatology', 10, 'DVM, MS', '654 Skin Care Lane, Jaffna', '1983-09-25', 'female');
