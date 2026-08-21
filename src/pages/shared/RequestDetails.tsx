import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useAuth } from '../../context/AuthContext';
import { DocumentRequest, RequestRequirement, RequestHistory, Notification } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { format } from 'date-fns';
import { ArrowLeft, Check, X, Clock, FileText } from 'lucide-react';

export function RequestDetails() {
  const { id } = useParams<{ id: string }>();
  const { userData } = useAuth();
  const navigate = useNavigate();
  
  const [request, setRequest] = useState<DocumentRequest | null>(null);
  const [requirements, setRequirements] = useState<RequestRequirement[]>([]);
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // For staff actions
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) fetchRequestDetails();
  }, [id]);

  const fetchRequestDetails = async () => {
    setLoading(true);
    try {
      // 1. Get request
      const reqDoc = await getDoc(doc(db, 'requests', id!));
      if (reqDoc.exists()) {
        setRequest({ id: reqDoc.id, ...reqDoc.data() } as DocumentRequest);
      }

      // 2. Get requirements
      const reqsQ = query(collection(db, 'requestRequirements'), where('requestId', '==', id));
      const reqsSnap = await getDocs(reqsQ);
      const reqsData: RequestRequirement[] = [];
      reqsSnap.forEach(d => reqsData.push({ id: d.id, ...d.data() } as RequestRequirement));
      setRequirements(reqsData);

      // 3. Get history
      const histQ = query(collection(db, 'requestHistory'), where('requestId', '==', id));
      const histSnap = await getDocs(histQ);
      const histData: RequestHistory[] = [];
      histSnap.forEach(d => histData.push({ id: d.id, ...d.data() } as RequestHistory));
      histData.sort((a, b) => b.timestamp - a.timestamp);
      setHistory(histData);

    } catch (error) {
      console.error('Error fetching request details', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: any, actionDesc: string) => {
    if (!request || !userData) return;
    setActionLoading(true);
    try {
      const docRef = doc(db, 'requests', request.id);
      await updateDoc(docRef, {
        status: newStatus,
        remarks: remarks || request.remarks,
        updatedAt: Date.now(),
        assignedStaffUid: userData.uid,
        assignedStaffName: userData.fullName
      });

      const historyData: RequestHistory = {
        id: 'HIST-' + Date.now(),
        requestId: request.id,
        previousStatus: request.status,
        newStatus: newStatus,
        action: actionDesc,
        remarks: remarks,
        performedBy: userData.fullName,
        performedByUid: userData.uid,
        timestamp: Date.now()
      };
      await setDoc(doc(db, 'requestHistory', historyData.id), historyData);

      const notificationData: Notification = {
        id: 'NOTIF-' + Date.now(),
        recipientUid: request.studentUid,
        requestId: request.id,
        title: `Request Status Updated: ${newStatus}`,
        message: `Your request (${request.requestId}) has been updated to ${newStatus}. ${remarks ? 'Remarks: ' + remarks : ''}`,
        type: newStatus === 'REJECTED' || newStatus === 'CORRECTION_REQUIRED' ? 'ERROR' : 'INFO',
        isRead: false,
        createdAt: Date.now()
      };
      await setDoc(doc(db, 'notifications', notificationData.id), notificationData);

      setRemarks('');
      await fetchRequestDetails();
    } catch (error) {
      console.error("Error updating status: ", error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading request details...</div>;
  if (!request) return <div className="p-8 text-center text-red-500">Request not found.</div>;

  const isStaff = userData?.role === 'STAFF' || userData?.role === 'ADMIN';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="px-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Request {request.requestId}
          </h2>
          <p className="text-gray-500">{request.documentTypeName}</p>
        </div>
        <div className="ml-auto">
          <Badge className="text-sm px-3 py-1" variant={
            ['APPROVED', 'RELEASED', 'COMPLETED', 'READY_FOR_RELEASE'].includes(request.status) ? 'success' :
            ['REJECTED', 'CANCELLED'].includes(request.status) ? 'danger' :
            ['CORRECTION_REQUIRED', 'REQUIREMENTS_NEEDED'].includes(request.status) ? 'warning' : 'info'
          }>{request.status}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-gray-500 mb-1">Student Name</span>
                  <span className="font-medium text-gray-900">{request.studentName}</span>
                </div>
                <div>
                  <span className="block text-gray-500 mb-1">Student ID</span>
                  <span className="font-medium text-gray-900">{request.studentId}</span>
                </div>
                <div>
                  <span className="block text-gray-500 mb-1">Purpose</span>
                  <span className="font-medium text-gray-900">{request.purpose}</span>
                </div>
                <div>
                  <span className="block text-gray-500 mb-1">Release Method</span>
                  <span className="font-medium text-gray-900">{request.releaseMethod}</span>
                </div>
                <div>
                  <span className="block text-gray-500 mb-1">Quantity</span>
                  <span className="font-medium text-gray-900">{request.quantity} copy(s)</span>
                </div>
                <div>
                  <span className="block text-gray-500 mb-1">Date Requested</span>
                  <span className="font-medium text-gray-900">{format(request.createdAt, 'MMM dd, yyyy h:mm a')}</span>
                </div>
              </div>
              {request.remarks && (
                <div className="pt-4 border-t border-gray-100">
                  <span className="block text-gray-500 mb-1">Student Remarks</span>
                  <p className="font-medium text-gray-900">{request.remarks}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Uploaded Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              {requirements.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {requirements.map(req => (
                    <li key={req.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{req.requirementName}</p>
                          <a href={req.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                            View Document
                          </a>
                        </div>
                      </div>
                      <Badge variant={req.verificationStatus === 'VERIFIED' ? 'success' : 'default'}>
                        {req.verificationStatus}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No requirements uploaded.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {isStaff && !['RELEASED', 'COMPLETED', 'CANCELLED', 'REJECTED'].includes(request.status) && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900">Staff Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  className="w-full rounded-md border border-gray-300 p-2 text-sm"
                  placeholder="Enter remarks/reason before updating status..."
                  rows={3}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                />
                
                <div className="grid grid-cols-1 gap-2">
                  {['SUBMITTED', 'UNDER_REVIEW', 'CORRECTION_REQUIRED'].includes(request.status) && (
                    <>
                      <Button 
                        onClick={() => handleUpdateStatus('APPROVED', 'Staff approved request')} 
                        isLoading={actionLoading}
                        variant="primary"
                      >
                        <Check className="mr-2 h-4 w-4" /> Approve
                      </Button>
                      <Button 
                        onClick={() => handleUpdateStatus('CORRECTION_REQUIRED', 'Staff requested correction')} 
                        isLoading={actionLoading}
                        variant="outline"
                      >
                        Request Correction
                      </Button>
                      <Button 
                        onClick={() => handleUpdateStatus('REJECTED', 'Staff rejected request')} 
                        isLoading={actionLoading}
                        variant="danger"
                      >
                        <X className="mr-2 h-4 w-4" /> Reject
                      </Button>
                    </>
                  )}
                  
                  {request.status === 'APPROVED' && (
                    <Button onClick={() => handleUpdateStatus('PROCESSING', 'Started processing document')} isLoading={actionLoading}>
                      Mark Processing
                    </Button>
                  )}
                  
                  {request.status === 'PROCESSING' && (
                    <Button onClick={() => handleUpdateStatus('READY_FOR_RELEASE', 'Document ready for release')} isLoading={actionLoading}>
                      Mark Ready for Release
                    </Button>
                  )}
                  
                  {request.status === 'READY_FOR_RELEASE' && (
                    <Button onClick={() => handleUpdateStatus('COMPLETED', 'Document released and completed')} isLoading={actionLoading} variant="success" className="bg-green-600 hover:bg-green-700 text-white">
                      Mark Completed
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>History Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.map((h, i) => (
                  <div key={h.id} className="relative pl-6 border-l-2 border-gray-200 last:border-0 pb-4 last:pb-0">
                    <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-white" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{h.action}</span>
                      <span className="text-xs text-gray-500">{format(h.timestamp, 'MMM dd, yyyy h:mm a')} • by {h.performedBy}</span>
                      {h.remarks && (
                        <p className="text-xs text-gray-700 mt-1 bg-gray-50 p-2 rounded">{h.remarks}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
