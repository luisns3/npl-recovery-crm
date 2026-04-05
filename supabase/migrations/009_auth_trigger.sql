-- Migration 009: Auth trigger — auto-create public user on signup

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_tenant UUID;
BEGIN
  -- Get the first tenant as default (for PoC)
  SELECT id INTO default_tenant FROM tenants LIMIT 1;

  INSERT INTO public.users (id, tenant_id, email, full_name, role, team_id)
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data->>'tenant_id')::UUID,
      default_tenant
    ),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'lam_phone'::user_role
    ),
    (NEW.raw_user_meta_data->>'team_id')::UUID
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
