import { Link } from 'react-router-dom';
import { MapPin, Calendar, Eye, Sparkles } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function ItemCard({ item, showMatchCount = false }) {
  const isLost = item.type === 'lost';
  const statusColors = {
    open: { bg: '#FFF7ED', text: '#C2410C', label: 'Open' },
    matched: { bg: '#EDE9FE', text: '#5B21B6', label: 'Matched' },
    resolved: { bg: '#D1FAE5', text: '#065F46', label: 'Resolved' },
  };
  const status = statusColors[item.status] || statusColors.open;

  return (
    <Link to={`/items/${item.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div className="card card-hover" style={{ overflow: 'hidden', position: 'relative' }}>
        {/* Type stripe */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: isLost ? 'var(--navy)' : 'var(--success)'
        }} />

        {/* Image */}
        <div style={{
          height: 180, background: 'var(--cream-dark)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', position: 'relative'
        }}>
          {item.primary_image ? (
            <img src={item.primary_image} alt={item.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ fontSize: 48, opacity: 0.4 }}>{item.category_icon || '📦'}</div>
          )}

          {/* Type badge */}
          <div style={{
            position: 'absolute', top: 10, left: 10,
            padding: '4px 10px', borderRadius: 99,
            background: isLost ? 'var(--navy)' : '#065F46',
            color: 'white', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase'
          }}>
            {isLost ? '🔍 Lost' : '✅ Found'}
          </div>

          {/* Match count */}
          {showMatchCount && item.match_count > 0 && (
            <div style={{
              position: 'absolute', top: 10, right: 10,
              padding: '4px 8px', borderRadius: 99,
              background: 'rgba(212,146,42,0.9)', backdropFilter: 'blur(4px)',
              color: 'white', fontSize: 11, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 4
            }}>
              <Sparkles size={11} /> {item.match_count} match{item.match_count !== 1 ? 'es' : ''}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '16px 18px' }}>
          {/* Category & Status */}
          <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>{item.category_icon}</span> {item.category_name || 'Uncategorized'}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
              background: status.bg, color: status.text
            }}>{status.label}</span>
          </div>

          {/* Title */}
          <h3 style={{
            fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--navy)',
            marginBottom: 8, lineHeight: 1.3,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
          }}>{item.title}</h3>

          {/* Description */}
          <p style={{
            fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 14,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
          }}>{item.description}</p>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            {/* Location */}
            {(item.location_name || item.location_detail) && (
              <div className="flex items-center gap-2" style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                <MapPin size={13} />
                <span className="truncate">{item.location_name || item.location_detail}</span>
              </div>
            )}

            {/* Date & Reporter */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                <Calendar size={13} />
                {format(new Date(item.date_occurred), 'MMM d, yyyy')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-light)' }}>
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
