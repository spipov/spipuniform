-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  permissions JSONB DEFAULT '{}',
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

-- Insert default roles
INSERT INTO roles (name, description, color, permissions, is_system) VALUES
('admin', 'Administrator with full access', '#EF4444', '{"viewUsers": true, "manageUsers": true, "viewRoles": true, "manageRoles": true, "deleteUsers": true}', true),
('user', 'Standard user with basic access', '#10B981', '{"viewUsers": false, "manageUsers": false, "viewRoles": false, "manageRoles": false, "deleteUsers": false}', true)
ON CONFLICT (name) DO NOTHING;

-- Add role_id, banned_until, and ban_reason columns to user table if they don't exist
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id),
ADD COLUMN IF NOT EXISTS banned_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- Update existing users to have the 'user' role by default
UPDATE "user" 
SET role_id = (SELECT id FROM roles WHERE name = 'user' LIMIT 1)
WHERE role_id IS NULL;

-- Create index on role_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_role_id ON "user"(role_id);