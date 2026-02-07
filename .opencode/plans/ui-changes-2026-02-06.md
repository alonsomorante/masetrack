# Cambios de UI - Masetrack

Fecha: 2026-02-06

## 1. Remover Sección de Especificaciones de Homepage

**Archivo:** `src/app/page.tsx`

**Líneas a eliminar:** 111-133 (la sección completa de ESPECIFICACIONES)

**Código a eliminar:**
```tsx
            {/* STATS PANEL */}
            <div className="tech-panel p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-[var(--accent)]" />
                <span className="font-mono text-xs text-[var(--accent)] uppercase tracking-wider">ESPECIFICACIONES</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'REGISTRO', value: 'SMS/WEB', status: 'ACTIVE' },
                  { label: 'VISUALIZACIÓN', value: 'GRÁFICOS', status: 'ACTIVE' },
                  { label: 'CATÁLOGO', value: 'EJERCICIOS', status: 'ACTIVE' },
                  { label: 'PERSONALIZACIÓN', value: 'CUSTOM', status: 'ACTIVE' },
                ].map((item, i) => (
                  <div key={i} className="tech-panel-inset p-3">
                    <div className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">{item.label}</div>
                    <div className="font-display text-sm text-[var(--text-primary)]">{item.value}</div>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="status-indicator status-active"></span>
                      <span className="font-mono text-[10px] text-[var(--success)]">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
```

**Resultado:** Solo quedará el módulo de registro en el lado izquierdo.

---

## 2. Remover Botón de Configuración del Sidebar

**Archivo:** `src/components/layout/Sidebar.tsx`

**Líneas a eliminar:** 145-148

**Código a eliminar:**
```tsx
            <button className="w-full flex items-center gap-3 px-3 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)] transition-colors">
              <Settings className="w-4 h-4" />
              <span className="font-mono text-xs uppercase tracking-wider">CONFIGURACIÓN</span>
            </button>
```

**Nota:** También se puede eliminar el import de Settings si ya no se usa en otro lado:
```typescript
import { Settings } from 'lucide-react'
```

**Resultado:** Solo quedará el botón de "CERRAR SESIÓN" en el footer del sidebar.

---

## Resumen de cambios

1. **page.tsx**: Eliminar 23 líneas (sección de especificaciones)
2. **Sidebar.tsx**: Eliminar 4 líneas (botón configuración) + posible import

**Nota:** Estos son cambios simples de UI que no afectan la funcionalidad.
