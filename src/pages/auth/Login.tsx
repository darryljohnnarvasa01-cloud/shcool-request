import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUserData } = useAuth();

  const handleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const userCredential = await signInWithPopup(auth, provider);
      
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (!userDoc.exists()) {
        await signOut(auth);
        setError('Account not found. Please register first.');
        setLoading(false);
        return;
      }
      
      await refreshUserData();
      const role = userDoc.data().role;
      navigate(role === 'STUDENT' ? '/student' : role === 'STAFF' ? '/staff' : '/admin');
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Failed to login');
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
          <CardTitle className="text-2xl font-bold tracking-tight">School Document System</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm font-medium">
                {error}
              </div>
            )}
            <Button onClick={handleLogin} className="w-full" isLoading={loading}>
              Sign In with Google
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center text-sm">
          <p className="text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 font-medium hover:underline">
              Register here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
