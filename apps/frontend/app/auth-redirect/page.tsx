'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

export default function AuthRedirectPage() {
  useEffect(() => {
    console.log('🔴 AuthRedirectPage mounted');
    
    // Check multiple sources for auth state
    const storeUser = useAuthStore.getState().user;
    console.log('Store user:', storeUser);
    
    const sessionAuth = sessionStorage.getItem('auth-success');
    const sessionRole = sessionStorage.getItem('user-role');
    console.log('Session auth:', { sessionAuth, sessionRole });
    
    const localAuth = localStorage.getItem('auth-storage');
    console.log('Local storage:', localAuth);
    
    // Try to get user from store first
    if (storeUser) {
      console.log('✅ Found user in store');
      const userRole = storeUser.role;
      
      if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'HOSPITAL_ADMIN') {
        console.log('✅ Redirecting to /admin');
        window.location.replace('/admin');
        return;
      }
    }
    
    // Check session storage as backup
    if (sessionAuth === 'true' && sessionRole) {
      console.log('✅ Found auth in sessionStorage');
      
      if (sessionRole === 'SUPER_ADMIN' || sessionRole === 'ADMIN' || sessionRole === 'HOSPITAL_ADMIN') {
        console.log('✅ Redirecting to /admin from session');
        window.location.replace('/admin');
        return;
      }
    }
    
    // If no auth found, redirect to sign-in
    console.log('❌ No auth found, redirecting to sign-in');
    window.location.replace('/sign-in');
    
    // Final fallback - meta refresh
    const meta = document.createElement('meta');
    meta.httpEquiv = 'refresh';
    meta.content = '0; url=/sign-in';
    document.getElementsByTagName('head')[0].appendChild(meta);
  }, []);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Redirecting...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Please wait while we redirect you</p>
      </div>
    </div>
  );
}
