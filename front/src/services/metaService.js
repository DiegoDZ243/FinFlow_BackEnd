import api from '../config/axios';

const getToken = () => localStorage.getItem('token');

const config = () => ({
    headers: {
        Authorization: `Bearer ${getToken()}`
    }
});

export const obtenerMetas = async () => {
    const response = await api.get('/metas', config());
    return response.data;
};

export const obtenerMetaPorId = async (id) => {
    const response = await api.get(`/metas/${id}`, config());
    return response.data;
};

export const crearMeta = async (data) => {
    const response = await api.post('/metas', data, config());
    return response.data;
};

export const actualizarMeta = async (id, data) => {
    const response = await api.put(`/metas/${id}`, data, config());
    return response.data;
};

export const eliminarMeta = async (id) => {
    const response = await api.delete(`/metas/${id}`, config());
    return response.data;
};

export const obtenerProgreso = async (id) => {
    const response = await api.get(`/metas/${id}/progreso`, config());
    return response.data;
};

export const aportarMeta = async (id, data) => {
    const { montoAportado, tipo } = data;
    const response = await api.post(
        `/metas/${id}/aportar`,
        { monto: montoAportado, tipoAporte: tipo || 'unico' },
        config()
    );
    return response.data;
};
