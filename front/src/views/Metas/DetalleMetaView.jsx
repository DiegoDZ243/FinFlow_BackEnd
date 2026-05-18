import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMeta } from '../../context/MetaContext';
import BarraProgreso from '../../components/BarraProgreso';
import HistorialAportes from './HistorialAportes';
import EditarMetaModal from '../../components/EditarMetaModal';
import './DetalleMetaView.css';

const DetalleMetaView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { metaActual, progreso, fetchMetaPorId, fetchProgreso, aportarMeta, eliminarMeta, loading } = useMeta();
    const [showAportar, setShowAportar] = useState(false);
    const [aportacion, setAportacion] = useState({ montoAportado: '', tipo: 'unico', notas: '' });
    const [showHistorial, setShowHistorial] = useState(false);
    const [aportesReloadKey, setAportesReloadKey] = useState(0);
    const [showEditarMeta, setShowEditarMeta] = useState(false);

    useEffect(() => {
        fetchMetaPorId(id);
        fetchProgreso(id);
    }, [id, fetchMetaPorId, fetchProgreso]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const handleAportar = async (e) => {
        e.preventDefault();
        const resultado = await aportarMeta(id, {
            montoAportado: parseFloat(aportacion.montoAportado),
            tipo: aportacion.tipo,
            notas: aportacion.notas
        });
        if (resultado) {
            setShowAportar(false);
            setAportacion({ montoAportado: '', tipo: 'unico', notas: '' });
            fetchProgreso(id);
            // Si el historial esta abierto, recargarlo automaticamente
            setAportesReloadKey((k) => k + 1);
        }
    };

    const handleEliminar = async () => {
        if (window.confirm('¿Estás seguro de eliminar esta meta?')) {
            const success = await eliminarMeta(id);
            if (success) {
                navigate('/metas');
            }
        }
    };

    if (loading && !metaActual) {
        return <div className="detalle-loading">Cargando...</div>;
    }

    if (!metaActual) {
        return <div className="detalle-error">Meta no encontrada</div>;
    }

    const montoActual = parseFloat(metaActual.montoAlcanzado);
    const montoObjetivo = parseFloat(metaActual.montoObjetivo);
    const estaCompletada = montoActual >= montoObjetivo;

    return (
        <div className="detalle-container">
            <div className="detalle-header">
                <Link to="/metas" className="btn-volver">← Volver a Metas</Link>
            </div>

            <div className={`detalle-split ${showHistorial ? 'open' : ''}`}>
                <div className="detalle-card">
                    <button
                        type="button"
                        className="btn-historial"
                        onClick={() => setShowHistorial((v) => !v)}
                    >
                        {showHistorial ? 'Ocultar Historial' : 'Ver Historial'}
                    </button>
                <div className="detalle-titulo">
                    <h1>{metaActual.identificador}</h1>
                    {estaCompletada && <span className="badge-completada">Completada</span>}
                </div>

                {metaActual.descripcion && (
                    <p className="detalle-descripcion">{metaActual.descripcion}</p>
                )}

                <div className="detalle-progreso">
                    <BarraProgreso actual={montoActual} objetivo={montoObjetivo} />
                </div>

                <div className="detalle-stats">
                    <div className="stat">
                        <span className="stat-label">Aportado</span>
                        <span className="stat-value">{formatCurrency(montoActual)}</span>
                    </div>
                    <div className="stat">
                        <span className="stat-label">Objetivo</span>
                        <span className="stat-value">{formatCurrency(montoObjetivo)}</span>
                    </div>
                    <div className="stat">
                        <span className="stat-label">Restante</span>
                        <span className="stat-value">{formatCurrency(Math.max(0, montoObjetivo - montoActual))}</span>
                    </div>
                </div>

                <div className="detalle-info">
                    <div className="info-row">
                        <span>Fecha de inicio:</span>
                        <span>{formatDate(metaActual.fechaInicio)}</span>
                    </div>
                    <div className="info-row">
                        <span>Fecha límite:</span>
                        <span>{formatDate(metaActual.fechaLimite)}</span>
                    </div>
                    {progreso && (
                        <div className="info-row">
                            <span>Progreso:</span>
                            <span>{progreso.porcentaje}%</span>
                        </div>
                    )}
                </div>

                {progreso && (
                    <div className="detalle-estadisticas">
                        <h3>Progreso</h3>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <span className="stat-num">{progreso.porcentaje}%</span>
                                <span className="stat-desc">Completado</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-num">{formatCurrency(progreso.faltan)}</span>
                                <span className="stat-desc">Falta</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="detalle-acciones">
                    {!showAportar ? (
                        <button 
                            onClick={() => setShowAportar(true)}
                            className="btn-aportar"
                            disabled={estaCompletada}
                        >
                            {estaCompletada ? 'Meta Completada' : '+ Aportar'}
                        </button>
                    ) : (
                        <form onSubmit={handleAportar} className="form-aportar">
                            <input
                                type="number"
                                placeholder="Monto a aportar"
                                value={aportacion.montoAportado}
                                onChange={(e) => setAportacion(prev => ({...prev, montoAportado: e.target.value}))}
                                required
                                min="0.01"
                                step="0.01"
                            />
                            <select
                                value={aportacion.tipo}
                                onChange={(e) => setAportacion(prev => ({...prev, tipo: e.target.value}))}
                            >
                                <option value="unico">Único</option>
                                <option value="semanal">Semanal</option>
                                <option value="quincenal">Quincenal</option>
                                <option value="mensual">Mensual</option>
                            </select>
                            <input
                                type="text"
                                placeholder="Notas (opcional)"
                                value={aportacion.notas}
                                onChange={(e) => setAportacion(prev => ({...prev, notas: e.target.value}))}
                            />
                            <div className="form-aportar-actions">
                                <button type="button" onClick={() => setShowAportar(false)} className="btn-cancelar">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-confirmar">
                                    Confirmar
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <div className="detalle-botones">
                    <button type="button" onClick={() => setShowEditarMeta(true)} className="btn-editar">
                        Editar Meta
                    </button>
                    <button onClick={handleEliminar} className="btn-eliminar">
                        Eliminar
                    </button>
                </div>
                </div>

                {showHistorial && (
                    <div className="detalle-side">
                        <HistorialAportes
                            metaClave={id}
                            reloadSignal={aportesReloadKey}
                            onChanged={async () => {
                                await fetchMetaPorId(id);
                                await fetchProgreso(id);
                            }}
                        />
                    </div>
                )}
            </div>

            <EditarMetaModal
                open={showEditarMeta}
                meta={metaActual}
                onClose={() => setShowEditarMeta(false)}
                onSaved={async () => {
                    await fetchMetaPorId(id);
                    await fetchProgreso(id);
                }}
            />
        </div>
    );
};

export default DetalleMetaView;
