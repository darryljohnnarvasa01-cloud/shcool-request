import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, setDoc, runTransaction } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/firebase';
import { useAuth } from '../../context/AuthContext';
import { DocumentType, DocumentRequest, RequestRequirement, RequestHistory } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { AlertCircle } from 'lucide-react';

export function NewRequest() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    documentTypeId: '',
    purpose: '',
    quantity: 1,
    releaseMethod: 'PICKUP' as 'PICKUP' | 'EMAIL' | 'MAIL',
    remarks: ''
  });

  const [files, setFiles] = useState<{ [key: string]: File }>({});

  useEffect(() => {
    fetchDocTypes();
  }, []);

  const fetchDocTypes = async () => {
    const snapshot = await getDocs(collection(db, 'documentTypes'));
    const types: DocumentType[] = [];
    snapshot.forEach(d => {
      if (d.data().status === 'ACTIVE') {
        types.push({ id: d.id, ...d.data() } as DocumentType);
      }
    });
    setDocTypes(types);
    setLoading(false);
  };

  const selectedDocType = docTypes.find(d => d.id === formData.documentTypeId);

  const handleFileChange = (requirementName: string, file: File | null) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError(`File ${file.name} exceeds 5MB limit`);
        return;
      }
      setFiles(prev => ({ ...prev, [requirementName]: file }));
      setError('');
    }
  };

  const generateRequestId = async () => {
    // Generate a simple unique ID SDR-YYYY-XXXXXX
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `SDR-${year}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocType) return;
    
    // Check requirements
    for (const req of selectedDocType.requirements || []) {
      if (!files[req]) {
        setError(`Please upload requirement: ${req}`);
        return;
      }
    }

    setSubmitting(true);
    setError('');

    try {
      const requestIdFormat = await generateRequestId();
      const documentId = 'REQ-' + Date.now();
      
      // Upload files first
      const uploadedReqs: RequestRequirement[] = [];
      
      for (const req of selectedDocType.requirements || []) {
        const file = files[req];
        const storageRef = ref(storage, `requirements/${userData!.uid}/${documentId}/${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        
        uploadedReqs.push({
          id: 'REQ-DOC-' + Date.now() + Math.random().toString(36).substring(7),
          requestId: documentId,
          studentUid: userData!.uid,
          requirementName: req,
          fileName: file.name,
          fileUrl: url,
          verificationStatus: 'PENDING',
          uploadedAt: Date.now()
        });
      }

      const requestData: DocumentRequest = {
        id: documentId,
        requestId: requestIdFormat,
        studentUid: userData!.uid,
        studentId: userData!.studentId || '',
        studentName: userData!.fullName,
        documentTypeId: selectedDocType.id,
        documentTypeName: selectedDocType.name,
        purpose: formData.purpose,
        quantity: formData.quantity,
        releaseMethod: formData.releaseMethod,
        status: 'SUBMITTED',
        remarks: formData.remarks,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const historyData: RequestHistory = {
        id: 'HIST-' + Date.now(),
        requestId: documentId,
        previousStatus: 'NONE',
        newStatus: 'SUBMITTED',
        action: 'Student submitted document request',
        performedBy: userData!.fullName,
        performedByUid: userData!.uid,
        timestamp: Date.now()
      };

      const notificationData = {
        id: 'NOTIF-' + Date.now(),
        recipientUid: userData!.uid,
        requestId: documentId,
        title: 'Request Submitted Successfully',
        message: `Your request for ${selectedDocType.name} (${requestIdFormat}) has been submitted and is under review.`,
        type: 'INFO',
        isRead: false,
        createdAt: Date.now()
      };

      // Save to Firestore
      await setDoc(doc(db, 'requests', documentId), requestData);
      
      for (const reqDoc of uploadedReqs) {
        await setDoc(doc(db, 'requestRequirements', reqDoc.id), reqDoc);
      }
      
      await setDoc(doc(db, 'requestHistory', historyData.id), historyData);
      await setDoc(doc(db, 'notifications', notificationData.id), notificationData);

      navigate('/student');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while submitting your request.');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading form...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">New Document Request</h2>
        <Button variant="outline" onClick={() => navigate('/student')}>Cancel</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Select
              label="Select Document Type"
              value={formData.documentTypeId}
              onChange={e => setFormData({ ...formData, documentTypeId: e.target.value })}
              options={docTypes.map(d => ({ label: `${d.name} (₱${d.fee} - ${d.processingTime} days)`, value: d.id }))}
              required
            />

            {selectedDocType && (
              <>
                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="font-medium text-blue-900 mb-1">Information</h4>
                  <p className="text-sm text-blue-800">{selectedDocType.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Quantity"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    required
                  />
                  <Select
                    label="Release Method"
                    value={formData.releaseMethod}
                    onChange={e => setFormData({ ...formData, releaseMethod: e.target.value as any })}
                    options={[
                      { label: 'Pick up at Registrar', value: 'PICKUP' },
                      { label: 'Email (Digital Copy)', value: 'EMAIL' },
                      { label: 'Mail Delivery', value: 'MAIL' },
                    ]}
                    required
                  />
                </div>

                <Input
                  label="Purpose of Request"
                  placeholder="e.g. For employment, board exam, etc."
                  value={formData.purpose}
                  onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                  required
                />
                
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium text-gray-900">Required Documents</h3>
                  <p className="text-sm text-gray-500">Please upload the required files for this document type (Max 5MB per file).</p>
                  
                  {selectedDocType.requirements?.length > 0 ? (
                    <div className="space-y-4">
                      {selectedDocType.requirements.map((req, i) => (
                        <div key={i} className="flex flex-col space-y-1">
                          <label className="text-sm font-medium text-gray-700">{req} <span className="text-red-500">*</span></label>
                          <input
                            type="file"
                            onChange={(e) => handleFileChange(req, e.target.files?.[0] || null)}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-300 rounded-md p-1"
                            accept=".pdf,.jpg,.jpeg,.png"
                            required
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No additional documents required.</p>
                  )}
                </div>

                <div className="space-y-1 pt-4 border-t">
                  <label className="text-sm font-medium text-gray-700">Additional Remarks (Optional)</label>
                  <textarea
                    className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    rows={3}
                    value={formData.remarks}
                    onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" size="lg" isLoading={submitting}>
                    Submit Request
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
