import React, { useState, useEffect } from 'react';
import { api, AuthService } from '../../services/api';

interface ProtectedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  fallbackContent?: React.ReactNode;
}

/**
 * Componente de Imagem Protegida que realiza requisições autenticadas via Axios 
 * utilizando o cabeçalho Authorization: Bearer JWT. Gera uma URL local em memória (blob:)
 * garantindo zero vazamento de tokens em URLs públicas e imunidade a bloqueios de Cookies.
 */
export const ProtectedImage: React.FC<ProtectedImageProps> = ({
  src,
  fallbackContent,
  className,
  alt,
  ...props
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    let createdUrl: string | null = null;

    if (!src || !src.trim()) {
      setLoading(false);
      setError(true);
      return;
    }

    if (src.startsWith('data:')) {
      setBlobUrl(src);
      setLoading(false);
      setError(false);
      return;
    }

    const fetchImage = async () => {
      try {
        setLoading(true);
        setError(false);
        const protectedPath = AuthService.getProtectedMediaUrl(src);
        const response = await api.get(protectedPath, { responseType: 'blob' });

        if (isMounted) {
          createdUrl = URL.createObjectURL(response.data);
          setBlobUrl(createdUrl);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [src]);

  if (error || !blobUrl) {
    return <>{fallbackContent || null}</>;
  }

  return (
    <img
      src={blobUrl}
      alt={alt || ''}
      className={className}
      {...props}
    />
  );
};

export default ProtectedImage;
