-- Pet Owners Table
CREATE TABLE IF NOT EXISTS pet_owners (
    owner_id INT AUTO_INCREMENT PRIMARY KEY,
    owner_name VARCHAR(100) NOT NULL,
    nic VARCHAR(20) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Pets Table
CREATE TABLE IF NOT EXISTS pets (
    pet_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    gender ENUM('male', 'female', 'unknown') NOT NULL,
    date_of_birth DATE,
    age_months INT,
    pet_category_id INT,
    breed_id INT,
    weight DECIMAL(5,2),
    color VARCHAR(50),
    remarks TEXT,
    owner_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (owner_id) REFERENCES pet_owners(owner_id) ON DELETE CASCADE
);

-- Add foreign key constraints after tables are created
ALTER TABLE pets ADD FOREIGN KEY (pet_category_id) REFERENCES pet_categories(id) ON DELETE SET NULL;
ALTER TABLE pets ADD FOREIGN KEY (breed_id) REFERENCES pet_breeds(id) ON DELETE SET NULL;

-- Indexes for better performance
CREATE INDEX idx_pets_owner ON pets(owner_id);
CREATE INDEX idx_pets_category ON pets(pet_category_id);
CREATE INDEX idx_pets_breed ON pets(breed_id);
CREATE INDEX idx_pets_name ON pets(name);
CREATE INDEX idx_pet_owners_nic ON pet_owners(nic);
CREATE INDEX idx_pet_owners_phone ON pet_owners(phone);

-- Insert sample pet owners
INSERT INTO pet_owners (owner_name, nic, phone, address, email) VALUES
('John Smith', '123456789V', '+94771234567', '123 Main Street, Colombo 03', 'john.smith@email.com'),
('Sarah Johnson', '987654321V', '+94771234568', '456 Oak Avenue, Kandy', 'sarah.johnson@email.com'),
('Michael Brown', '456789123V', '+94771234569', '789 Pine Road, Galle', 'michael.brown@email.com'),
('Emily Davis', '789123456V', '+94771234570', '321 Elm Street, Negombo', 'emily.davis@email.com'),
('David Wilson', '321654987V', '+94771234571', '654 Maple Drive, Jaffna', 'david.wilson@email.com');

-- Insert sample pets
INSERT INTO pets (name, gender, date_of_birth, age_months, pet_category_id, breed_id, weight, color, remarks, owner_id) VALUES
('Buddy', 'male', '2020-03-15', 48, 1, 1, 25.5, 'Golden', 'Friendly and energetic dog', 1),
('Whiskers', 'female', '2019-08-22', 54, 2, 5, 4.2, 'White and Black', 'Calm and affectionate cat', 2),
('Charlie', 'male', '2021-01-10', 36, 1, 2, 30.0, 'Brown', 'Very active and playful', 1),
('Luna', 'female', '2020-11-05', 40, 2, 6, 3.8, 'Gray', 'Shy but loving cat', 3),
('Max', 'male', '2022-06-12', 18, 1, 3, 15.0, 'Black', 'Young and energetic puppy', 4),
('Bella', 'female', '2018-12-03', 60, 2, 7, 5.1, 'Orange', 'Senior cat, very gentle', 5),
('Rocky', 'male', '2021-09-18', 27, 1, 4, 22.0, 'Mixed', 'Rescue dog, very loyal', 2),
('Mittens', 'female', '2020-04-25', 44, 2, 8, 3.5, 'Calico', 'Playful and curious', 3);
