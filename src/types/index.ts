export type Role = 'STUDENT' | 'STAFF' | 'ADMIN';

export interface User {
  uid: string;
  email: string;
  fullName: string;
  role: Role;
  studentId?: string;
  course?: string;
  yearLevel?: string;
  contactNumber?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: number;
  updatedAt: number;
}

export interface DocumentType {
  id: string;
  name: string;
  description: string;
  requirements: string[]; // Array of requirement names
  processingTime: number; // in days
  fee: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: number;
  updatedAt: number;
}

export type RequestStatus = 
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'REQUIREMENTS_NEEDED'
  | 'CORRECTION_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PROCESSING'
  | 'READY_FOR_RELEASE'
  | 'RELEASED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface DocumentRequest {
  id: string; // The auto-generated document ID
  requestId: string; // The formatted SDR-2026-000001
  studentUid: string;
  studentId: string;
  studentName: string;
  documentTypeId: string;
  documentTypeName: string;
  purpose: string;
  quantity: number;
  releaseMethod: 'PICKUP' | 'EMAIL' | 'MAIL';
  status: RequestStatus;
  assignedStaffUid?: string;
  assignedStaffName?: string;
  remarks?: string;
  createdAt: number;
  updatedAt: number;
}

export interface RequestRequirement {
  id: string;
  requestId: string;
  studentUid: string;
  requirementName: string;
  fileName: string;
  fileUrl: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  uploadedAt: number;
  verifiedAt?: number;
  verifiedBy?: string;
}

export interface RequestHistory {
  id: string;
  requestId: string;
  previousStatus: RequestStatus | 'NONE';
  newStatus: RequestStatus;
  action: string;
  remarks?: string;
  performedBy: string;
  performedByUid: string;
  timestamp: number;
}

export interface Notification {
  id: string;
  recipientUid: string;
  requestId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  createdAt: number;
}

export interface AuditLog {
  id: string;
  userUid: string;
  userName: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  timestamp: number;
}
