import { useEffect, useState } from 'react';
import {
    obtenerAportesPorMeta,
    actualizarAporte,
    eliminarAporte
} from '../../services/aporteMetaService';
import '../../components/Modal.css';
import './HistorialAportes.css';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
};

const formatDateInputValue = (date) => {
    // YYYY-MM-DD
    if (typeof date === 'string') {
        const m = date.match(/^\d{4}-\d{2}-\d{2}/);
        if (m) return m[0];
    }

    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '';

    // Usar UTC para evitar desfases por zona horaria.
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const formatDateLabel = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC'
    });
};

const HistorialAportes = ({ metaClave, reloadSignal, onChanged }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [aportes, setAportes] = useState([]);

    const [deleteId, setDeleteId] = useState(null);
    const [editId, setEditId] = useState(null);
    const [edicion, setEdicion] = useState({ cantidad: '', fechaAporte: '', tipoAporte: 'unico' });

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await obtenerAportesPorMeta(metaClave);
            setAportes(data);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cargar el historial');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (metaClave) load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [metaClave, reloadSignal]);

    const startEditar = (aporte) => {
        setEditId(aporte.claveAporte);
        setEdicion({
            cantidad: String(aporte.cantidad),
            fechaAporte: formatDateInputValue(aporte.fechaAporte),
            tipoAporte: aporte.tipoAporte || 'unico'
        });
    };

    const cancelEditar = () => {
        setEditId(null);
        setEdicion({ cantidad: '', fechaAporte: '', tipoAporte: 'unico' });
    };

    const handleGuardar = async (claveAporte) => {
        setLoading(true);
        setError(null);
        try {
            // Normalizar a un timestamp "seguro" para evitar que al renderizar en local quede un dia menos.
            // (En MX, 12:00Z mantiene el mismo dia local)
            const fechaISO = edicion.fechaAporte ? `${edicion.fechaAporte}T12:00:00.000Z` : undefined;

            await actualizarAporte(claveAporte, {
                cantidad: parseFloat(edicion.cantidad),
                fechaAporte: fechaISO,
                tipoAporte: edicion.tipoAporte
            });
            cancelEditar();
            await load();
            await onChanged?.();
        } catch (err) {
            setError(err.response?.data?.error || 'Error al actualizar el aporte');
        } finally {
            setLoading(false);
        }
    };

    const handleEliminar = async (claveAporte) => {
        setLoading(true);
        setError(null);
        try {
            await eliminarAporte(claveAporte);
            await load();
            await onChanged?.();
        } catch (err) {
            setError(err.response?.data?.error || 'Error al eliminar el aporte');
        } finally {
            setLoading(false);
        }
    };

    const tipoLabel = (tipo) => {
        switch (tipo) {
            case 'semanal':
                return 'Semanal';
            case 'quincenal':
                return 'Quincenal';
            case 'mensual':
                return 'Mensual';
            case 'legacy':
                return 'Inicial';
            case 'unico':
            default:
                return 'Unico';
        }
    };

    return (
        <aside className="historial">
            <div className="historial-header">
                <h3>Historial de aportes</h3>
            </div>

            <div className="historial-hint">
                Para agregar aportes usa el boton <strong>+ Aportar</strong> de la meta.
            </div>

            {error && <div className="historial-error">{error}</div>}

            {loading && aportes.length === 0 ? (
                <div className="historial-empty">Cargando...</div>
            ) : aportes.length === 0 ? (
                <div className="historial-empty">Sin aportes aún</div>
            ) : (
                <ul className="historial-list">
                    {aportes.map((a) => {
                        return (
                            <li key={a.claveAporte} className="historial-item">
                                <>
                                    <div className="item-main">
                                        <div className="item-cantidad">{formatCurrency(parseFloat(a.cantidad))}</div>
                                        <div className="item-meta">
                                            <span className="pill">{tipoLabel(a.tipoAporte)}</span>
                                            <span className="item-fecha">{formatDateLabel(a.fechaAporte)}</span>
                                        </div>
                                    </div>
                                    <div className="item-actions">
                                        <button
                                            type="button"
                                            className="btn-ghost"
                                            onClick={() => startEditar(a)}
                                            disabled={loading}
                                            aria-label="Editar"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-danger"
                                            onClick={() => setDeleteId(a.claveAporte)}
                                            disabled={loading}
                                            aria-label="Eliminar"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </>
                            </li>
                        );
                    })}
                </ul>
            )}

            {deleteId !== null && (
                <div className="modal-overlay" role="presentation" onClick={() => !loading && setDeleteId(null)}>
                    <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <h4>Eliminar aporte</h4>
                        <p>¿Estas seguro de eliminar este aporte? Esta accion no se puede deshacer.</p>
                        <div className="modal-actions">
                            <button className="btn-ghost" type="button" onClick={() => setDeleteId(null)} disabled={loading}>
                                Cancelar
                            </button>
                            <button
                                className="btn-danger"
                                type="button"
                                onClick={async () => {
                                    const idToDelete = deleteId;
                                    setDeleteId(null);
                                    await handleEliminar(idToDelete);
                                }}
                                disabled={loading}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editId !== null && (
                <div className="modal-overlay" role="presentation" onClick={() => !loading && cancelEditar()}>
                    <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <h4>Editar aporte</h4>
                        <div className="modal-form">
                            <label>
                                Cantidad
                                <input
                                    type="number"
                                    value={edicion.cantidad}
                                    onChange={(e) => setEdicion((p) => ({ ...p, cantidad: e.target.value }))}
                                    min="0.01"
                                    step="0.01"
                                    disabled={loading}
                                />
                            </label>
                            <label>
                                Fecha
                                <input
                                    type="date"
                                    value={edicion.fechaAporte}
                                    onChange={(e) => setEdicion((p) => ({ ...p, fechaAporte: e.target.value }))}
                                    disabled={loading}
                                />
                            </label>
                            <label>
                                Tipo
                                <select
                                    value={edicion.tipoAporte}
                                    onChange={(e) => setEdicion((p) => ({ ...p, tipoAporte: e.target.value }))}
                                    disabled={loading}
                                >
                                    <option value="unico">Unico</option>
                                    <option value="semanal">Semanal</option>
                                    <option value="quincenal">Quincenal</option>
                                    <option value="mensual">Mensual</option>
                                </select>
                            </label>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-ghost" type="button" onClick={cancelEditar} disabled={loading}>
                                Cancelar
                            </button>
                            <button
                                className="btn-primary"
                                type="button"
                                onClick={async () => {
                                    const idToUpdate = editId;
                                    await handleGuardar(idToUpdate);
                                }}
                                disabled={loading}
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
};

export default HistorialAportes;
