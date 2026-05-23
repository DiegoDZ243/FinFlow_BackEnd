import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeta } from '../../context/MetaContext';
import Icon from '../../components/Icon';
import './FormMeta.css';

const MAX_OBJECTIVE = 99999999.99;

const CrearMetaView = () => {
    const navigate = useNavigate();
    const { metas, fetchMetas, crearMeta, loading, error } = useMeta();

    const [formData, setFormData] = useState({
        identificador: '',
        montoObjetivo: '',
        fechaLimite: '',
        descripcion: ''
    });
    const [localError, setLocalError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
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
        if (parseFloat(formData.montoObjetivo) > MAX_OBJECTIVE) {
            setLocalError(`El monto objetivo no puede ser mayor a ${MAX_OBJECTIVE.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
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

        const metasDisponibles = metas.length ? metas : await fetchMetas();
        const nombreNormalizado = formData.identificador.trim().toLowerCase();
        const existeDuplicado = metasDisponibles.some(
            (meta) => meta.identificador?.trim().toLowerCase() === nombreNormalizado
        );

        if (existeDuplicado) {
            setLocalError('Ya existe una meta con ese nombre. Elige otro identificador.');
            return;
        }

        const data = {
            ...formData,
            montoObjetivo: parseFloat(formData.montoObjetivo),
            fechaInicio: new Date().toISOString().split('T')[0]
        };

        const resultado = await crearMeta(data);
        if (resultado) {
            navigate('/metas');
        }
    };

    return (
        <div className="form-container">
            <h1><Icon name="target" className="section-icon" /> Crear Nueva Meta</h1>
            
            <form onSubmit={handleSubmit} className="form-meta" noValidate>
                <div className="form-group">
                    <label htmlFor="identificador">Nombre de la Meta *</label>
                    <input
                        type="text"
                        id="identificador"
                        name="identificador"
                        value={formData.identificador}
                        onChange={handleChange}
                        placeholder="Ej: Vacaciones 2026"
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
                        placeholder="5000.00"
                        step="0.01"
                        min="0.01"
                        max={MAX_OBJECTIVE}
                        className={formData.montoObjetivo && parseFloat(formData.montoObjetivo) > MAX_OBJECTIVE ? 'invalid' : ''}
                        aria-invalid={formData.montoObjetivo && parseFloat(formData.montoObjetivo) > MAX_OBJECTIVE}
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
                        placeholder="¿Por qué es importante esta meta?"
                        rows={3}
                    />
                </div>

                {(localError || error) && <div className="form-error">{localError || error}</div>}

                <div className="form-actions">
                    <button 
                        type="button" 
                        onClick={() => navigate('/metas')}
                        className="btn-cancelar"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="btn-enviar"
                    >
                        {loading ? 'Creando...' : 'Crear Meta'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CrearMetaView;
