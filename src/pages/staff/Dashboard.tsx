import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, getDocs, updateDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useAuth } from '../../context/AuthContext';
import { DocumentRequest, RequestHistory } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { FileText, Clock, CheckCircle, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

export function Dashboard() {
  const { userData } = useAuth();
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const q = query(collection(db, 'requests'));
      const snapshot = await getDocs(q);
      const reqs: DocumentRequest[] = [];
      snapshot.forEach(d => {
        reqs.push({ id: d.id, ...d.data() } as DocumentRequest);
      });
      reqs.sort((a, b) => b.createdAt - a.createdAt);
      setRequests(reqs);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(req => 
    req.requestId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
      case 'PROCESSING':
        return <Badge variant="info">{status}</Badge>;
      case 'APPROVED':
      case 'READY_FOR_RELEASE':
      case 'RELEASED':
      case 'COMPLETED':
        return <Badge variant="success">{status}</Badge>;
      case 'REJECTED':
      case 'CANCELLED':
        return <Badge variant="danger">{status}</Badge>;
      case 'REQUIREMENTS_NEEDED':
      case 'CORRECTION_REQUIRED':
        return <Badge variant="warning">{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleUpdateStatus = async (request: DocumentRequest, newStatus: any, actionDesc: string) => {
    try {
      const docRef = doc(db, 'requests', request.id);
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: Date.now(),
        assignedStaffUid: userData!.uid,
        assignedStaffName: userData!.fullName
      });

      const historyData: RequestHistory = {
        id: 'HIST-' + Date.now(),
        requestId: request.id,
        previousStatus: request.status,
        newStatus: newStatus,
        action: actionDesc,
        performedBy: userData!.fullName,
        performedByUid: userData!.uid,
        timestamp: Date.now()
      };
      await setDoc(doc(db, 'requestHistory', historyData.id), historyData);

      const notificationData = {
        id: 'NOTIF-' + Date.now(),
        recipientUid: request.studentUid,
        requestId: request.id,
        title: `Request Status Updated: ${newStatus}`,
        message: `Your request (${request.requestId}) status has been updated to ${newStatus}.`,
        type: newStatus === 'REJECTED' ? 'ERROR' : 'INFO',
        isRead: false,
        createdAt: Date.now()
      };
      await setDoc(doc(db, 'notifications', notificationData.id), notificationData);

      fetchRequests(); // Refresh
    } catch (error) {
      console.error("Error updating status: ", error);
    }
  };

  const stats = {
    total: requests.length,
    new: requests.filter(r => r.status === 'SUBMITTED').length,
    processing: requests.filter(r => ['APPROVED', 'PROCESSING', 'READY_FOR_RELEASE'].includes(r.status)).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Registrar Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">New / Unprocessed</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.new}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Currently Processing</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.processing}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Manage Requests</CardTitle>
          <div className="flex items-center w-64 space-x-2">
            <Input
              placeholder="Search by ID or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading requests...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-3">Request ID</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Document</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map(req => (
                    <tr key={req.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                        <Link to={`/staff/requests/${req.id}`} className="text-blue-600 hover:underline">
                          {req.requestId}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-gray-900 font-medium">{req.studentName}</span>
                          <span className="text-xs text-gray-500">{req.studentId}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{req.documentTypeName}</td>
                      <td className="px-4 py-3">{format(req.createdAt, 'MMM dd, yyyy')}</td>
                      <td className="px-4 py-3">{getStatusBadge(req.status)}</td>
                      <td className="px-4 py-3 flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/staff/requests/${req.id}`)}>
                          Review
                        </Button>
                        {req.status === 'SUBMITTED' && (
                          <Button variant="secondary" size="sm" onClick={() => handleUpdateStatus(req, 'UNDER_REVIEW', 'Staff started reviewing request')}>
                            Mark Review
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredRequests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No requests found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
