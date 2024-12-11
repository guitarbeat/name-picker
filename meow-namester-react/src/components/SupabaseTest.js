import React from 'react';
import useSupabaseStorage from '../supabase/useSupabaseStorage';

function SupabaseTest() {
  const [catNames, setCatNames, { loading, error }] = useSupabaseStorage('cat_names', []);

  const addTestName = async () => {
    const newName = {
      name: `Test Cat ${Math.floor(Math.random() * 100)}`,
      elo_rating: 1500,
      wins: 0,
      losses: 0
    };
    await setCatNames([...catNames, newName]);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Supabase Connection Test</h2>
      <button onClick={addTestName}>Add Test Cat Name</button>
      <div style={{ marginTop: '20px' }}>
        <h3>Stored Cat Names:</h3>
        <ul>
          {catNames.map((cat, index) => (
            <li key={index}>
              {cat.name} (Rating: {cat.elo_rating}, W: {cat.wins}, L: {cat.losses})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default SupabaseTest; 