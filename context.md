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
│   ├── ui/            # Componentes reutilizables (Button, Input, Modal...)
│   └── layout/        # Navbar, ProtectedRoute
├── pages/             # Una página = una ruta
├── hooks/             # Custom hooks (useAuth, useTreatments, useServices...)
├── lib/               # supabase.ts — cliente de Supabase
├── context/           # AuthContext.tsx
├── types/             # Tipos TypeScript del proyecto
├── App.tsx
└── main.tsx
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

- **Admin**: ve y modifica todo
- **Empleado**: solo puede ver los registros de los servicios a los que está asignado. No puede crear, editar ni eliminar nada.
- Función auxiliar `is_admin()` disponible en Supabase para las políticas

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
  └── admin  → /admin/dashboard
                ├── /admin/services       (gestión de servicios)
                ├── /admin/users          (gestión de empleados)
                └── /admin/services/:id   (registros de un servicio)

  └── employee → /dashboard
                  └── /services/:id       (registros de sus servicios)
```

---

## Funcionalidades principales

1. **Login** — con email y contraseña (Supabase Auth)
2. **Dashboard empleado** — tarjetas con los servicios asignados. Al hacer clic entra a ver los registros de ese servicio
3. **Vista de registros** — tabla con: fecha, hora, cliente, tratamiento, notas, método de pago, precio
4. **Filtros en tiempo real** — por cliente, fecha, tratamiento, método de pago, precio. Sin recargar la página
5. **CRUD de registros** — solo admin. Formulario modal o inline
6. **CRUD de servicios** — solo admin. Crear, editar, eliminar servicios y asociar empleados
7. **CRUD de usuarios** — solo admin. Crear empleados (nombre, email, contraseña, rol)
8. **Dashboard de estadísticas** — por servicio y mes: total ingresos, sesiones, desglose efectivo/tarjeta, ticket medio
9. **Exportación a Excel** — con SheetJS (xlsx). Tres hojas: registros, resumen mensual, desglose por método de pago. Mismo formato que el archivo de referencia adjunto al proyecto

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

---

_Última actualización: inicio del proyecto — sesión de planificación completa_
