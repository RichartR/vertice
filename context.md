# Vértice — Contexto del proyecto

## Qué es este proyecto

Aplicación web para un **centro deportivo multidisciplinar** que ofrece servicios como podología, fisioterapia, estética, entre otros. La app permite registrar y consultar los tratamientos/sesiones realizados por cada empleado en cada servicio.

No es una app de podología. La podología es solo uno de los servicios del centro.

---

## Stack tecnológico

| Capa              | Tecnología                                     | Motivo                                                |
| ----------------- | ---------------------------------------------- | ----------------------------------------------------- |
| Frontend          | React + Vite + TypeScript                      | Proyecto de aprendizaje de React viniendo de Angular  |
| Base de datos     | Supabase (PostgreSQL)                          | BaaS gratuito, RLS nativo, auth integrado             |
| Deploy            | Vercel                                         | Optimizado para frontends estáticos, CI/CD automático |
| Gestión de tareas | Jira (proyecto: VER en richartr.atlassian.net) | Backlog completo con todas las tareas                 |

**No hay backend propio.** React se comunica directamente con Supabase. No existe Laravel, Express ni ningún servidor intermedio.

---

## Decisiones de arquitectura tomadas

- **Sin backend propio**: Supabase actúa como backend (API REST automática + Auth + RLS)
- **Seguridad por RLS**: Las restricciones de acceso se gestionan en la base de datos con Row Level Security, no en el frontend
- **Sin two-way binding**: Usar controlled components de React (value + onChange), no librerías de formularios complejas
- **Custom hooks para lógica**: La lógica de fetching y estado va en hooks (`useTreatments`, `useServices`...), no directamente en los componentes
- **AuthContext global**: La sesión y el perfil del usuario se comparten con Context API, no con librerías externas de estado
- **TypeScript estricto**: Aprovechar los tipos autogenerados por Supabase para las tablas

---

## Estructura de carpetas acordada

```
src/
├── components/
│   ├── ui/            # Componentes reutilizables (Button, Input, Modal, FilterBar...)
│   └── layout/        # Navbar, ProtectedRoute
├── pages/
│   ├── admin/         # AdminServicesPage, AdminUsersPage
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── ServicePage.tsx
│   └── AccesoDenegadoPage.tsx
├── hooks/             # useAuth, useRecords, useServices, useStats, useFilteredRecords
├── lib/               # supabase.ts — cliente de Supabase
├── context/           # AuthContext.tsx (expone: user, profile, loading, isAdmin, isActive)
├── utils/             # exportExcel.ts
├── types/             # Tipos TypeScript del proyecto
├── App.tsx
└── main.tsx

supabase/
└── functions/
    └── create-user/   # Edge Function para crear usuarios (deploy en VER-21)
```

---

## Esquema de base de datos

### Tablas

**`profiles`** — extiende auth.users de Supabase

- `id` UUID PK → referencia a auth.users
- `nombre` TEXT
- `email` TEXT
- `rol` TEXT → 'admin' | 'employee'
- `activo` BOOLEAN

**`services`** — servicios del centro (podología, fisioterapia, estética...)

- `id` UUID PK
- `nombre` TEXT
- `descripcion` TEXT
- `activo` BOOLEAN

**`service_employees`** — relación N:M entre servicios y empleados

- `service_id` UUID FK → services
- `employee_id` UUID FK → profiles
- UNIQUE(service_id, employee_id)

**`records`** — cada sesión/tratamiento registrado

- `id` UUID PK
- `service_id` UUID FK → services
- `employee_id` UUID FK → profiles (ON DELETE SET NULL)
- `fecha` DATE
- `hora` TIME
- `cliente` TEXT
- `tratamiento` TEXT
- `notas` TEXT (opcional)
- `metodo_pago` TEXT → 'efectivo' | 'tarjeta'
- `precio` NUMERIC(10,2)

### Seguridad (RLS)

- **Admin**: ve y modifica todo, incluidos servicios inactivos
- **Empleado activo**: solo puede ver los registros de los servicios a los que está asignado. No puede crear, editar ni eliminar nada.
- **Empleado desactivado**: no puede ver ningún dato (RLS devuelve vacío)
- Función auxiliar `is_admin()` — comprueba `rol = 'admin'` en profiles
- Función auxiliar `is_active()` — comprueba `activo = true` en profiles
- Los servicios con `activo = false` son invisibles para empleados pero el admin los ve todos

---

## Roles de usuario

| Rol        | Puede hacer                                                |
| ---------- | ---------------------------------------------------------- |
| `admin`    | CRUD completo de servicios, usuarios, registros. Ve todo.  |
| `employee` | Solo lectura. Ve los registros de sus servicios asignados. |

**Los clientes no tienen usuario** — son solo un campo de texto en cada registro.

---

## Flujo de navegación

```
/login
  └── admin              → /dashboard (siempre)
  └── employee (1 svc)   → /services/:id (directo, sin pasar por dashboard)
  └── employee (2+ svc)  → /dashboard (elige servicio)
  └── employee inactivo  → /acceso-denegado

/dashboard
  └── admin    → accesos a /admin/users y /admin/services + lista de servicios
  └── employee → tarjetas con sus servicios asignados

/services/:id            → vista de registros (empleado: solo lectura)
/admin/services/:id      → vista de registros (admin: puede editar/eliminar)
/admin/users             → gestión de empleados (solo admin)
/admin/services          → gestión de servicios (solo admin)
/acceso-denegado         → pantalla para empleados desactivados
```

---

## Funcionalidades principales

1. **Login** — con email y contraseña. Sesión persistente (localStorage). Redirección inteligente según rol y número de servicios asignados
2. **Dashboard empleado** — tarjetas con los servicios asignados. Si solo tiene 1 servicio va directo sin pasar por el dashboard
3. **Vista de registros** — tabla con: fecha, hora, cliente, tratamiento, notas, método de pago, precio. Columna empleado solo visible para admin
4. **Filtros en tiempo real** — aplicados en frontend sobre datos ya cargados (sin nuevas llamadas a Supabase): cliente, rango fechas, tratamiento, método de pago, rango precio
5. **CRUD de registros** — solo admin. Formulario en **modal** sobre la tabla. Fecha por defecto = hoy
6. **CRUD de servicios** — solo admin. Eliminación **lógica** (`activo = false`), nunca física. Los registros se conservan. Asociación de empleados desde el formulario del servicio
7. **CRUD de usuarios** — solo admin. Creación via **Edge Function** `create-user` (inviteUserByEmail). El empleado recibe email para establecer su contraseña. Asociación de servicios desde el formulario del empleado
8. **Dashboard de estadísticas** — visible para admin y empleados (cada uno ve solo sus servicios). Métricas por mes: total ingresos, sesiones, desglose efectivo/tarjeta, ticket medio. Tabla resumen anual. Integrado en la vista del servicio como pestaña/sección
9. **Exportación a Excel** — disponible desde la vista de registros (exporta registros filtrados) y desde el dashboard de estadísticas (exporta el mes seleccionado). 3 hojas: Registro, Resumen Mensual, Método de Pago

---

## Referencia Excel

El cliente usa actualmente un Excel con tres hojas:

- **📋 Registro**: fecha, día, hora, cliente, tratamiento, método de pago, precio
- **📊 Resumen Mensual**: totales por mes (ingresos, sesiones, ticket medio, desglose efectivo/tarjeta)
- **💳 Método de Pago**: desglose global por forma de cobro

La exportación a Excel debe replicar exactamente este formato.

---

## Contexto de aprendizaje

El desarrollador viene de **Angular y JavaScript** y está aprendiendo React con este proyecto. Esto implica:

- Escribir el código de forma **didáctica y clara** — evitar patrones avanzados innecesarios
- **Comentar el código** cuando se usen conceptos nuevos de React
- Preferir **soluciones simples** sobre soluciones elegantes cuando ambas funcionen
- Explicar brevemente las decisiones cuando se aparten de lo habitual
- Señalar las diferencias con Angular cuando sea relevante (ej: controlled inputs vs ngModel)

---

## Tareas en Jira

Proyecto: **VER** en `richartr.atlassian.net`

Orden de ejecución:

1. VER-10 → VER-13: Base de datos (Supabase) ← **SQL completo en VER-10**
2. VER-14 → VER-16: Diseño y prototipo (validar con cliente antes de codear)
3. VER-17 → VER-20: Setup React + autenticación
4. VER-21 → VER-22: Gestión de usuarios
5. VER-23 → VER-24: Gestión de servicios + dashboard empleado
6. VER-25 → VER-26: Registros por servicio
7. VER-27: Filtros
8. VER-28 → VER-29: Dashboard estadísticas + exportación Excel
9. VER-30 → VER-31: Deploy en Vercel + dominio

**Antes de empezar cualquier tarea**, consultar su descripción en Jira — contiene el detalle técnico y el SQL cuando aplica.

---

## Variables de entorno necesarias

```env
VITE_SUPABASE_URL=https://[proyecto].supabase.co
VITE_SUPABASE_ANON_KEY=[clave_anonima]
```

Nunca commitear el archivo `.env` — está en `.gitignore`.

---

## Diseño visual

- **Nombre de la app/centro**: Vértice
- **Estilo**: Profesional y minimalista
- **Paleta de colores**: Blancos y grises como base. Color corporativo: `#b9d9ce` (verde menta suave) como color de acento
- **Tipografía**: Sin definir — elegir una tipografía sans-serif limpia y profesional
- **Modo**: Light mode (no dark mode)
- **Logo**: `src/assets/logo.webp` — usar en navbar, pantalla de login y cualquier cabecera

## Despliegue

- **Plataforma**: Vercel (repositorio privado en GitHub, acceso concedido solo a Vercel)
- **URL**: Se usará la URL por defecto que proporciona Vercel (sin dominio personalizado de momento)
- **VER-31 (dominio + DNS)**: Descartada por ahora, se retomará si el cliente decide adquirir un dominio en el futuro

---

## Estrategia de ramas (Git Flow simplificado)

```
main        → código estable, desplegado en producción (Vercel)
develop     → desarrollo activo, pruebas y nuevas funcionalidades
feature/*   → una rama por cada tarea de Jira
```

### Flujo de trabajo

1. Crear rama desde `develop` con la clave de la tarea de Jira
2. Desarrollar y testear en la rama de feature
3. Merge a `develop` cuando funcione
4. Merge a `main` cuando `develop` esté estable → Vercel despliega automáticamente

### Convención de nombres de ramas

```bash
feature/VER-18-auth-context
feature/VER-19-login-page
feature/VER-25-tabla-registros
```

Formato: `feature/[clave-jira]-[descripcion-corta]`

### Ramas en Vercel

- `main` → `tudominio.es` (producción, lo que ve el cliente)
- `develop` → preview automático en Vercel para pruebas

**Regla importante**: nunca commitear directamente en `main`. Todo pasa por `develop` primero.

---

## Convenciones de código

- Componentes en **PascalCase**: `ServiceCard.tsx`
- Hooks en **camelCase** con prefijo use: `useServices.ts`
- Páginas con sufijo Page: `LoginPage.tsx`, `DashboardPage.tsx`
- Tipos en `src/types/index.ts`
- Una carpeta por feature cuando crezca: `src/features/services/`

## Decisiones de negocio tomadas

- **Eliminación de servicios**: lógica (`activo = false`), nunca física. Los registros históricos se conservan siempre
- **Eliminación de empleados**: desactivación (`activo = false`), nunca borrado físico
- **Creación de usuarios**: el admin invita al empleado por email. El empleado establece su propia contraseña en el primer acceso. El admin nunca conoce la contraseña
- **Nombre en profiles**: almacena nombre + apellidos concatenados (ej: "Ana García López"). El formulario los recoge por separado
- **Asociación empleado-servicio**: se gestiona desde el formulario del servicio Y desde el formulario del empleado
- **Estadísticas**: visibles para admin y empleados (cada uno solo ve sus servicios asignados). Integradas en la vista del servicio, no en página separada
- **Exportación Excel**: disponible desde dos sitios — vista de registros (exporta filtrados) y dashboard estadísticas (exporta mes seleccionado)
- **Formulario de registros**: modal sobre la tabla, no página separada

---

## Edge Functions

| Función       | Ruta                                      | Deploy    | Propósito                                                 |
| ------------- | ----------------------------------------- | --------- | --------------------------------------------------------- |
| `create-user` | `supabase/functions/create-user/index.ts` | En VER-21 | Crear usuarios via Admin API sin exponer service_role key |

Secret necesario: `SUPABASE_SERVICE_ROLE_KEY` en Supabase → Settings → Edge Functions → Secrets

---

_Última actualización: sesión de planificación y primeras tareas ejecutadas (VER-12, VER-13)_
