# Nutrición Manager — Manicomio Gym

App independiente para armar y administrar planes nutricionales: tú (admin) creas cuentas de clientes, armas sus planes comida por comida con macros calculados en vivo, y registras su progreso (peso, % grasa, medidas). Cada cliente entra con su propio usuario y contraseña a ver su plan y su progreso — de solo lectura.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind
- Supabase (Postgres + Auth + Row Level Security)
- Anthropic Claude API — solo para estimar calorías/macros por 100g de un alimento nuevo

## 1. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com) (uno nuevo, separado del de gym-manager).
2. Ve a **SQL Editor** y ejecuta [`sql/schema.sql`](sql/schema.sql).
3. Ve a **Project Settings → API** y copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (sección "secret keys") → `SUPABASE_SERVICE_ROLE_KEY` (nunca la expongas al navegador; solo se usa en el servidor para crear cuentas de clientes).

## 2. Configurar la API de Claude

1. Crea una API key en [console.anthropic.com](https://console.anthropic.com).
2. Ponla en `ANTHROPIC_API_KEY`.

## 3. Variables de entorno

```bash
cp .env.example .env.local
```

Rellena los cuatro valores anteriores en `.env.local`.

## 4. Crear tu cuenta de admin

No hay registro público. La primera cuenta (la tuya, de admin) se crea a mano:

1. En Supabase → **Authentication → Users → Add user**, crea tu usuario (correo + contraseña), marcando el correo como confirmado.
2. En **SQL Editor**, ejecuta:
   ```sql
   update public.profiles set role = 'admin' where id =
     (select id from auth.users where email = 'tu-correo@ejemplo.com');
   ```
3. Entra en `/login` con ese correo y contraseña: llegarás a `/admin`.

Las cuentas de clientes las crea el admin desde `/admin` (botón "Crear cuenta de cliente").

## 5. Correr en desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Estructura

| Rol | Acceso |
|---|---|
| `admin` | `/admin` — crear/editar clientes, catálogo de alimentos (con estimación IA), armar planes por comida y gramaje, registrar mediciones de progreso |
| `cliente` | `/cliente` — ver su plan vigente y su gráfica de progreso (solo lectura) |
