/**
 * Hook personalizado para manejar actualizaciones en tiempo real
 * Gestiona el intervalo de actualización, animaciones de precio y pausar en hover
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export const useRealtimeUpdates = (refreshCallback, interval = 1000) => {
  const [isHovering, setIsHovering] = useState(false);
  const [priceChanges, setPriceChanges] = useState({});
  const animationTimeoutRef = useRef(null);

  /**
   * Maneja los cambios de precio con animaciones
   * @param {Object} newChanges - Objeto con los cambios de precio por símbolo
   */
  const handlePriceChanges = useCallback((newChanges) => {
    if (Object.keys(newChanges).length > 0) {
      setPriceChanges(newChanges);
      
      // Limpiar timeout anterior si existe
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      
      // Limpiar animaciones después de 700ms
      animationTimeoutRef.current = setTimeout(() => {
        setPriceChanges({});
      }, 700);
    }
  }, []);

  /**
   * Ejecuta la actualización y maneja las animaciones
   */
  const performUpdate = useCallback(async () => {
    const result = await refreshCallback(false);
    if (result && result.priceChanges) {
      handlePriceChanges(result.priceChanges);
    }
  }, [refreshCallback, handlePriceChanges]);

  /**
   * Hook para manejar el intervalo de actualización en tiempo real
   */
  useEffect(() => {
    // Solo actualizar si no está en hover y la pestaña está visible
    const shouldUpdate = !isHovering && document.visibilityState === 'visible';
    
    if (!shouldUpdate) {
      return;
    }

    // Configurar intervalo
    const intervalId = setInterval(() => {
      // Doble verificación dentro del intervalo
      if (!isHovering && document.visibilityState === 'visible') {
        performUpdate();
      }
    }, interval); // ✅ TIEMPO REAL: 1 segundo - Terminal Profesional

    // Cleanup
    return () => {
      clearInterval(intervalId);
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [isHovering, interval, performUpdate]); // Dependencias correctas

  /**
   * Hook para manejar cambios de visibilidad de la pestaña
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isHovering) {
        // Actualizar inmediatamente al volver a la pestaña
        performUpdate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isHovering, performUpdate]);

  /**
   * Limpia timeouts al desmontar
   */
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  return {
    isHovering,
    setIsHovering,
    priceChanges
  };
}; 