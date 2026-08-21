import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { FileText } from 'lucide-react';
import { User, Role } from '../../types';
import { useAuth } from '../../context/AuthContext';

export function Register() {
  const [formData, setFormData] = useState({
    role: 'STUDENT' as Role,
    studentId: '',
    course: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUserData } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.role === 'STUDENT' && (!formData.studentId || !formData.course)) {
      setError('Student ID and Course are required for students.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const userCredential = await signInWithPopup(auth, provider);
      
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        setError('An account with this email already exists. Please log in.');
        setLoading(false);
        return;
      }

      const newUser: User = {
        uid: userCredential.user.uid,
        email: userCredential.user.email || '',
        fullName: userCredential.user.displayName || 'Unknown User',
        role: formData.role,
        status: 'ACTIVE',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      if (formData.role === 'STUDENT') {
        newUser.studentId = formData.studentId;
        newUser.course = formData.course;
      }

      await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
      await refreshUserData();
      
      navigate(formData.role === 'STUDENT' ? '/student' : formData.role === 'STAFF' ? '/staff' : '/admin');
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Failed to register with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 items-center text-center">
          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Create an Account</CardTitle>
          <CardDescription>Register for the School Document System</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm font-medium">
                {error}
              </div>
            )}
            
            <Select
              label="Account Type"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
              options={[
                { label: 'Student', value: 'STUDENT' },
                { label: 'Staff / Registrar', value: 'STAFF' },
                { label: 'Administrator', value: 'ADMIN' },
              ]}
              required
            />
            
            {formData.role === 'STUDENT' && (
              <>
                <Input
                  label="Student ID"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  required
                />
                <Input
                  label="Course / Program"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  required
                />
              </>
            )}

            <Button type="submit" className="w-full" isLoading={loading}>
              Sign Up with Google
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center text-sm">
          <p className="text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
