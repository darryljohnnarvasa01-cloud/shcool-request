import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { DocumentType } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export function DocumentTypes() {
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<DocumentType>>({
    name: '',
    description: '',
    requirements: [],
    processingTime: 3,
    fee: 0,
    status: 'ACTIVE'
  });
  const [newReq, setNewReq] = useState('');

  const fetchDocTypes = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, 'documentTypes'));
    const types: DocumentType[] = [];
    querySnapshot.forEach((doc) => {
      types.push({ id: doc.id, ...doc.data() } as DocumentType);
    });
    setDocTypes(types);
    setLoading(false);
  };

  useEffect(() => {
    fetchDocTypes();
  }, []);

  const handleSave = async () => {
    if (!formData.name) return;
    
    try {
      if (formData.id) {
        // Update
        const docRef = doc(db, 'documentTypes', formData.id);
        await updateDoc(docRef, { ...formData, updatedAt: Date.now() });
      } else {
        // Create
        const id = 'DT-' + Date.now();
        const docRef = doc(db, 'documentTypes', id);
        await setDoc(docRef, {
          ...formData,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
      setIsEditing(false);
      setFormData({ name: '', description: '', requirements: [], processingTime: 3, fee: 0, status: 'ACTIVE' });
      fetchDocTypes();
    } catch (error) {
      console.error('Error saving document type:', error);
    }
  };

  const handleAddRequirement = () => {
    if (newReq && formData.requirements) {
      setFormData({ ...formData, requirements: [...formData.requirements, newReq] });
      setNewReq('');
    }
  };

  const handleRemoveRequirement = (index: number) => {
    if (formData.requirements) {
      const updated = [...formData.requirements];
      updated.splice(index, 1);
      setFormData({ ...formData, requirements: updated });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Manage Document Types</h2>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Document Type
          </Button>
        )}
      </div>

      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>{formData.id ? 'Edit Document Type' : 'New Document Type'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input 
              label="Document Name" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
            />
            <Input 
              label="Description" 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
            />
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Processing Time (days)" 
                type="number" 
                value={formData.processingTime} 
                onChange={e => setFormData({...formData, processingTime: parseInt(e.target.value) || 0})} 
              />
              <Input 
                label="Fee ($)" 
                type="number" 
                value={formData.fee} 
                onChange={e => setFormData({...formData, fee: parseInt(e.target.value) || 0})} 
              />
            </div>
            
            <div className="space-y-2 border-t pt-4 mt-4">
              <label className="block text-sm font-medium text-gray-700">Required Documents</label>
              <div className="flex items-center space-x-2">
                <Input 
                  placeholder="e.g. Valid ID" 
                  value={newReq} 
                  onChange={e => setNewReq(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddRequirement())}
                />
                <Button type="button" onClick={handleAddRequirement} variant="secondary">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.requirements?.map((req, i) => (
                  <Badge key={i} className="flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-700">
                    <span>{req}</span>
                    <button type="button" onClick={() => handleRemoveRequirement(i)} className="text-blue-500 hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="ghost" onClick={() => {
                setIsEditing(false);
                setFormData({ name: '', description: '', requirements: [], processingTime: 3, fee: 0, status: 'ACTIVE' });
              }}>Cancel</Button>
              <Button onClick={handleSave}>Save Document Type</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading document types...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {docTypes.map(type => (
            <Card key={type.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{type.name}</CardTitle>
                  <Badge variant={type.status === 'ACTIVE' ? 'success' : 'default'}>{type.status}</Badge>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">{type.description}</p>
              </CardHeader>
              <CardContent className="flex-1 text-sm text-gray-600 space-y-2">
                <div className="flex justify-between">
                  <span>Processing Time:</span>
                  <span className="font-medium text-gray-900">{type.processingTime} days</span>
                </div>
                <div className="flex justify-between">
                  <span>Fee:</span>
                  <span className="font-medium text-gray-900">₱{type.fee}</span>
                </div>
                <div>
                  <span className="block mb-1 font-medium text-gray-900">Requirements:</span>
                  <ul className="list-disc pl-5 space-y-1">
                    {type.requirements?.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <div className="p-4 border-t bg-gray-50 rounded-b-lg flex justify-end space-x-2 mt-auto">
                <Button variant="outline" size="sm" onClick={() => {
                  setFormData(type);
                  setIsEditing(true);
                }}>
                  <Edit2 className="h-4 w-4 mr-1" /> Edit
                </Button>
              </div>
            </Card>
          ))}
          {docTypes.length === 0 && !isEditing && (
             <div className="col-span-full text-center py-12 text-gray-500">
               No document types configured yet.
             </div>
          )}
        </div>
      )}
    </div>
  );
}
