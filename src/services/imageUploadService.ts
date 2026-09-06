import { getFirebaseApp, getStoredFirebaseConfig } from './firebaseClient';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getSupabaseClient, getStoredDbConfig as getSupabaseConfig } from './supabaseClient';

export async function uploadImage(file: File): Promise<string> {
  const fbConfig = getStoredFirebaseConfig();

  // 1. Check ImgBB First (Alternative fallback to bypass Firebase Storage completely)
  if (fbConfig.imgbbApiKey) {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${fbConfig.imgbbApiKey}`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success && data.data && data.data.url) {
        return data.data.url;
      }
      throw new Error(data.error?.message || 'Неизвестная ошибка ImgBB');
    } catch (err: any) {
      console.error('ImgBB upload failed:', err);
      throw new Error('Ошибка ImgBB: ' + err.message);
    }
  }

  // 2. Check Firebase Storage
  if (fbConfig.isConnected && fbConfig.storageBucket) {
    const app = getFirebaseApp();
    if (app) {
      const storage = getStorage(app);
      const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + '-' + file.name;
      const fileRef = storageRef(storage, `uploads/${uniqueName}`);
      try {
        const snapshot = await Promise.race([
          uploadBytes(fileRef, file),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase timeout (CORS)')), 6000))
        ]) as any;
        return await getDownloadURL(snapshot.ref);
      } catch (err: any) {
        console.warn('Firebase storage upload failed (falling back):', err);
        // Do not throw! Let it fall through to Supabase/Base64
      }
    }
  }

  // Check Supabase
  const sbConfig = getSupabaseConfig();
  if (sbConfig.isConnected) {
    const supabase = getSupabaseClient();
    if (supabase) {
      const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + '-' + file.name;
      try {
        const { error } = await Promise.race([
          supabase.storage
            .from('uploads')
            .upload(`public/${uniqueName}`, file, {
              cacheControl: '3600',
              upsert: false
            }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase timeout')), 6000))
        ]) as any;
          
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('uploads')
          .getPublicUrl(`public/${uniqueName}`);
          
        return publicUrl;
      } catch (err: any) {
        console.warn('Supabase storage upload failed (falling back):', err);
        // Do not throw! Let it fall through to Base64
      }
    }
  }

  
  // Local Express fallback (saves to local /uploads folder via server.js)
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    if (data.success && data.url) {
      return data.url;
    } else {
      throw new Error(data.error || 'Server error');
    }
  } catch (err: any) {
    console.error('Local express upload failed, falling back to base64:', err);
    
    // Absolute last resort: Base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file.'));
    });
  }
}
