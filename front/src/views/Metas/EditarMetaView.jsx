import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMeta } from '../../context/MetaContext';
import './FormMeta.css';

const EditarMetaView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { metaActual, fetchMetaPorId, actualizarMeta, loading, error } = useMeta();

    const [formData, setFormData] = useState({
        identificador: '',
        montoObjetivo: '',
        fechaLimite: '',
        descripcion: '',
        estado: true
    });
    const [localError, setLocalError] = useState(null);

    useEffect(() => {
        fetchMetaPorId(id);
    }, [id, fetchMetaPorId]);

    useEffect(() => {
        if (metaActual && metaActual.clave === id) {
            setFormData({
                identificador: metaActual.identificador || '',
                montoObjetivo: metaActual.montoObjetivo || '',
                fechaLimite: metaActual.fechaLimite ? metaActual.fechaLimite.split('T')[0] : '',
                descripcion: metaActual.descripcion || '',
                estado: metaActual.estado
            });
        }
    }, [metaActual, id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (localError) setLocalError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError(null);

        if (!formData.identificador || formData.identificador.length < 4) {
            setLocalError('El nombre debe tener al menos 4 caracteres');
            return;
        }
        if (formData.identificador.length > 30) {
            setLocalError('El nombre de la meta no puede exceder los 30 caracteres');
            return;
        }
        if (!formData.montoObjetivo || parseFloat(formData.montoObjetivo) <= 0) {
            setLocalError('El monto objetivo debe ser mayor a 0');
            return;
        }
        if (!formData.fechaLimite) {
            setLocalError('La fecha límite es obligatoria');
            return;
        }
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaLimite = new Date(formData.fechaLimite + 'T00:00:00');
        if (fechaLimite <= hoy) {
            setLocalError('La fecha límite debe ser al menos un día posterior a la fecha de creación');
            return;
        }

        const data = {
            ...formData,
            montoObjetivo: parseFloat(formData.montoObjetivo)
        };

        const resultado = await actualizarMeta(id, data);
        if (resultado) {
            navigate(`/metas/${id}`);
        }
    };

    if (loading && !metaActual) {
        return <div className="form-container"><div className="loading">Cargando...</div></div>;
    }

    return (
        <div className="form-container">
            <h1>Editar Meta</h1>
            
            <form onSubmit={handleSubmit} className="form-meta" noValidate>
                <div className="form-group">
                    <label htmlFor="identificador">Nombre de la Meta *</label>
                    <input
                        type="text"
                        id="identificador"
                        name="identificador"
                        value={formData.identificador}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="montoObjetivo">Monto Objetivo *</label>
                    <input
                        type="number"
                        id="montoObjetivo"
                        name="montoObjetivo"
                        value={formData.montoObjetivo}
                        onChange={handleChange}
                        step="0.01"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="fechaLimite">Fecha Límite *</label>
                    <input
                        type="date"
                        id="fechaLimite"
                        name="fechaLimite"
                        value={formData.fechaLimite}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="descripcion">Descripción (opcional)</label>
                    <textarea
                        id="descripcion"
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                        rows={3}
                    />
                </div>

                <div className="form-group checkbox-group">
                   {/* <label>
                         <input
                             type="checkbox"
                             name="estado"
                             checked={formData.estado}
                             onChange={handleChange}
                         />
                         Meta activa
                     </label> */}
                </div>

                {(localError || error) && <div className="form-error">{localError || error}</div>}

                <div className="form-actions">
                    <button 
                        type="button" 
                        onClick={() => navigate(`/metas/${id}`)}
                        className="btn-cancelar"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="btn-enviar"
                    >
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditarMetaView;
