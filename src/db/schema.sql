CREATE TABLE Users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'customer') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  level ENUM('regional', 'national', 'international', 'startup-awards') NOT NULL,
);

CREATE TABLE Competitions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  rules TEXT NOT NULL,
  track_details TEXT NOT NULL,
  pdf_url VARCHAR(255),
  age_group VARCHAR(255),
  FOREIGN KEY (event_id) REFERENCES Events(id),
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Registrations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  competition_id INT NOT NULL,
  team_code VARCHAR(255),
  team_name VARCHAR(255),
  leader_name VARCHAR(255),
  leader_email VARCHAR(255),
  leader_age INT,
  leader_school VARCHAR(255),
  leader_total_students INT,
  leader_address VARCHAR(255),
  leader_city VARCHAR(255),
  leader_state VARCHAR(255),
  leader_zipcode VARCHAR(20),
  leader_phone VARCHAR(20),
  coach_mentor_name VARCHAR(255),
  coach_mentor_organization VARCHAR(255),
  coach_mentor_phone VARCHAR(20),
  coach_mentor_email VARCHAR(255),
  member_names JSON,
  member_ages JSON,
  member_emails JSON,
  member_phones JSON,
  member_tshirt_sizes JSON,
  participant_id VARCHAR(255) NOT NULL,
  status ENUM('pending', 'confirmed', 'cancelled') NOT NULL,
  payment_status ENUM('paid', 'unpaid') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  region_id INT NOT NULL,
  member_emails JSON,
  FOREIGN KEY (competition_id) REFERENCES Competitions(id),
  FOREIGN KEY (region_id) REFERENCES Regions(id)
);


CREATE TABLE Payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  registration_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  transaction_id VARCHAR(255) NOT NULL,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('success', 'failed') NOT NULL,
  FOREIGN KEY (registration_id) REFERENCES Registrations(id)
);

CREATE TABLE Certificates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  registration_id INT NOT NULL,
  certificate_url VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (registration_id) REFERENCES Registrations(id)
);

CREATE TABLE EventPass (
  id INT PRIMARY KEY AUTO_INCREMENT,
  registration_id INT NOT NULL,
  pass_url VARCHAR(255) NOT NULL,
  qr_code VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (registration_id) REFERENCES Registrations(id)
);

CREATE TABLE Inquiry (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);