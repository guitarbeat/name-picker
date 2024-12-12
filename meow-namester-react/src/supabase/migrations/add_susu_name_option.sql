-- First, insert the new name if it doesn't exist
INSERT INTO name_options (name, description)
VALUES (
  'Susu',
  'Short for "susuwatari" (すすわたり), meaning "wandering soot" in Japanese. These beloved characters from Studio Ghibli''s films, particularly "Spirited Away" and "My Neighbor Totoro", are small, charming soot spirits that move in playful groups. Pronounced SOO-soo, with variants like Su-Su or Soot. Perfect for a black cat with a sprightly personality, especially one who seems to appear and disappear like a shadow or moves with the quiet grace of floating soot. The name bridges Japanese animation history with everyday magic, ideal for a cat who brings whimsy and joy to ordinary moments.'
)
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description; 