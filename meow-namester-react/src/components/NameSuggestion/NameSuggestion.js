import React, { useState } from 'react';
import useNameOptions from '../../supabase/useNameOptions';
import './NameSuggestion.css';

function NameSuggestion() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { addNameOption, loading } = useNameOptions();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    try {
      await addNameOption(name.trim(), description.trim());
      setSuccess('Thank you for your suggestion!');
      setName('');
      setDescription('');
    } catch (err) {
      setError('Failed to add name. It might already exist.');
    }
  };

  return (
    <div className="name-suggestion">
      <div className="suggestion-card">
        <h2>Suggest a Cat Name</h2>
        <p className="suggestion-intro">
          Have a great cat name in mind? Share it with the community!
        </p>

        <form onSubmit={handleSubmit} className="suggestion-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a cat name"
              maxLength={50}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about this name's meaning or origin"
              maxLength={500}
              disabled={loading}
            />
          </div>

          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Name'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default NameSuggestion; 