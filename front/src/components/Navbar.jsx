import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMeta } from '../context/MetaContext';
import Icon from './Icon';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { searchMetas } = useMeta();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchMessage, setSearchMessage] = useState('');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        const query = searchQuery.trim();
        if (!query) {
            setSearchMessage('Ingresa texto para buscar metas');
            return;
        }

        setSearchMessage('Buscando metas...');
        const results = await searchMetas(query);
        navigate('/metas');

        if (results.length === 0) {
            setSearchMessage('No se encontraron metas');
        } else {
            setSearchMessage(`${results.length} metas encontradas`);
        }

        window.setTimeout(() => {
            setSearchMessage('');
        }, 1400);
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/metas" className="navbar-logo">
                    FinFlow
                </Link>
                
                <ul className="navbar-menu">
                    <li>
                        <Link to="/metas" className="navbar-link">
                            Metas
                        </Link>
                    </li>
                    <li>
                        <Link to="/ingresos" className="navbar-link">
                            Ingresos
                        </Link>
                    </li>
                    <li>
                        <Link to="/egresos" className="navbar-link">
                            Egresos
                        </Link>
                    </li>
                </ul>

                <form className="navbar-search" onSubmit={handleSearch}>
                    <div className="navbar-search-inputs">
                        <Icon name="search" className="navbar-search-icon" />
                        <input
                            type="search"
                            placeholder="Buscar metas..."
                            aria-label="Buscar"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (searchMessage) setSearchMessage('');
                            }}
                        />
                        <button type="submit" className="navbar-search-btn" aria-label="Buscar metas">
                            Buscar
                        </button>
                    </div>
                    {searchMessage && <div className="navbar-search-message" role="status">{searchMessage}</div>}
                </form>

                <div className="navbar-user">
                    <div className="user-profile">
                        <Icon name="user" className="user-icon" />
                        <span className="user-email">{user?.email}</span>
                    </div>
                    <button onClick={handleLogout} className="btn-logout">
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
