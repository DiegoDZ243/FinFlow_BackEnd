import api from '../config/axios';

const getToken = () => localStorage.getItem('token');

const config = () => ({
    headers: {
        Authorization: `Bearer ${getToken()}`
    }
});

export const obtenerAportesPorMeta = async (metaClave) => {
    const response = await api.get(`/aportes-metas/meta/${metaClave}`, config());
    return response.data;
};

export const crearAporte = async ({ metaClave, cantidad, fechaAporte, tipoAporte }) => {
    const response = await api.post(
        '/aportes-metas',
        { metaClave, cantidad, fechaAporte, tipoAporte },
        config()
    );
    return response.data;
};

export const actualizarAporte = async (claveAporte, { cantidad, fechaAporte, tipoAporte }) => {
    const response = await api.put(
        `/aportes-metas/${claveAporte}`,
        { cantidad, fechaAporte, tipoAporte },
        config()
    );
    return response.data;
};

export const eliminarAporte = async (claveAporte) => {
    const response = await api.delete(`/aportes-metas/${claveAporte}`, config());
    return response.data;
};
