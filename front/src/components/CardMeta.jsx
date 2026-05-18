import { Link } from 'react-router-dom';
import BarraProgreso from './BarraProgreso';
import './CardMeta.css';
import { useState } from 'react';
import EditarMetaModal from './EditarMetaModal';

const CardMeta = ({ meta }) => {
    const [showEditar, setShowEditar] = useState(false);
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getDiasRestantes = () => {
        const hoy = new Date();
        const limite = new Date(meta.fechaLimite);
        const diff = Math.ceil((limite - hoy) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const diasRestantes = getDiasRestantes();
    const estaCompletada = parseFloat(meta.montoAlcanzado) >= parseFloat(meta.montoObjetivo);

    return (
        <>
            <div className={`card-meta ${estaCompletada ? 'completada' : ''}`}>
                <div className="card-meta-header">
                    <h3 className="card-meta-nombre">{meta.identificador}</h3>
                    {estaCompletada && <span className="badge-completada">Completada</span>}
                </div>
                
                {meta.descripcion && (
                    <p className="card-meta-descripcion">{meta.descripcion}</p>
                )}

                <div className="card-meta-progreso">
                    <BarraProgreso 
                        actual={parseFloat(meta.montoAlcanzado)}
                        objetivo={parseFloat(meta.montoObjetivo)}
                    />
                </div>

                <div className="card-meta-info">
                    <div className="card-meta-fecha">
                        <span className="label">Fecha límite:</span>
                        <span className={`valor ${diasRestantes < 0 ? 'vencida' : ''}`}>
                            {formatDate(meta.fechaLimite)}
                            {diasRestantes >= 0 ? ` (${diasRestantes} días)` : ' (Vencida)'}
                        </span>
                    </div>
                </div>

                <div className="card-meta-acciones">
                    <Link to={`/metas/${meta.clave}`} className="btn-ver">
                        Ver Detalle
                    </Link>
                    <button type="button" className="btn-editar" onClick={() => setShowEditar(true)}>
                        Editar
                    </button>
                </div>
            </div>

            <EditarMetaModal
                open={showEditar}
                meta={meta}
                onClose={() => setShowEditar(false)}
            />
        </>
    );
};

export default CardMeta;
