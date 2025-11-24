-- Animal Clinic Database Schema
-- Create database
CREATE DATABASE IF NOT EXISTS animal_clinic_db;
USE animal_clinic_db;

-- Create user_type table for veterinary staff roles
CREATE TABLE IF NOT EXISTS user_type (
    user_type_id INT AUTO_INCREMENT PRIMARY KEY,
    user_type_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create users table for veterinary staff
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    user_type INT NOT NULL,
    license_number VARCHAR(100), -- Veterinary license number
    specialization VARCHAR(255), -- Veterinary specialization
    remember_token VARCHAR(255) NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_user INT NULL,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_user INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP NULL,
    FOREIGN KEY (user_type) REFERENCES user_type(user_type_id),
    FOREIGN KEY (created_user) REFERENCES users(id),
    FOREIGN KEY (updated_user) REFERENCES users(id)
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_license ON users(license_number);

-- Insert user types for veterinary clinic
INSERT INTO user_type (user_type_name, description) VALUES 
('admin', 'System Administrator - Full access to all features'),
('veterinarian', 'Licensed Veterinarian - Can treat animals and manage medical records'),
('veterinary_technician', 'Veterinary Technician - Assists veterinarians and manages appointments'),
('receptionist', 'Front Desk Receptionist - Manages appointments and client communication'),
('nurse', 'Veterinary Nurse - Provides animal care and support');

-- Insert sample admin user
INSERT INTO users (first_name, last_name, email, password_hash, user_type, license_number, specialization, created_user) 
VALUES 
('Dr. Sarah', 'Johnson', 'admin@vetcare.com', '$2a$10$h355PNS1vP4or2trjLBwU.2SBXY8oLWlWEiLF64AIfQgxeHY2z8Ke', 1, 'VET-ADMIN-001', 'System Administrator', 1);

-- Insert sample veterinarian
INSERT INTO users (first_name, last_name, email, password_hash, user_type, license_number, specialization, created_user) 
VALUES 
('Dr. Michael', 'Chen', 'dr.chen@vetcare.com', '$2a$10$h355PNS1vP4or2trjLBwU.2SBXY8oLWlWEiLF64AIfQgxeHY2z8Ke', 2, 'VET-12345', 'Small Animal Medicine', 1);

-- Insert sample veterinary technician
INSERT INTO users (first_name, last_name, email, password_hash, user_type, license_number, specialization, created_user) 
VALUES 
('Lisa', 'Rodriguez', 'lisa.rodriguez@vetcare.com', '$2a$10$h355PNS1vP4or2trjLBwU.2SBXY8oLWlWEiLF64AIfQgxeHY2z8Ke', 3, 'VT-67890', 'Surgery Assistant', 1);

-- Insert sample receptionist
INSERT INTO users (first_name, last_name, email, password_hash, user_type, license_number, specialization, created_user) 
VALUES 
('Emma', 'Thompson', 'emma.thompson@vetcare.com', '$2a$10$h355PNS1vP4or2trjLBwU.2SBXY8oLWlWEiLF64AIfQgxeHY2z8Ke', 4, NULL, 'Client Relations', 1);

-- Insert sample veterinary nurse
INSERT INTO users (first_name, last_name, email, password_hash, user_type, license_number, specialization, created_user) 
VALUES 
('James', 'Wilson', 'james.wilson@vetcare.com', '$2a$10$h355PNS1vP4or2trjLBwU.2SBXY8oLWlWEiLF64AIfQgxeHY2z8Ke', 5, 'VN-54321', 'Animal Care Specialist', 1);
