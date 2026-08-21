import React, { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { DocumentRequest } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { FileText, Users, CheckCircle, Clock } from 'lucide-react';

export function Dashboard() {
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);

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
      setRequests(reqs);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: requests.length,
    completed: requests.filter(r => ['COMPLETED', 'RELEASED'].includes(r.status)).length,
    pending: requests.filter(r => !['COMPLETED', 'RELEASED', 'REJECTED', 'CANCELLED'].includes(r.status)).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Admin Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total System Requests</CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active / Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Completed Requests</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">Welcome to the Administrator Dashboard. From here you can manage system settings, users, and document types.</p>
          <p className="text-sm text-gray-600">Please use the sidebar to navigate to specific management sections.</p>
        </CardContent>
      </Card>
    </div>
  );
}
