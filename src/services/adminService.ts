import { collection, doc, writeBatch, getDocs, query, where, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import { User, Role, UserStatus, AuditLog } from '../types';

export class AdminService {
  /**
   * Promotes, demotes, or changes the role of a user securely using a batch write
   * that simultaneously records an audit log.
   */
  static async changeUserRole(
    targetUid: string,
    newRole: Role,
    reason: string = 'Role updated by administrator'
  ): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('You must be logged in to perform this action.');
    if (currentUser.uid === targetUid) throw new Error('You cannot modify your own role through this function.');

    // Pre-flight check: is the current user an admin?
    const adminDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (!adminDoc.exists() || adminDoc.data().role !== 'ADMIN') {
      throw new Error('You do not have permission to perform this action.');
    }
    const adminData = adminDoc.data() as User;

    // Fetch target user
    const targetRef = doc(db, 'users', targetUid);
    const targetDoc = await getDoc(targetRef);
    
    if (!targetDoc.exists()) {
      throw new Error('The selected user could not be found.');
    }
    
    const targetData = targetDoc.data() as User;
    if (targetData.role === newRole) {
      throw new Error(`This user already has the ${newRole} role.`);
    }
    
    // Protect the last active administrator
    if (targetData.role === 'ADMIN' && newRole !== 'ADMIN') {
      const adminsQuery = query(
        collection(db, 'users'), 
        where('role', '==', 'ADMIN'), 
        where('status', '==', 'ACTIVE')
      );
      const adminsSnap = await getDocs(adminsQuery);
      if (adminsSnap.size <= 1) {
        throw new Error('This action is blocked because at least one active administrator must remain.');
      }
    }

    const batch = writeBatch(db);

    // Update the user document
    batch.update(targetRef, {
      role: newRole,
      roleChangedAt: Date.now(),
      roleChangedBy: currentUser.uid,
      previousRole: targetData.role,
      updatedAt: Date.now()
    });

    // Create Audit Log
    const auditLogRef = doc(collection(db, 'auditLogs'));
    const auditLog: AuditLog = {
      id: auditLogRef.id,
      action: 'ROLE_CHANGED',
      targetType: 'USER',
      targetId: targetUid,
      performedBy: currentUser.uid,
      performedByName: adminData.fullName,
      previousRole: targetData.role,
      newRole: newRole,
      timestamp: Date.now(),
      details: reason
    };

    batch.set(auditLogRef, auditLog);

    await batch.commit();
  }

  /**
   * Disables or activates a user account.
   */
  static async changeUserStatus(
    targetUid: string,
    newStatus: UserStatus,
    reason: string = 'Status updated by administrator'
  ): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('You must be logged in to perform this action.');
    if (currentUser.uid === targetUid) throw new Error('You cannot modify your own status through this function.');

    // Pre-flight check: is the current user an admin?
    const adminDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (!adminDoc.exists() || adminDoc.data().role !== 'ADMIN') {
      throw new Error('You do not have permission to perform this action.');
    }
    const adminData = adminDoc.data() as User;

    const targetRef = doc(db, 'users', targetUid);
    const targetDoc = await getDoc(targetRef);
    if (!targetDoc.exists()) throw new Error('User not found.');
    
    const targetData = targetDoc.data() as User;

    // Protect the last active administrator from being disabled
    if (targetData.role === 'ADMIN' && newStatus !== 'ACTIVE') {
      const adminsQuery = query(
        collection(db, 'users'), 
        where('role', '==', 'ADMIN'), 
        where('status', '==', 'ACTIVE')
      );
      const adminsSnap = await getDocs(adminsQuery);
      if (adminsSnap.size <= 1) {
        throw new Error('This action is blocked because at least one active administrator must remain.');
      }
    }

    const batch = writeBatch(db);

    batch.update(targetRef, {
      status: newStatus,
      updatedAt: Date.now()
    });

    const auditLogRef = doc(collection(db, 'auditLogs'));
    const auditLog: AuditLog = {
      id: auditLogRef.id,
      action: 'STATUS_CHANGED',
      targetType: 'USER',
      targetId: targetUid,
      performedBy: currentUser.uid,
      performedByName: adminData.fullName,
      timestamp: Date.now(),
      details: `Status changed from ${targetData.status} to ${newStatus}. Reason: ${reason}`
    };

    batch.set(auditLogRef, auditLog);
    await batch.commit();
  }
}
