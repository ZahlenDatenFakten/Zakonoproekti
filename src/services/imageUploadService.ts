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
        const snapshot = await uploadBytes(fileRef, file);
        return await getDownloadURL(snapshot.ref);
      } catch (err: any) {
        console.error('Firebase storage upload failed:', err);
        throw new Error('Ошибка загрузки в Firebase Storage: ' + (err.message || 'Проверьте правила доступа (Rules).'));
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
        const { error } = await supabase.storage
          .from('uploads') // Ensure you have a public 'uploads' bucket in Supabase!
          .upload(`public/${uniqueName}`, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('uploads')
          .getPublicUrl(`public/${uniqueName}`);
          
        return publicUrl;
      } catch (err: any) {
        console.error('Supabase storage upload failed:', err);
        throw new Error('Ошибка загрузки в Supabase Storage: ' + (err.message || 'Убедитесь, что бакет "uploads" существует и является публичным.'));
      }
    }
  }

  // Local fallback (Only works if a Node backend is actually running, fails on Vercel)
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Сервер вернул статус ${response.status}. Возможно, вы запустили сайт на Vercel без Node.js бэкенда? В этом случае для хранения фото укажите Storage Bucket в настройках Firebase, либо используйте свой хостинг с Node.js.`);
    }

    const data = await response.json();
    if (data.success && data.url) {
      return data.url;
    } else {
      throw new Error(data.error || 'Неизвестная ошибка сервера');
    }
  } catch (err: any) {
    console.error('Local upload failed:', err);
    throw new Error(err.message || 'Ошибка загрузки (Если вы на Vercel, вам нужно подключить Firebase/Supabase Storage)');
  }
}
