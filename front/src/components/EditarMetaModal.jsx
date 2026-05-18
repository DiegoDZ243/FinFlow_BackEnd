import { useEffect, useState } from 'react';
import { useMeta } from '../context/MetaContext';
import './Modal.css';

const EditarMetaModal = ({ open, meta, onClose, onSaved }) => {
    const { actualizarMeta, loading } = useMeta();
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        identificador: '',
        montoObjetivo: '',
        fechaLimite: '',
        descripcion: ''
    });

    useEffect(() => {
        if (!open || !meta) return;
        setError(null);
        setFormData({
            identificador: meta.identificador || '',
            montoObjetivo: meta.montoObjetivo || '',
            fechaLimite: meta.fechaLimite ? String(meta.fechaLimite).split('T')[0] : '',
            descripcion: meta.descripcion || ''
        });
    }, [open, meta]);

    if (!open) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((p) => ({ ...p, [name]: value }));
    };

    const handleSave = async () => {
        if (!meta?.clave) return;
        setError(null);
        const data = {
            identificador: formData.identificador,
            montoObjetivo: parseFloat(formData.montoObjetivo),
            fechaLimite: formData.fechaLimite,
            descripcion: formData.descripcion
        };

        const res = await actualizarMeta(meta.clave, data);
        if (!res) {
            setError('No se pudo actualizar la meta');
            return;
        }

        await onSaved?.();
        onClose?.();
    };

    return (
        <div className="modal-overlay" role="presentation" onClick={() => !loading && onClose?.()}>
            <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                <h4>Editar meta</h4>
                <div className="modal-form">
                    <label>
                        Nombre
                        <input
                            type="text"
                            name="identificador"
                            value={formData.identificador}
                            onChange={handleChange}
                            minLength={4}
                            maxLength={30}
                            disabled={loading}
                        />
                    </label>
                    <label>
                        Monto objetivo
                        <input
                            type="number"
                            name="montoObjetivo"
                            value={formData.montoObjetivo}
                            onChange={handleChange}
                            min="0.01"
                            step="0.01"
                            disabled={loading}
                        />
                    </label>
                    <label>
                        Fecha limite
                        <input
                            type="date"
                            name="fechaLimite"
                            value={formData.fechaLimite}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </label>
                    <label>
                        Descripcion
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            rows={3}
                            disabled={loading}
                        />
                    </label>
                </div>

                {error && <div className="modal-error">{error}</div>}

                <div className="modal-actions">
                    <button className="btn-ghost" type="button" onClick={onClose} disabled={loading}>
                        Cancelar
                    </button>
                    <button className="btn-primary" type="button" onClick={handleSave} disabled={loading}>
                        {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditarMetaModal;
