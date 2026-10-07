CREATE TYPE "public"."statut_boutique" AS ENUM('nouvelle', 'confirmee', 'en_production', 'expediee', 'annulee');--> statement-breakpoint
CREATE TABLE "boutique_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"articles" jsonb NOT NULL,
	"total" integer NOT NULL,
	"nom_client" text NOT NULL,
	"telephone_client" text NOT NULL,
	"adresse" text NOT NULL,
	"ville" text NOT NULL,
	"note" text,
	"statut" "statut_boutique" DEFAULT 'nouvelle' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "boutique_orders_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
ALTER TABLE "boutique_orders" ADD CONSTRAINT "boutique_orders_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "boutique_orders_restaurant_idx" ON "boutique_orders" USING btree ("restaurant_id","created_at");--> statement-breakpoint
CREATE INDEX "boutique_orders_statut_idx" ON "boutique_orders" USING btree ("statut");