-- ============================================
-- STORAGE SETUP: Buckets + RLS Policies
-- ============================================
-- Configuración de almacenamiento para el boilerplate SaaS
-- Crea buckets públicos y privados con políticas de seguridad

-- ============================================
-- 1. BUCKET: avatars (PÚBLICO)
-- ============================================
-- Para fotos de perfil de usuario
-- Límites: 2MB por archivo, solo imágenes

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Bucket público para que las fotos sean accesibles
  2097152, -- 2MB en bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- ============================================
-- 2. BUCKET: documents (PRIVADO)
-- ============================================
-- Para documentos de usuario (PDFs, Word, Excel)
-- Límites: 10MB por archivo

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false, -- Bucket privado, acceso controlado por RLS
  10485760, -- 10MB en bytes
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760;

-- ============================================
-- 3. BUCKET: uploads (PRIVADO)
-- ============================================
-- Para archivos generales del usuario
-- Límites: 50MB por archivo, todos los formatos

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'uploads',
  'uploads',
  false, -- Bucket privado
  52428800 -- 50MB en bytes
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- ============================================
-- 4. RLS POLICIES: avatars
-- ============================================

-- Policy: Todos pueden ver avatares (bucket público)
CREATE POLICY "Public avatars are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Policy: Usuarios autenticados pueden subir su propio avatar
-- La estructura de carpetas es: avatars/{user_id}/avatar.jpg
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Usuarios pueden actualizar su propio avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Usuarios pueden eliminar su propio avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- 5. RLS POLICIES: documents
-- ============================================

-- Policy: Usuarios solo pueden ver sus propios documentos
-- Estructura: documents/{user_id}/filename.pdf
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Usuarios pueden subir documentos a su carpeta
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Usuarios pueden actualizar sus documentos
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Usuarios pueden eliminar sus documentos
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- 6. RLS POLICIES: uploads
-- ============================================

-- Policy: Usuarios solo pueden ver sus propios uploads
-- Estructura: uploads/{user_id}/filename.ext
CREATE POLICY "Users can view their own uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Usuarios pueden subir archivos a su carpeta
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Usuarios pueden actualizar sus uploads
CREATE POLICY "Users can update their own uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Usuarios pueden eliminar sus uploads
CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- 7. ADMIN ACCESS (Opcional)
-- ============================================
-- Crear policies para que admins puedan acceder a todo

-- Policy: Admins pueden ver todos los archivos
CREATE POLICY "Admins can view all files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Admins pueden eliminar cualquier archivo
CREATE POLICY "Admins can delete any file"
ON storage.objects FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- 8. HELPER FUNCTION: Get Storage Usage
-- ============================================
-- Función para obtener el espacio usado por un usuario

CREATE OR REPLACE FUNCTION get_user_storage_usage(user_id UUID)
RETURNS TABLE (
  bucket_name TEXT,
  file_count BIGINT,
  total_bytes BIGINT,
  total_mb NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bucket_id AS bucket_name,
    COUNT(*)::BIGINT AS file_count,
    SUM(COALESCE(metadata->>'size', '0')::BIGINT) AS total_bytes,
    ROUND(
      SUM(COALESCE(metadata->>'size', '0')::BIGINT) / 1048576.0,
      2
    ) AS total_mb
  FROM storage.objects
  WHERE (storage.foldername(name))[1] = user_id::text
  GROUP BY bucket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. TRIGGER: Update profile avatar_url
-- ============================================
-- Cuando se sube un avatar, actualizar automáticamente profiles.avatar_url

CREATE OR REPLACE FUNCTION update_profile_avatar_url()
RETURNS TRIGGER AS $$
DECLARE
  user_id UUID;
  public_url TEXT;
BEGIN
  -- Extraer user_id del path (avatars/{user_id}/filename)
  user_id := (storage.foldername(NEW.name))[1]::UUID;

  -- Generar URL pública del avatar
  public_url := (
    SELECT
      CASE
        WHEN bucket.public THEN
          current_setting('app.settings.supabase_url', true) ||
          '/storage/v1/object/public/' ||
          NEW.bucket_id || '/' ||
          NEW.name
        ELSE NULL
      END
    FROM storage.buckets bucket
    WHERE bucket.id = NEW.bucket_id
  );

  -- Actualizar profile solo si el archivo está en bucket avatars
  IF NEW.bucket_id = 'avatars' AND public_url IS NOT NULL THEN
    UPDATE profiles
    SET
      avatar_url = public_url,
      updated_at = NOW()
    WHERE id = user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger
DROP TRIGGER IF EXISTS on_avatar_upload ON storage.objects;
CREATE TRIGGER on_avatar_upload
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'avatars')
  EXECUTE FUNCTION update_profile_avatar_url();

-- ============================================
-- COMENTARIOS FINALES
-- ============================================
-- Esta migration configura:
-- ✅ 3 buckets (avatars público, documents y uploads privados)
-- ✅ RLS policies para cada bucket (user isolation)
-- ✅ Admin access policies
-- ✅ Helper function para ver storage usage
-- ✅ Trigger para auto-actualizar avatar_url en profiles
--
-- Estructura de carpetas:
-- avatars/{user_id}/avatar.jpg
-- documents/{user_id}/invoice.pdf
-- uploads/{user_id}/file.zip
--
-- Para aplicar:
-- supabase db push
