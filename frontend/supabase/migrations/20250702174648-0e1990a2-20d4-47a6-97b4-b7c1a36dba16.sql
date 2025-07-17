
-- Create email_tokens table for secure email verification
CREATE TABLE public.email_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used BOOLEAN DEFAULT FALSE
);

-- Create indexes for faster lookups
CREATE INDEX idx_email_tokens_token ON public.email_tokens(token);
CREATE INDEX idx_email_tokens_email ON public.email_tokens(email);

-- Enable RLS
ALTER TABLE public.email_tokens ENABLE ROW LEVEL SECURITY;

-- Policy to allow service role to manage tokens
CREATE POLICY "Service role can manage email tokens" ON public.email_tokens
  FOR ALL USING (true);
