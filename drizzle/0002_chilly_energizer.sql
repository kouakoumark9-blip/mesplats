ALTER TABLE "categories" ADD COLUMN "disponibilite" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "personnes_min" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "personnes_max" integer;--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN "banniere" text;--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN "adresse_complement" text;--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN "code_postal" text;--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN "ville" text;--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN "theme_menu" text DEFAULT 'clair' NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN "couleur_fond" text DEFAULT 'neutre' NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN "police_menu" text DEFAULT 'moderne' NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN "langues" text[] DEFAULT ARRAY['fr']::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN "reseaux" jsonb;--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN "qr_style" text DEFAULT 'classique' NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN "qr_couleur" text DEFAULT '#0f172a' NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN "qr_fond" text DEFAULT '#ffffff' NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN "qr_logo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_expire" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "session_courte" boolean DEFAULT false NOT NULL;