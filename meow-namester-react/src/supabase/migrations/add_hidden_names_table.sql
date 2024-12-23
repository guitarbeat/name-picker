-- Create hidden_names table
CREATE TABLE IF NOT EXISTS public.hidden_names (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name_id UUID NOT NULL REFERENCES public.name_options(id) ON DELETE CASCADE,
    hidden_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    hidden_by TEXT NOT NULL,
    UNIQUE(name_id)
);

-- Enable RLS
ALTER TABLE public.hidden_names ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Anyone can read hidden names" ON public.hidden_names
    FOR SELECT
    USING (true);

-- Create policy for admin write access
CREATE POLICY "Only admin can modify hidden names" ON public.hidden_names
    FOR ALL
    USING (auth.uid() IN (
        SELECT auth.uid() 
        FROM auth.users 
        WHERE email = 'aaron@example.com'
    ))
    WITH CHECK (auth.uid() IN (
        SELECT auth.uid() 
        FROM auth.users 
        WHERE email = 'aaron@example.com'
    )); 