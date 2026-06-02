-- Migration: 027_add_liquid_damage_to_product_condition.sql
-- Purpose: Add 'liquid_damage' value to product_condition custom enum type in PostgreSQL

ALTER TYPE product_condition ADD VALUE IF NOT EXISTS 'liquid_damage';
