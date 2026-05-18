import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMeta } from '../../context/MetaContext';
import CardMeta from '../../components/CardMeta';
import './MetasList.css';

const MetasList = () => {
    const { metas, loading, error, fetchMetas } = useMeta();

    useEffect(() => {
        fetchMetas();
    }, [fetchMetas]);

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
                    + Nueva Meta
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

            {metas.length === 0 ? (
                <div className="metas-vacias">
                    <div className="empty-icon">🎯</div>
                    <h2>No tienes metas financieras</h2>
                    <p>Crea tu primera meta para empezar a ahorrar de manera inteligente.</p>
                    <Link to="/metas/nueva" className="btn-crear-primera">
                        Crear Mi Primera Meta
                    </Link>
                </div>
            ) : (
                <div className="metas-grid">
                    {metas.map((meta) => (
                        <CardMeta key={meta.clave} meta={meta} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MetasList;
