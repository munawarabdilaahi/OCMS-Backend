-- Migration: add_status_enums_and_db_constraints
-- Purpose: Synchronize the database with the Prisma schema for:
--   1. Status columns converted from VARCHAR(191) to their MySQL ENUM types.
--   2. Decimal columns annotated with @db.Decimal(10,2) / @db.Decimal(5,2).
--   3. Missing indexes (AuditLog, ExamSchedule, Invoice, Payment).
--   4. New composite unique constraints (Campus, Department, Faculty, Level, Program, Semester).
--
-- Generated via `prisma migrate diff --from-schema-datamodel <baseline> --to-schema-datamodel <current> --script`
-- with explicit data normalization UPDATEs added so the ENUM conversion cannot
-- fail on non-uppercase legacy values (e.g. 'Pending', 'Completed').

-- Normalize legacy status values to their enum casing before the type change.
UPDATE `invoice` SET `status` = 'PENDING' WHERE `status` IN ('Pending', 'pending');
UPDATE `payment` SET `status` = 'COMPLETED' WHERE `status` IN ('Completed', 'completed');

-- AlterTable
ALTER TABLE `academicyear` MODIFY `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `campus` MODIFY `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'CLOSED') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `department` MODIFY `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'CLOSED') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `enrollment` MODIFY `status` ENUM('ACTIVE', 'DROPPED', 'WITHDRAWN') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `examresult` MODIFY `midterm_score` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    MODIFY `final_score` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    MODIFY `activity_score` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    MODIFY `total_score` DECIMAL(5, 2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `faculty` MODIFY `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'CLOSED') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `feestructure` MODIFY `amount` DECIMAL(10, 2) NOT NULL;

-- AlterTable
ALTER TABLE `invoice` MODIFY `amount` DECIMAL(10, 2) NOT NULL,
    MODIFY `paid_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    MODIFY `balance` DECIMAL(10, 2) NOT NULL,
    MODIFY `status` ENUM('PENDING', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `level` MODIFY `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `payment` MODIFY `amount` DECIMAL(10, 2) NOT NULL,
    MODIFY `status` ENUM('COMPLETED', 'PENDING', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'COMPLETED';

-- AlterTable
ALTER TABLE `program` MODIFY `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `semester` MODIFY `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `student` MODIFY `status` ENUM('ACTIVE', 'INACTIVE', 'DELETED') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `teacher` MODIFY `status` ENUM('ACTIVE', 'INACTIVE', 'DELETED') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `transaction` MODIFY `amount` DECIMAL(10, 2) NOT NULL;

-- AlterTable
ALTER TABLE `user` MODIFY `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED', 'DISABLED') NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX `AuditLog_resource_idx` ON `auditlog`(`resource`);

-- CreateIndex
CREATE UNIQUE INDEX `Campus_name_university_id_key` ON `campus`(`name`, `university_id`);

-- CreateIndex
CREATE UNIQUE INDEX `Department_name_faculty_id_key` ON `department`(`name`, `faculty_id`);

-- CreateIndex
CREATE INDEX `ExamSchedule_exam_date_idx` ON `examschedule`(`exam_date`);

-- CreateIndex
CREATE UNIQUE INDEX `Faculty_name_campus_id_key` ON `faculty`(`name`, `campus_id`);

-- CreateIndex
CREATE INDEX `Invoice_due_date_idx` ON `invoice`(`due_date`);

-- CreateIndex
CREATE INDEX `Invoice_status_idx` ON `invoice`(`status`);

-- CreateIndex
CREATE UNIQUE INDEX `Level_name_program_id_key` ON `level`(`name`, `program_id`);

-- CreateIndex
CREATE INDEX `Payment_created_at_idx` ON `payment`(`created_at`);

-- CreateIndex
CREATE INDEX `Payment_status_idx` ON `payment`(`status`);

-- CreateIndex
CREATE UNIQUE INDEX `Program_name_department_id_key` ON `program`(`name`, `department_id`);

-- CreateIndex
CREATE UNIQUE INDEX `Semester_name_academic_year_id_key` ON `semester`(`name`, `academic_year_id`);