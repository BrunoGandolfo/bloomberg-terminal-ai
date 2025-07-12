/**
 * ===================================================================
 * CACHE SERVICE - Terminal Financiera Power IA
 * ===================================================================
 * Sistema centralizado de cache con namespaces, TTL configurable,
 * límites de memoria, estadísticas y limpieza automática.
 * 
 * Features:
 * - Namespaces independientes con configuración propia
 * - TTL configurable por namespace o por entrada
 * - Límites de memoria con políticas de evicción LRU
 * - Estadísticas detalladas de uso
 * - Limpieza automática configurable
 * - Eventos y callbacks
 * - Método getOrSet() para simplificar uso
 * 
 * @module CacheService
 * @author Terminal Financiera Power IA Team
 * ===================================================================
 */

const EventEmitter = require('events');
const logger = require('../utils/logger');

/**
 * Configuración por defecto para namespaces
 */
const DEFAULT_CONFIG = {
  ttl: 5 * 60 * 1000,           // 5 minutos
  maxSize: 1000,                // máximo 1000 entradas
  maxMemory: 50 * 1024 * 1024,  // 50MB máximo
  cleanupInterval: 10 * 60 * 1000, // limpieza cada 10 minutos
  evictionPolicy: 'lru',        // least recently used
  onEvict: null,                // callback al eliminar
  onExpire: null,               // callback al expirar
  enableStats: true             // habilitar estadísticas
};

/**
 * Clase para gestionar un namespace de cache
 */
class CacheNamespace extends EventEmitter {
  constructor(name, config = {}) {
    super();
    this.name = name;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new Map();
    this.accessOrder = new Map(); // para LRU
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      expirations: 0,
      memoryUsed: 0,
      startTime: Date.now()
    };
    
    // Iniciar limpieza automática si está configurada
    if (this.config.cleanupInterval > 0) {
      this.startCleanup();
    }
    
    logger.info(`📦 Cache namespace '${name}' creado con TTL=${this.config.ttl}ms, maxSize=${this.config.maxSize}`);
  }
  
  /**
   * Obtener valor del cache
   * @param {string} key - Clave a buscar
   * @returns {*} Valor almacenado o undefined
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return undefined;
    }
    
    // Verificar si expiró
    if (this.isExpired(entry)) {
      this.delete(key, 'expired');
      this.stats.misses++;
      this.stats.expirations++;
      return undefined;
    }
    
    // Actualizar orden de acceso (LRU)
    this.accessOrder.set(key, Date.now());
    this.stats.hits++;
    
    return entry.value;
  }
  
  /**
   * Establecer valor en cache
   * @param {string} key - Clave
   * @param {*} value - Valor a almacenar
   * @param {number} customTTL - TTL personalizado (opcional)
   * @returns {boolean} true si se almacenó correctamente
   */
  set(key, value, customTTL = null) {
    // Verificar límites antes de agregar
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }
    
    // Calcular tamaño aproximado del valor
    const size = this.calculateSize(value);
    
    // Verificar límite de memoria
    if (this.stats.memoryUsed + size > this.config.maxMemory) {
      this.evictUntilMemoryAvailable(size);
    }
    
    const ttl = customTTL || this.config.ttl;
    const entry = {
      value,
      expires: Date.now() + ttl,
      size,
      created: Date.now()
    };
    
    // Si ya existe, actualizar memoria
    const existing = this.cache.get(key);
    if (existing) {
      this.stats.memoryUsed -= existing.size;
    }
    
    this.cache.set(key, entry);
    this.accessOrder.set(key, Date.now());
    this.stats.sets++;
    this.stats.memoryUsed += size;
    
    this.emit('set', { key, value, ttl });
    return true;
  }
  
  /**
   * Verificar si una clave existe y no ha expirado
   * @param {string} key - Clave a verificar
   * @returns {boolean}
   */
  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (this.isExpired(entry)) {
      this.delete(key, 'expired');
      return false;
    }
    
    return true;
  }
  
  /**
   * Eliminar entrada del cache
   * @param {string} key - Clave a eliminar
   * @param {string} reason - Razón de eliminación
   * @returns {boolean} true si se eliminó
   */
  delete(key, reason = 'manual') {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    this.cache.delete(key);
    this.accessOrder.delete(key);
    this.stats.deletes++;
    this.stats.memoryUsed -= entry.size;
    
    // Llamar callback si existe
    if (reason === 'evicted' && this.config.onEvict) {
      this.config.onEvict(key, entry.value);
    } else if (reason === 'expired' && this.config.onExpire) {
      this.config.onExpire(key, entry.value);
    }
    
    this.emit('delete', { key, reason });
    return true;
  }
  
  /**
   * Limpiar todo el namespace
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.accessOrder.clear();
    this.stats.memoryUsed = 0;
    this.emit('clear', { entriesCleared: size });
    logger.info(`🧹 Cache namespace '${this.name}' limpiado (${size} entradas)`);
  }
  
  /**
   * Obtener o establecer valor (helper method)
   * @param {string} key - Clave
   * @param {Function} factory - Función para generar el valor si no existe
   * @param {number} customTTL - TTL personalizado
   * @returns {Promise<*>} Valor del cache o generado
   */
  async getOrSet(key, factory, customTTL = null) {
    // Intentar obtener del cache
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }
    
    // Generar nuevo valor
    try {
      const value = await factory();
      this.set(key, value, customTTL);
      return value;
    } catch (error) {
      logger.error(`Error en factory para key '${key}':`, error);
      throw error;
    }
  }
  
  /**
   * Obtener estadísticas del namespace
   * @returns {Object} Estadísticas detalladas
   */
  getStats() {
    const uptime = Date.now() - this.stats.startTime;
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;
    
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: `${hitRate}%`,
      uptime: `${Math.floor(uptime / 1000)}s`,
      memoryUsedMB: (this.stats.memoryUsed / 1024 / 1024).toFixed(2)
    };
  }
  
  /**
   * Verificar si una entrada ha expirado
   * @private
   */
  isExpired(entry) {
    return Date.now() > entry.expires;
  }
  
  /**
   * Calcular tamaño aproximado de un valor
   * @private
   */
  calculateSize(value) {
    // Estimación simple basada en JSON
    try {
      return JSON.stringify(value).length * 2; // *2 por caracteres unicode
    } catch {
      return 1024; // 1KB por defecto si no se puede serializar
    }
  }
  
  /**
   * Evicción LRU (Least Recently Used)
   * @private
   */
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, time] of this.accessOrder) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.delete(oldestKey, 'evicted');
      this.stats.evictions++;
      logger.debug(`🗑️ Evicted LRU key '${oldestKey}' from namespace '${this.name}'`);
    }
  }
  
  /**
   * Evicción hasta tener memoria disponible
   * @private
   */
  evictUntilMemoryAvailable(requiredSize) {
    const entries = Array.from(this.accessOrder.entries())
      .sort((a, b) => a[1] - b[1]); // ordenar por tiempo de acceso
    
    for (const [key] of entries) {
      if (this.stats.memoryUsed + requiredSize <= this.config.maxMemory) {
        break;
      }
      this.delete(key, 'evicted');
      this.stats.evictions++;
    }
  }
  
  /**
   * Iniciar limpieza automática
   * @private
   */
  startCleanup() {
    this.cleanupTimer = setInterval(() => {
      let cleaned = 0;
      const now = Date.now();
      
      for (const [key, entry] of this.cache) {
        if (now > entry.expires) {
          this.delete(key, 'expired');
          cleaned++;
        }
      }
      
      if (cleaned > 0) {
        logger.debug(`🧹 Limpieza automática en '${this.name}': ${cleaned} entradas expiradas`);
      }
    }, this.config.cleanupInterval);
    
    // Asegurar que el timer no mantenga el proceso activo
    this.cleanupTimer.unref();
  }
  
  /**
   * Detener limpieza automática
   */
  stopCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
  
  /**
   * Destruir namespace
   */
  destroy() {
    this.stopCleanup();
    this.clear();
    this.removeAllListeners();
  }
}

/**
 * Servicio principal de Cache
 */
class CacheService {
  constructor() {
    this.namespaces = new Map();
    this.globalStats = {
      namespacesCreated: 0,
      totalOperations: 0
    };
    
    logger.info('🚀 CacheService inicializado');
  }
  
  /**
   * Crear o obtener un namespace
   * @param {string} name - Nombre del namespace
   * @param {Object} config - Configuración opcional
   * @returns {CacheNamespace} Instancia del namespace
   */
  namespace(name, config = {}) {
    if (!this.namespaces.has(name)) {
      const ns = new CacheNamespace(name, config);
      this.namespaces.set(name, ns);
      this.globalStats.namespacesCreated++;
      
      // Escuchar eventos para estadísticas globales
      ns.on('set', () => this.globalStats.totalOperations++);
      ns.on('delete', () => this.globalStats.totalOperations++);
    }
    
    return this.namespaces.get(name);
  }
  
  /**
   * Eliminar un namespace completo
   * @param {string} name - Nombre del namespace
   * @returns {boolean} true si se eliminó
   */
  deleteNamespace(name) {
    const ns = this.namespaces.get(name);
    if (!ns) return false;
    
    ns.destroy();
    this.namespaces.delete(name);
    logger.info(`🗑️ Namespace '${name}' eliminado`);
    return true;
  }
  
  /**
   * Obtener estadísticas globales
   * @returns {Object} Estadísticas de todos los namespaces
   */
  getGlobalStats() {
    const namespaceStats = {};
    let totalMemory = 0;
    let totalEntries = 0;
    
    for (const [name, ns] of this.namespaces) {
      const stats = ns.getStats();
      namespaceStats[name] = stats;
      totalMemory += stats.memoryUsed;
      totalEntries += ns.cache.size;
    }
    
    return {
      ...this.globalStats,
      activeNamespaces: this.namespaces.size,
      totalMemoryMB: (totalMemory / 1024 / 1024).toFixed(2),
      totalEntries,
      namespaces: namespaceStats
    };
  }
  
  /**
   * Limpiar todos los namespaces
   */
  clearAll() {
    for (const [name, ns] of this.namespaces) {
      ns.clear();
    }
    logger.info('🧹 Todos los namespaces limpiados');
  }
  
  /**
   * Destruir el servicio completo
   */
  destroy() {
    for (const [name, ns] of this.namespaces) {
      ns.destroy();
    }
    this.namespaces.clear();
    logger.info('💥 CacheService destruido');
  }
}

// Crear instancia singleton
const cacheService = new CacheService();

// Configuración de TTLs por namespace en milisegundos
const CACHE_CONFIG = {
  quotes: 2 * 60 * 1000,        // 2 minutos para cotizaciones
  fundamentals: 60 * 60 * 1000, // 1 hora para fundamentales
  screeners: 5 * 60 * 1000,     // 5 minutos para screeners
  exchange: 2 * 60 * 60 * 1000, // 2 horas para datos de exchange
  macro: 5 * 60 * 1000,         // 5 minutos para datos macro
  technical: 5 * 60 * 1000      // 5 minutos para indicadores técnicos
};

// Crear namespaces pre-configurados comunes
const preConfiguredNamespaces = {
  // Cache de cotizaciones - corta duración, alto volumen
  quotes: cacheService.namespace('quotes', {
    ttl: 2 * 60 * 1000,      // 2 minutos
    maxSize: 5000,           // muchos símbolos
    cleanupInterval: 60000   // limpiar cada minuto
  }),
  
  // Cache de fundamentales - larga duración
  fundamentals: cacheService.namespace('fundamentals', {
    ttl: 60 * 60 * 1000,     // 1 hora
    maxSize: 500,
    cleanupInterval: 15 * 60 * 1000  // limpiar cada 15 min
  }),
  
  // Cache de screeners - duración media
  screeners: cacheService.namespace('screeners', {
    ttl: 5 * 60 * 1000,      // 5 minutos
    maxSize: 100,
    cleanupInterval: 5 * 60 * 1000
  }),
  
  // Cache de tipos de cambio - larga duración
  exchange: cacheService.namespace('exchange', {
    ttl: 2 * 60 * 60 * 1000, // 2 horas
    maxSize: 50,
    cleanupInterval: 60 * 60 * 1000  // limpiar cada hora
  }),
  
  // Cache de indicadores macro (FRED) - duración media
  macro: cacheService.namespace('macro', {
    ttl: 5 * 60 * 1000,      // 5 minutos
    maxSize: 100,
    cleanupInterval: 10 * 60 * 1000
  }),
  
  // Cache de indicadores técnicos - duración media
  technical: cacheService.namespace('technical', {
    ttl: 5 * 60 * 1000,      // 5 minutos
    maxSize: 200,            // múltiples indicadores por símbolo
    cleanupInterval: 5 * 60 * 1000
  })
};

// Exportar todo lo necesario
module.exports = {
  CacheService,
  CacheNamespace,
  cacheService,
  ...preConfiguredNamespaces,
  
  // Helpers para migración fácil
  createNamespace: (name, config) => cacheService.namespace(name, config),
  getGlobalStats: () => cacheService.getGlobalStats(),
  clearAll: () => cacheService.clearAll()
}; 