import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--navy)',
      color: 'rgba(255,255,255,0.7)',
      padding: '40px 0 24px',
      marginTop: 'auto'
    }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32, marginBottom: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, background: 'var(--gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: 'white'
              }}>LU</div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: 15 }}>Lost & Found</div>
                <div style={{ fontSize: 10, opacity: 0.6 }}>LAIKIPIA UNIVERSITY</div>
              </div>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7 }}>
              A centralized platform for reporting and recovering lost items within Laikipia University campus.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'white', fontSize: 13, fontWeight: 600, marginBottom: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Platform</h4>
            <div className="flex flex-col gap-2" style={{ fontSize: 13 }}>
              <Link to="/browse" style={{ color: 'rgba(255,255,255,0.7)' }}>Browse Items</Link>
              <Link to="/report" style={{ color: 'rgba(255,255,255,0.7)' }}>Report Lost Item</Link>
              <Link to="/report" style={{ color: 'rgba(255,255,255,0.7)' }}>Report Found Item</Link>
              <Link to="/dashboard" style={{ color: 'rgba(255,255,255,0.7)' }}>My Dashboard</Link>
            </div>
          </div>

          <div>
            <h4 style={{ color: 'white', fontSize: 13, fontWeight: 600, marginBottom: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Support</h4>
            <div className="flex flex-col gap-2" style={{ fontSize: 13 }}>
              <span>Security Office: Ext. 100</span>
              <span>ICT Helpdesk: Ext. 200</span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12 }}>© 2026 Laikipia University — Department of Computing & Informatics · BICT 328 Group 1</p>
        </div>
      </div>
    </footer>
  );
}
