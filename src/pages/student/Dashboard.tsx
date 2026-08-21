import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useAuth } from '../../context/AuthContext';
import { DocumentRequest } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FileText, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { format } from 'date-fns';

export function Dashboard() {
  const { userData } = useAuth();
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (userData?.uid) {
      fetchRequests();
    }
  }, [userData]);

  const fetchRequests = async () => {
    try {
      const q = query(
        collection(db, 'requests'),
        where('studentUid', '==', userData!.uid)
      );
      const snapshot = await getDocs(q);
      const reqs: DocumentRequest[] = [];
      snapshot.forEach(doc => {
        reqs.push({ id: doc.id, ...doc.data() } as DocumentRequest);
      });
      // Sort by createdAt descending
      reqs.sort((a, b) => b.createdAt - a.createdAt);
      setRequests(reqs);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const stats = {
    total: requests.length,
    pending: requests.filter(r => ['SUBMITTED', 'UNDER_REVIEW', 'REQUIREMENTS_NEEDED', 'CORRECTION_REQUIRED'].includes(r.status)).length,
    processing: requests.filter(r => ['APPROVED', 'PROCESSING', 'READY_FOR_RELEASE'].includes(r.status)).length,
    completed: requests.filter(r => ['RELEASED', 'COMPLETED'].includes(r.status)).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Welcome back, {userData?.fullName}</h2>
          <p className="text-gray-500">Student ID: {userData?.studentId} • {userData?.course}</p>
        </div>
        <Button onClick={() => navigate('/student/requests/new')}>
          <Plus className="mr-2 h-4 w-4" /> Request Document
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
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
            <CardTitle className="text-sm font-medium text-gray-500">Pending Action</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Processing</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.processing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading requests...</div>
          ) : requests.length > 0 ? (
            <div className="divide-y">
              {requests.slice(0, 5).map((req) => (
                <div key={req.id} className="py-4 flex items-center justify-between hover:bg-gray-50 px-2 rounded-md transition-colors">
                  <div className="flex flex-col">
                    <Link to={`/student/requests/${req.id}`} className="font-medium text-blue-600 hover:underline">
                      {req.requestId} - {req.documentTypeName}
                    </Link>
                    <span className="text-sm text-gray-500">Requested on {format(req.createdAt, 'MMM dd, yyyy - h:mm a')}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    {getStatusBadge(req.status)}
                    <Button variant="outline" size="sm" onClick={() => navigate(`/student/requests/${req.id}`)}>
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              You haven't made any document requests yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
