CREATE OR REPLACE FUNCTION promote_waitlist()
RETURNS TRIGGER AS $$
DECLARE
  next_waitlist_id TEXT;
  current_confirmed INT;
  event_capacity INT;
BEGIN
  -- Only trigger if a registration was just cancelled
  IF TG_OP = 'UPDATE' AND OLD.status IN ('confirmed', 'waitlisted') AND NEW.status = 'cancelled' THEN
    
    -- Get event capacity
    SELECT capacity INTO event_capacity FROM events WHERE id = OLD.event_id;
    
    -- Get current confirmed count
    SELECT COUNT(*) INTO current_confirmed FROM registrations WHERE event_id = OLD.event_id AND status = 'confirmed';

    -- If there is now an open spot
    IF current_confirmed < event_capacity THEN
      -- Find the oldest waitlisted person
      SELECT id INTO next_waitlist_id
      FROM registrations
      WHERE event_id = OLD.event_id AND status = 'waitlisted'
      ORDER BY created_at ASC
      LIMIT 1;

      -- Promote them to confirmed!
      IF next_waitlist_id IS NOT NULL THEN
        UPDATE registrations SET status = 'confirmed' WHERE id = next_waitlist_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_promote_waitlist ON registrations;
CREATE TRIGGER trigger_promote_waitlist
AFTER UPDATE ON registrations
FOR EACH ROW EXECUTE FUNCTION promote_waitlist();
