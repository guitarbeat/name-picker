-- Add description column to name_options table
ALTER TABLE name_options 
ADD COLUMN description TEXT;

-- Update existing records with enhanced descriptions
UPDATE name_options
SET description = 
  CASE 
    WHEN name = 'Nova' THEN 'From Latin "novus" meaning new. In astronomy, a nova is a star that suddenly becomes explosively bright. Historically used to describe celestial phenomena that appeared to be "new stars" in the night sky.'
    
    WHEN name = 'Mumuye' THEN 'Named after the Mumuye people of Nigeria, known for their remarkable artistic traditions and intricate sculptures. Their craftsmen are celebrated for creating masks and figures that have influenced African art history.'
    
    WHEN name = 'Umbra' THEN 'Latin word meaning "shadow" or "shade". In astronomy, umbra refers to the darkest part of a shadow during an eclipse. Ancient Romans used this term in their studies of solar phenomena.'
    
    WHEN name = 'Cosmo' THEN 'Derived from the Greek "kosmos", meaning "order" or "universe". Ancient Greeks used this word to describe the harmonious nature of the universe. Associated with philosophers like Pythagoras who studied celestial harmony.'
    
    WHEN name = 'Ekko' THEN 'A stylized version of "echo", from the Greek myth of Echo, a mountain nymph cursed to only repeat the words of others. The scientific study of echo and sound reflection began in ancient Greek amphitheaters.'
    
    WHEN name = 'Ozzy' THEN 'A modern name with playful connotations, popularized in the 20th century. Often associated with charismatic personalities and creative spirits. Derived from the Hebrew name Ozias, meaning "God''s strength".'
    
    WHEN name = 'Syzygy' THEN 'From Ancient Greek "syzygos" meaning "yoked together". In astronomy, it describes the alignment of three celestial bodies. Used in ancient astronomical calculations for predicting eclipses.'
    
    WHEN name = 'Ifemi' THEN 'A Yoruba name meaning "love me". The Yoruba people of West Africa have a rich naming tradition where names often carry deep cultural meanings and family hopes. Represents unconditional love and acceptance.'
    
    WHEN name = 'Galileo' THEN 'Named after Galileo Galilei (1564-1642), the renowned Italian astronomer and physicist. Known as the "father of observational astronomy" and "father of modern physics". His work revolutionized our understanding of the solar system.'
    
    WHEN name = 'Wumi' THEN 'A Yoruba name meaning "God has given me joy". In Yoruba culture, names are often complete sentences expressing gratitude or describing circumstances of birth. Represents divine blessing and happiness.'
    
    WHEN name = 'Orbit' THEN 'From Latin "orbita" meaning "track" or "course". In medieval astronomy, it described the circular paths believed to be followed by planets. Johannes Kepler later proved these paths were actually elliptical.'
  END
WHERE name IN ('Nova', 'Mumuye', 'Umbra', 'Cosmo', 'Ekko', 'Ozzy', 'Syzygy', 'Ifemi', 'Galileo', 'Wumi', 'Orbit');

-- Add descriptions for additional names if they exist in your table
UPDATE name_options
SET description = 
  CASE 
    WHEN name = 'Chroma' THEN 'From Greek "chroma" meaning color. Used in ancient Greek color theory and later in physics to describe the purity of color. The term was crucial in the development of both art and optics.'
    
    WHEN name = 'Ife' THEN 'Named after the ancient Yoruba city of Ile-Ife, considered the spiritual homeland of the Yoruba people. The name means "love" or "expansion" and is associated with the cradle of Yoruba civilization.'
    
    WHEN name = 'Ivory' THEN 'Derived from the ancient trade of elephant tusks. The word has Sanskrit origins (ibha) and traveled through ancient Egyptian, Latin, and Old French. Symbolizes purity and precious rarity.'
    
    WHEN name = 'Moon' THEN 'One of humanity''s oldest observed celestial objects. Cultures worldwide have associated it with timing, tides, and cycles. The word has Indo-European roots meaning "to measure" (as in months).'
    
    WHEN name = 'Orion' THEN 'Named after the mighty hunter in Greek mythology. One of the most recognizable constellations, it has been referenced in ancient texts worldwide, including the Bible and Homer''s Odyssey.'
    
    WHEN name = 'Psyche' THEN 'From Greek mythology, Psyche was a mortal woman whose beauty rivaled Venus. Her name means "soul" or "breath of life". The term later became central to psychology and philosophy.'
    
    WHEN name = 'Sol' THEN 'The Latin name for the Sun, derived from Proto-Indo-European *sóh₂wl̥. Ancient Romans celebrated Sol Invictus, the "Unconquered Sun". The root of words like "solar" and "solstice".'
    
    WHEN name = 'Zuni' THEN 'Named after the Zuni people, one of the oldest surviving Native American tribes. Known for their sophisticated art, particularly their intricate jewelry and fetish carvings.'
  END
WHERE name IN ('Chroma', 'Ife', 'Ivory', 'Moon', 'Orion', 'Psyche', 'Sol', 'Zuni'); 