<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# OPEDOX: ENTERPRISE ARCHITECTURE RULES

## 1. Core Framework & React Paradigm
- **Next.js App Router Only:** Default to React Server Components (RSC) for all data fetching. 
- **Client Boundaries:** Only use `"use client"` when strictly necessary for interactivity (hooks, event listeners, browser APIs). Push the `use client` boundary as far down the component tree as possible.
- **Mutations:** Use Next.js Server Actions for all database mutations (inserts, updates, deletes). Never mutate data directly from a client component without a Server Action.

## 2. Supabase & Multi-Tenant Security
- **Modern Packages:** Use `@supabase/ssr` exclusively. Never use `@supabase/auth-helpers-nextjs`.
- **Zero-Trust Multi-Tenancy:** Opedox is a multi-tenant medical SaaS. Every database query must respect data isolation. Rely on Row Level Security (RLS) to block unauthorized access, but also explicitly filter by `clinic_id` in your queries as a secondary defense.
- **Admin vs. Anon:** Use the Supabase standard client for user actions. Only use the Supabase Service Role (Admin API) in secure server environments for tasks that explicitly require bypassing RLS (e.g., generating staff accounts).

## 3. UI, Styling & UX Standards
- **Tailwind CSS:** Use Tailwind for all styling. Utilize utility classes efficiently. Do not write custom `.css` or `.scss` files.
- **Premium UX (Loading & Errors):** Never leave the user guessing. Always implement Skeleton loaders for asynchronous data fetching. Always wrap components in Error Boundaries or use Next.js `error.tsx` conventions to gracefully catch failures.
- **Component Design:** Keep components modular and single-purpose (DRY principle). If a UI element is used twice, extract it into a shared component.

## 4. TypeScript & Data Integrity
- **Strict Typing:** Write strict TypeScript. You are strictly forbidden from using `any` or `@ts-ignore`. 
- **Database Types:** Always use the auto-generated Supabase database types for queries and component props (e.g., `Tables<'profiles'>`).

## 5. Agent Behavioral Directives
- **No Fluff:** Do not apologize, do not explain what you are *going* to do, and do not add robotic greetings. Output the code, and follow it with a brief, bulleted list of what changed.
- **No Lazy Code:** Never use placeholders like `// ... existing code` or `// implement logic here`. If you are asked to update a file, output the complete, functional code for that block.
- **Think Step-by-Step:** When debugging complex issues (especially RLS or Next.js caching), analyze the data flow step-by-step before generating the fix.