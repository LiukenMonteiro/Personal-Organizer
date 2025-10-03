import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3001/api';

function Links({ password }) {
  const [links, setLinks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [newLink, setNewLink] = useState({ title: '', url: '', tags: '' });

  useEffect(() => {
    loadLinks();
  }, [search, filterTag]);

  const loadLinks = async () => {
    let url = `${API_URL}/links`;
    const params = new URLSearchParams();
    
    if (search) params.append('search', search);
    if (filterTag) params.append('tags', filterTag);
    
    if (params.toString()) url += `?${params.toString()}`;
    
    const res = await fetch(url, { headers: { password } });
    setLinks(await res.json());
  };

  const addLink = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', password },
      body: JSON.stringify(newLink)
    });
    setNewLink({ title: '', url: '', tags: '' });
    setShowForm(false);
    loadLinks();
  };

  const deleteLink = async (id) => {
    if (window.confirm('Remover este link?')) {
      await fetch(`${API_URL}/links/${id}`, {
        method: 'DELETE',
        headers: { password }
      });
      loadLinks();
    }
  };

  const allTags = [...new Set(
    links.flatMap(link => link.tags ? link.tags.split(',').map(t => t.trim()) : [])
  )];

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3>🔗 Links Importantes</h3>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            + Adicionar Link
          </button>
        </div>

        {showForm && (
          <form onSubmit={addLink} style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Título"
              value={newLink.title}
              onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
              required
            />
            <input
              type="url"
              placeholder="URL"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Tags (separadas por vírgula)"
              value={newLink.tags}
              onChange={(e) => setNewLink({ ...newLink, tags: e.target.value })}
            />
            <button type="submit" className="btn btn-primary">Salvar</button>
          </form>
        )}

        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Buscar links..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <select 
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            style={{ width: '200px' }}
          >
            <option value="">Todas as tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>

        {links.length === 0 ? (
          <p>Nenhum link encontrado</p>
        ) : (
          <div>
            {links.map(link => (
              <div key={link.id} className="link-item">
                <div>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.title}
                  </a>
                  <div style={{ marginTop: '5px' }}>
                    {link.tags && link.tags.split(',').map(tag => (
                      <span key={tag} className="tag">{tag.trim()}</span>
                    ))}
                  </div>
                </div>
                <button className="btn btn-danger" onClick={() => deleteLink(link.id)}>
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Links;