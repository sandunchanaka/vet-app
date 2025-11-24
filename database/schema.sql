-- Create database
CREATE DATABASE IF NOT EXISTS etutor_platform;
USE etutor_platform;

-- Create user_type table
CREATE TABLE IF NOT EXISTS user_type (
    user_type_id INT AUTO_INCREMENT PRIMARY KEY,
    user_type_name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    business_name VARCHAR(255),
    website VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    user_type INT NOT NULL,
    remember_token VARCHAR(255) NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_user INT NULL,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_user INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_type) REFERENCES user_type(user_type_id),
    FOREIGN KEY (created_user) REFERENCES users(id),
    FOREIGN KEY (updated_user) REFERENCES users(id)
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);

-- Insert user types
INSERT INTO user_type (user_type_name) VALUES 
('admin'),
('institution'),
('teachers'),
('student'),
('publishers');

-- Insert sample admin user
INSERT INTO users (first_name, last_name, email, password, user_type, created_user) 
VALUES 
('System', 'Administrator', 'admin@etutor.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 1);

-- Insert additional sample users
INSERT INTO users (first_name, last_name, email, password, user_type, created_user) 
VALUES 
('John', 'Doe', 'john.doe@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 2, 1),
('Jane', 'Smith', 'jane.smith@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3, 1),
('Mike', 'Johnson', 'mike.johnson@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 4, 1),
('Sarah', 'Wilson', 'sarah.wilson@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 5, 1);