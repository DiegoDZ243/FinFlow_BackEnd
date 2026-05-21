import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMeta } from '../../context/MetaContext';
import CardMeta from '../../components/CardMeta';
import Icon from '../../components/Icon';
import './MetasList.css';

const MetasList = () => {
    const { metas, loading, error, fetchMetas, searchResults, searchQuery, clearSearch } = useMeta();

    useEffect(() => {
        fetchMetas();
    }, [fetchMetas]);

    const displayedMetas = searchQuery ? searchResults : metas;

    if (loading && metas.length === 0) {
        return (
            <div className="metas-container">
                <div className="loading">Cargando metas...</div>
            </div>
        );
    }

    return (
        <div className="metas-container">
            <div className="metas-header">
                <h1>Mis Metas Financieras</h1>
                <Link to="/metas/nueva" className="btn-nueva-meta">
                    <Icon name="plus" className="btn-icon" />
                    Nueva Meta
                </Link>
            </div>

            {error && (
                <div className="error-message">
                    <span>{error}</span>
                    <button onClick={fetchMetas} className="btn-reintentar">
                        Reintentar
                    </button>
                </div>
            )}

            {searchQuery && (
                <div className="search-status">
                    <span>Resultados para "{searchQuery}"</span>
                    <button type="button" onClick={clearSearch} className="btn-clear-search">
                        <Icon name="search" className="btn-icon-small" />
                        Mostrar todas
                    </button>
                </div>
            )}

            {displayedMetas.length === 0 ? (
                <div className="metas-vacias">
                    <Icon name="target" className="empty-icon" />
                    <h2>{searchQuery ? 'No se encontraron metas' : 'No tienes metas financieras'}</h2>
                    <p>{searchQuery ? 'Intenta con otro término de búsqueda.' : 'Crea tu primera meta para empezar a ahorrar de manera inteligente.'}</p>
                    <Link to="/metas/nueva" className="btn-crear-primera">
                        Crear Mi Primera Meta
                    </Link>
                </div>
            ) : (
                <div className="metas-grid">
                    {displayedMetas.map((meta) => (
                        <CardMeta key={meta.clave} meta={meta} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MetasList;
