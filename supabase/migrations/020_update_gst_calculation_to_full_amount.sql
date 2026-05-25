-- Migration: Update GST calculation to apply to full amount
-- Previously GST was calculated only on service_charges
-- Now GST applies to total_charges (inspection + service + parts)

CREATE OR REPLACE FUNCTION calculate_job_totals()
RETURNS TRIGGER AS $$
DECLARE
  spare_parts_sum NUMERIC(10,2);
BEGIN
  -- Calculate spare parts total
  SELECT COALESCE(SUM(total_price), 0) INTO spare_parts_sum
  FROM spare_parts WHERE job_id = NEW.id;
  
  -- Calculate total charges
  NEW.total_charges = COALESCE(NEW.inspection_fee, 0) + COALESCE(NEW.service_charges, 0) + spare_parts_sum;
  
  -- Calculate GST amount (now applies to full total_charges, not just service_charges)
  IF NEW.gst_enabled THEN
    NEW.gst_amount = NEW.total_charges * 0.18;
  ELSE
    NEW.gst_amount = 0;
  END IF;
  
  -- Calculate grand total
  NEW.grand_total = NEW.total_charges + NEW.gst_amount;
  
  -- Calculate balance
  NEW.balance_amount = NEW.grand_total - COALESCE(NEW.advance_paid, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
