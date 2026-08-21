import { pgTable, text, timestamp, integer, boolean, uuid, varchar, json } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  uid: text("uid").primaryKey(), // Firebase Auth UID
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull(), // 'STUDENT' | 'STAFF' | 'REGISTRAR' | 'ADMIN'
  studentId: text("student_id"),
  course: text("course"),
  yearLevel: text("year_level"),
  contactNumber: text("contact_number"),
  status: text("status").notNull(), // 'ACTIVE' | 'DISABLED' | 'SUSPENDED' | 'INACTIVE'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  roleChangedAt: timestamp("role_changed_at"),
  roleChangedBy: text("role_changed_by"),
  previousRole: text("previous_role"),
});

export const documentTypes = pgTable("document_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  requirements: json("requirements").notNull().$type<string[]>(), // Array of requirement names
  processingTime: integer("processing_time").notNull(), // in days
  fee: integer("fee").notNull(),
  status: text("status").notNull(), // 'ACTIVE' | 'INACTIVE'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documentRequests = pgTable("document_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: text("request_id").notNull().unique(), // The formatted SDR-2026-000001
  studentUid: text("student_uid").notNull(),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull(),
  documentTypeId: uuid("document_type_id").notNull(),
  documentTypeName: text("document_type_name").notNull(),
  purpose: text("purpose").notNull(),
  quantity: integer("quantity").notNull(),
  releaseMethod: text("release_method").notNull(), // 'PICKUP' | 'EMAIL' | 'MAIL'
  status: text("status").notNull(),
  assignedStaffUid: text("assigned_staff_uid"),
  assignedStaffName: text("assigned_staff_name"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const requestRequirements = pgTable("request_requirements", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: text("request_id").notNull(), // Reference to documentRequests.requestId
  studentUid: text("student_uid").notNull(),
  requirementName: text("requirement_name").notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  verificationStatus: text("verification_status").notNull(), // 'PENDING' | 'VERIFIED' | 'REJECTED'
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: text("verified_by"),
});

export const requestHistory = pgTable("request_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: text("request_id").notNull(), // Reference to documentRequests.requestId
  previousStatus: text("previous_status").notNull(), // RequestStatus | 'NONE'
  newStatus: text("new_status").notNull(), // RequestStatus
  action: text("action").notNull(),
  remarks: text("remarks"),
  performedBy: text("performed_by").notNull(),
  performedByUid: text("performed_by_uid").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipientUid: text("recipient_uid").notNull(),
  requestId: text("request_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  performedBy: text("performed_by").notNull(),
  performedByName: text("performed_by_name").notNull(),
  previousRole: text("previous_role"),
  newRole: text("new_role"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  details: text("details").notNull(),
});
