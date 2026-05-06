-- ============================================================
-- LAIKIPIA UNIVERSITY LOST & FOUND SYSTEM — DATABASE SCHEMA
-- ============================================================

CREATE DATABASE IF NOT EXISTS laikipia_lost_found CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE laikipia_lost_found;

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(30) UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'staff', 'admin', 'security') DEFAULT 'student',
  department VARCHAR(100),
  phone VARCHAR(20),
  avatar_url VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CAMPUS LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  building VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ITEMS TABLE (lost & found)
CREATE TABLE IF NOT EXISTS items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('lost', 'found') NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category_id INT,
  location_id INT,
  location_detail VARCHAR(255),
  date_occurred DATE NOT NULL,
  status ENUM('open', 'matched', 'resolved', 'archived') DEFAULT 'open',
  is_valuable BOOLEAN DEFAULT FALSE,
  reward_offered BOOLEAN DEFAULT FALSE,
  reward_amount DECIMAL(10,2),
  ai_tags JSON,
  view_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (location_id) REFERENCES locations(id),
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_created (created_at DESC)
);

-- ITEM IMAGES TABLE
CREATE TABLE IF NOT EXISTS item_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  url VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- AI MATCHES TABLE
CREATE TABLE IF NOT EXISTS ai_matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lost_item_id INT NOT NULL,
  found_item_id INT NOT NULL,
  confidence_score DECIMAL(5,2) NOT NULL,
  ai_reasoning TEXT,
  status ENUM('pending', 'confirmed', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lost_item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (found_item_id) REFERENCES items(id) ON DELETE CASCADE,
  UNIQUE KEY unique_match (lost_item_id, found_item_id)
);

-- MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  item_id INT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL,
  INDEX idx_conversation (sender_id, receiver_id)
);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('match_found', 'message_received', 'item_resolved', 'claim_request', 'system') NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  data JSON,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_unread (user_id, is_read)
);

-- CLAIMS TABLE
CREATE TABLE IF NOT EXISTS claims (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  claimant_id INT NOT NULL,
  proof_description TEXT NOT NULL,
  proof_image_url VARCHAR(255),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  admin_note TEXT,
  reviewed_by INT,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (claimant_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  details JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created (created_at DESC)
);

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO categories (name, icon, color) VALUES
('Electronics', '💻', '#3B82F6'),
('Documents & ID', '🪪', '#8B5CF6'),
('Clothing & Accessories', '👜', '#EC4899'),
('Books & Stationery', '📚', '#F59E0B'),
('Keys', '🔑', '#10B981'),
('Jewelry & Watches', '💍', '#F97316'),
('Sports Equipment', '⚽', '#06B6D4'),
('Money & Wallets', '💰', '#84CC16'),
('Other', '📦', '#6B7280');

INSERT INTO locations (name, building, description) VALUES
('Main Library', 'Library Block', 'Ground and upper floors'),
('ICT Lab 1', 'Computing Block', 'Lab on first floor'),
('ICT Lab 2', 'Computing Block', 'Lab on second floor'),
('Cafeteria', 'Student Centre', 'Main dining area'),
('Administration Block', 'Admin Block', 'Reception and offices'),
('Lecture Hall A', 'Academic Block A', 'Halls 1–10'),
('Lecture Hall B', 'Academic Block B', 'Halls 11–20'),
('Sports Ground', 'Outdoor', 'Football pitch and courts'),
('Student Centre', 'Student Block', 'Common rooms and lobby'),
('Security Office', 'Main Gate', 'Main campus entrance'),
('Hostel A', 'Hostel Block A', 'Male hostel'),
('Hostel B', 'Hostel Block B', 'Female hostel'),
('Parking Lot', 'Outdoor', 'Main vehicle parking'),
('Chapel', 'Chapel Block', 'University chapel');

-- Default admin user (password: Admin@1234)
INSERT INTO users (student_id, full_name, email, password_hash, role, is_verified) VALUES
('ADMIN001', 'System Administrator', 'admin@laikipia.ac.ke',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtG9MEo5A8xB5mAi7FqZoQr3eCLu', 'admin', TRUE),
('SEC001', 'Security Office', 'security@laikipia.ac.ke',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtG9MEo5A8xB5mAi7FqZoQr3eCLu', 'security', TRUE);
