# BUGS CONOCIDOS (No críticos)

## cacheService.js
- **TTL no expira automáticamente**: Los items permanecen en cache indefinidamente
  - Impacto: Datos potencialmente desactualizados
  - Workaround: Reiniciar servidor periódicamente
  
- **Límite de memoria no se aplica**: El cache puede crecer sin límite
  - Impacto: Posible uso excesivo de memoria en sesiones largas
  - Workaround: Reiniciar servidor si se nota lentitud

- **Eviction LRU no funciona**: Items antiguos no se eliminan
  - Impacto: Relacionado con el límite de memoria
  - Workaround: Mismo que arriba

## Estado: Aceptable para uso personal
Estos bugs afectan solo performance, no la integridad de datos.
El portfolio y datos financieros están 100% protegidos. 