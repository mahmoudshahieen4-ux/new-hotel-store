# Prisma Migrations

This folder is managed by **Prisma Migrate**. Prisma uses it as the single
source of truth for the database schema history — every change to
`prisma/schema.prisma` becomes one versioned migration here, and the same
history is replayed on any environment (local, staging, production) so the
database always matches the code.

## Why each folder has a timestamp prefix

Prisma names every migration `YYYYMMDDHHMMSS_some_description`:

- The **timestamp** is created by Prisma and **cannot be safely changed** —
  it defines the order in which migrations are applied.
- The **suffix** is the human-readable description of what the migration
  does. Use short, meaningful suffixes when creating new migrations.

> ⚠️ Never rename or delete a migration that has already been applied. Applied
> migrations are recorded in the `_prisma_migrations` table in the database;
> if the folder name no longer matches, Prisma treats it as a new migration
> and tries to re-apply it (error `P3005`). If a rename is truly required,
> that means regenerating/resetting the migration history, which is
> destructive (development only).

## Current migrations

| Migration | What it does |
|---|---|
| `20260813042251_add_nextauth_models` | Initial schema + NextAuth models (User, Account, Session, VerificationToken, Authenticator) and the app models (Product, Favorite, Review, Cart, CartItem, Order). |
| `20260817090000_add_user_role_and_password` | Adds `role` (`USER`/`ADMIN` enum) and `password` to `User` — powers email/password sign-up and role-based access to the admin dashboard. |
| `20260817120000_add_order_payment_ref` | Adds `Order.paymentOrderId` — a short unique reference used by the Kashier payment-gateway callback to map back to the order. |
| `20261008120000_harden_store_checkout` | Adds order shipping details and line items, required indexes and uniqueness constraints; merges existing duplicate carts/cart items and removes duplicate favorites/reviews first. |

## Useful commands

| Command | Purpose |
|---|---|
| `npx prisma migrate dev --name <description>` | Create + apply a new migration in development. |
| `npx prisma migrate deploy` | Apply pending migrations (used on deploy / CI). |
| `npx prisma migrate status` | Compare local migration files with the database state. |
| `npx prisma migrate reset` | ⚠️ Destructive — drops the database and re-applies every migration from scratch (development only). |

## Deploying

The project's `build` script only runs `prisma generate`. Make sure
`npx prisma migrate deploy` runs before/at deploy time (for example as a
step on Vercel or in your Hostinger VPS setup) so the production database
stays in sync with these migrations.
