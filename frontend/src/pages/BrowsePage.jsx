import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { itemsAPI, metaAPI } from '../services/api';
import ItemCard from '../components/items/ItemCard';

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    type: searchParams.get('type') || '',
    status: 'open',
    category_id: '',
    location_id: '',
    search: searchParams.get('search') || '',
    date_from: '',
    date_to: '',
    sort: 'newest',
    page: 1,
    limit: 12,
  });

  useEffect(() => {
    metaAPI.getCategories().then(r => setCategories(r.data.data)).catch(() => {});
    metaAPI.getLocations().then(r => setLocations(r.data.data)).catch(() => {});
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''));
      const res = await itemsAPI.getAll(params);
      setItems(res.data.data.items);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchItems(); }, [filters]);

  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value, page: key === 'page' ? value : 1 }));

  const clearFilters = () => setFilters(f => ({
    ...f, type: '', category_id: '', location_id: '',
    date_from: '', date_to: '', status: 'open', sort: 'newest', page: 1
  }));

  const activeFilterCount = [filters.type, filters.category_id, filters.location_id, filters.date_from, filters.date_to]
    .filter(Boolean).length;

  return (
    <div style={{ padding: '32px 0 60px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--navy)', marginBottom: 6 }}>Browse Items</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
            {pagination.total > 0 ? `${pagination.total} item${pagination.total !== 1 ? 's' : ''} found` : 'Search and filter to find items'}
          </p>
        </div>

        {/* Search + Filter Bar */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
          padding: '14px 16px', marginBottom: 20,
          display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap'
        }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--cream-dark)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              placeholder="Search by title or description…"
              style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 14, fontFamily: 'var(--font-body)', color: 'var(--text-primary)' }}
            />
            {filters.search && <button onClick={() => setFilter('search', '')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>}
          </div>

          {/* Type tabs */}
          <div className="type-tab-bar">
            <button className={`type-tab ${filters.type === '' ? 'active-lost' : ''}`} style={{ ...(filters.type === '' ? {} : {}) }} onClick={() => setFilter('type', '')}>All</button>
            <button className={`type-tab ${filters.type === 'lost' ? 'active-lost' : ''}`} onClick={() => setFilter('type', 'lost')}>Lost</button>
            <button className={`type-tab ${filters.type === 'found' ? 'active-found' : ''}`} onClick={() => setFilter('type', 'found')}>Found</button>
          </div>

          {/* Filter toggle */}
          <button className="btn btn-outline btn-sm" onClick={() => setShowFilters(!showFilters)} style={{ position: 'relative' }}>
            <SlidersHorizontal size={15} /> Filters
            {activeFilterCount > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -6,
                background: 'var(--gold)', color: 'white', borderRadius: 99,
                fontSize: 10, fontWeight: 700, width: 18, height: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>{activeFilterCount}</span>
            )}
          </button>

          {/* Sort */}
          <select className="form-select" style={{ width: 'auto', padding: '9px 12px', fontSize: 13 }}
            value={filters.sort} onChange={e => setFilter('sort', e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="date_desc">Date lost (recent)</option>
            <option value="date_asc">Date lost (oldest)</option>
          </select>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
            padding: '20px', marginBottom: 20,
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16
          }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={filters.category_id} onChange={e => setFilter('category_id', e.target.value)}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <select className="form-select" value={filters.location_id} onChange={e => setFilter('location_id', e.target.value)}>
                <option value="">All Locations</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
                <option value="open">Open</option>
                <option value="matched">Matched</option>
                <option value="resolved">Resolved</option>
                <option value="all">All</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date From</label>
              <input type="date" className="form-input" value={filters.date_from} onChange={e => setFilter('date_from', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Date To</label>
              <input type="date" className="form-input" value={filters.date_to} onChange={e => setFilter('date_to', e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-outline btn-sm w-full" onClick={clearFilters} style={{ justifyContent: 'center' }}>
                <X size={14} /> Clear All Filters
              </button>
            </div>
          </div>
        )}

        {/* Category Quick Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          {categories.slice(0, 8).map(c => (
            <button key={c.id} onClick={() => setFilter('category_id', filters.category_id === String(c.id) ? '' : String(c.id))}
              style={{
                padding: '6px 14px', borderRadius: 99, border: '1.5px solid',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                background: filters.category_id === String(c.id) ? 'var(--navy)' : 'white',
                borderColor: filters.category_id === String(c.id) ? 'var(--navy)' : 'var(--border)',
                color: filters.category_id === String(c.id) ? 'white' : 'var(--text-secondary)',
                fontFamily: 'var(--font-body)'
              }}>
              {c.icon} {c.name}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {Array(6).fill(0).map((_, i) => (
              <div key={i} style={{ height: 340, background: 'var(--cream-dark)', borderRadius: 'var(--radius-lg)', animation: 'pulse 1.5s ease infinite' }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: 80 }}>
            <div className="icon">🔍</div>
            <h3>No items found</h3>
            <p>Try adjusting your search or filters</p>
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={clearFilters}>Clear Filters</button>
          </div>
        ) : (
          <div className="items-grid">
            {items.map(item => <ItemCard key={item.id} item={item} showMatchCount />)}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between" style={{ marginTop: 36, padding: '16px 0' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Page {pagination.page} of {pagination.pages} · {pagination.total} items
            </p>
            <div className="flex gap-2">
              <button className="btn btn-outline btn-sm" disabled={filters.page <= 1}
                onClick={() => setFilter('page', filters.page - 1)}>
                <ChevronLeft size={16} /> Previous
              </button>
              <button className="btn btn-outline btn-sm" disabled={filters.page >= pagination.pages}
                onClick={() => setFilter('page', filters.page + 1)}>
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
