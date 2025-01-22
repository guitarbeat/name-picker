-- Create cat_name_ratings table
CREATE TABLE IF NOT EXISTS public.cat_name_ratings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_name TEXT NOT NULL,
    name_id UUID NOT NULL REFERENCES public.name_options(id) ON DELETE CASCADE,
    rating INTEGER DEFAULT 1500,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_name, name_id)
);

-- Create index on user_name for faster lookups
CREATE INDEX cat_name_ratings_user_name_idx ON public.cat_name_ratings(user_name);

-- Enable Row Level Security
ALTER TABLE public.cat_name_ratings ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Public can read cat name ratings" ON public.cat_name_ratings
    FOR SELECT
    USING (true);

-- Create policy for public insert/update access
CREATE POLICY "Public can modify cat name ratings" ON public.cat_name_ratings
    FOR ALL
    USING (true)
    WITH CHECK (true); 