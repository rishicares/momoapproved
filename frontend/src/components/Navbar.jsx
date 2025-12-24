import React from 'react';
import { Grid, Square } from 'lucide-react';

const Navbar = ({ viewMode, setViewMode }) => {
    return (
        <nav className="navbar">
            <div className="container navbar-content">
                <a href="/" className="logo">
                    <img src="/momo.png" alt="Logo" height={24} width={24} />
                    <span>MOMO-Approved</span>
                </a>

                <div style={{ display: 'flex', gap: '0.5rem', background: 'hsl(var(--secondary))', padding: '0.25rem', borderRadius: '9999px' }}>
                    <button
                        className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode('grid')}
                        title="Grid View"
                    >
                        <Grid size={18} />
                    </button>
                    <button
                        className={`btn-icon ${viewMode === 'single' ? 'active' : ''}`}
                        onClick={() => setViewMode('single')}
                        title="Single View"
                    >
                        <Square size={18} />
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
