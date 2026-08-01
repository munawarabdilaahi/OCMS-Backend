-- AlterTable
ALTER TABLE `campus` ADD COLUMN `accreditation_body` VARCHAR(191) NULL,
    ADD COLUMN `accreditation_expiry` DATETIME(3) NULL,
    ADD COLUMN `accreditation_status` VARCHAR(191) NULL,
    ADD COLUMN `buildings_count` INTEGER NULL,
    ADD COLUMN `cafeteria_count` INTEGER NULL,
    ADD COLUMN `campus_director` VARCHAR(191) NULL,
    ADD COLUMN `campus_size` DOUBLE NULL,
    ADD COLUMN `currency` VARCHAR(191) NULL,
    ADD COLUMN `director_email` VARCHAR(191) NULL,
    ADD COLUMN `director_phone` VARCHAR(191) NULL,
    ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `emergency_contact` VARCHAR(191) NULL,
    ADD COLUMN `emergency_phone` VARCHAR(191) NULL,
    ADD COLUMN `established_date` DATETIME(3) NULL,
    ADD COLUMN `facilities` JSON NULL,
    ADD COLUMN `library_hours` VARCHAR(191) NULL,
    ADD COLUMN `locale` VARCHAR(191) NULL,
    ADD COLUMN `max_capacity` INTEGER NULL,
    ADD COLUMN `medical_facilities` VARCHAR(191) NULL,
    ADD COLUMN `operating_hours` VARCHAR(191) NULL,
    ADD COLUMN `parking_capacity` INTEGER NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `security_details` VARCHAR(191) NULL,
    ADD COLUMN `sports_facilities` JSON NULL,
    ADD COLUMN `timezone` VARCHAR(191) NULL,
    ADD COLUMN `transport_routes` JSON NULL,
    ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT 'MAIN',
    ADD COLUMN `virtual_campus_url` VARCHAR(191) NULL,
    ADD COLUMN `website` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `department` ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `established_date` DATETIME(3) NULL,
    ADD COLUMN `facilities` JSON NULL,
    ADD COLUMN `hod_email` VARCHAR(191) NULL,
    ADD COLUMN `hod_name` VARCHAR(191) NULL,
    ADD COLUMN `hod_phone` VARCHAR(191) NULL,
    ADD COLUMN `max_programs` INTEGER NULL,
    ADD COLUMN `max_teachers` INTEGER NULL,
    ADD COLUMN `mission` VARCHAR(191) NULL,
    ADD COLUMN `office_location` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `research_areas` JSON NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN `student_capacity` INTEGER NULL,
    ADD COLUMN `vision` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `faculty` ADD COLUMN `accreditation_body` VARCHAR(191) NULL,
    ADD COLUMN `accreditation_expiry` DATETIME(3) NULL,
    ADD COLUMN `accreditation_status` VARCHAR(191) NULL,
    ADD COLUMN `dean_email` VARCHAR(191) NULL,
    ADD COLUMN `dean_name` VARCHAR(191) NULL,
    ADD COLUMN `dean_phone` VARCHAR(191) NULL,
    ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `established_date` DATETIME(3) NULL,
    ADD COLUMN `facilities` JSON NULL,
    ADD COLUMN `max_departments` INTEGER NULL,
    ADD COLUMN `mission` VARCHAR(191) NULL,
    ADD COLUMN `office_hours` VARCHAR(191) NULL,
    ADD COLUMN `office_location` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `research_areas` JSON NULL,
    ADD COLUMN `student_capacity` INTEGER NULL,
    ADD COLUMN `vision` VARCHAR(191) NULL,
    ADD COLUMN `website` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Campus_type_idx` ON `campus`(`type`);

-- CreateIndex
CREATE INDEX `Campus_status_idx` ON `campus`(`status`);

-- CreateIndex
CREATE INDEX `Department_status_idx` ON `department`(`status`);

-- CreateIndex
CREATE INDEX `Faculty_status_idx` ON `faculty`(`status`);

