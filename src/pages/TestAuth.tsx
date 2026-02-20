import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export default function TestAuth() {
  const [result, setResult] = useState<string>('');

  const testConnection = async () => {
    try {
      setResult('Testing connection...');
      
      // Test Supabase connection
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        setResult(`Error: ${error.message}`);
      } else {
        setResult(`Connection OK. Session: ${data.session ? 'Active' : 'None'}`);
      }
    } catch (err: any) {
      setResult(`Connection failed: ${err.message}`);
    }
  };

  const testLogin = async () => {
    try {
      setResult('Testing login...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'Test123!',
      });

      if (error) {
        setResult(`Login error: ${error.message}`);
      } else {
        setResult(`Login success! User: ${data.user?.email}`);
      }
    } catch (err: any) {
      setResult(`Login failed: ${err.message}`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Supabase Auth Test</h1>
      
      <div className="space-y-4">
        <Button onClick={testConnection}>Test Connection</Button>
        <Button onClick={testLogin}>Test Login</Button>
        
        <div className="p-4 bg-gray-100 rounded">
          <pre>{result}</pre>
        </div>
      </div>
    </div>
  );
}