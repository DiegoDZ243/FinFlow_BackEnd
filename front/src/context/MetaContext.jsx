import { createContext, useContext, useState, useCallback } from 'react';
import { 
    obtenerMetas, 
    crearMeta, 
    actualizarMeta, 
    eliminarMeta,
    obtenerMetaPorId,
    obtenerProgreso,
    aportarMeta 
} from '../services/metaService';

const MetaContext = createContext();

export const useMeta = () => {
    const context = useContext(MetaContext);
    if (!context) {
        throw new Error('useMeta debe usarse dentro de MetaProvider');
    }
    return context;
};

export const MetaProvider = ({ children }) => {
    const [metas, setMetas] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [metaActual, setMetaActual] = useState(null);
    const [progreso, setProgreso] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchMetas = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await obtenerMetas();
            setMetas(data);
            return data;
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cargar las metas');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchMetaPorId = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            const data = await obtenerMetaPorId(id);
            setMetaActual(data);
            return data;
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cargar la meta');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchProgreso = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            const data = await obtenerProgreso(id);
            setProgreso(data);
            return data;
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cargar el progreso');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const crearNuevaMeta = useCallback(async (data) => {
        setLoading(true);
        setError(null);
        try {
            const nuevaMeta = await crearMeta(data);
            setMetas(prev => [...prev, nuevaMeta]);
            return nuevaMeta;
        } catch (err) {
            setError(err.response?.data?.error || 'Error al crear la meta');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const actualizarMetaExistente = useCallback(async (id, data) => {
        setLoading(true);
        setError(null);
        try {
            const metaActualizada = await actualizarMeta(id, data);
            setMetas(prev => prev.map(m => m.clave === id ? metaActualizada : m));
            if (metaActual?.clave === id) {
                setMetaActual(metaActualizada);
            }
            return metaActualizada;
        } catch (err) {
            setError(err.response?.data?.error || 'Error al actualizar la meta');
            return null;
        } finally {
            setLoading(false);
        }
    }, [metaActual]);

    const eliminarMetaExistente = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            await eliminarMeta(id);
            setMetas(prev => prev.filter(m => m.clave !== id));
            if (metaActual?.clave === id) {
                setMetaActual(null);
            }
            return true;
        } catch (err) {
            setError(err.response?.data?.error || 'Error al eliminar la meta');
            return false;
        } finally {
            setLoading(false);
        }
    }, [metaActual]);

    const aportarAMeta = useCallback(async (id, data) => {
        setLoading(true);
        setError(null);
        try {
            const resultado = await aportarMeta(id, data);
            await fetchMetaPorId(id);
            return resultado;
        } catch (err) {
            setError(err.response?.data?.error || 'Error al aportar');
            return null;
        } finally {
            setLoading(false);
        }
    }, [fetchMetaPorId]);

    const searchMetas = useCallback(async (query) => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) {
            setSearchQuery('');
            setSearchResults([]);
            return [];
        }

        let metasParaBuscar = metas;
        if (metasParaBuscar.length === 0) {
            metasParaBuscar = await fetchMetas();
        }

        const normalizedQuery = trimmedQuery.toLowerCase();
        const resultados = metasParaBuscar.filter((meta) => {
            const identificador = meta.identificador?.toLowerCase() || '';
            const descripcion = meta.descripcion?.toLowerCase() || '';
            return identificador.includes(normalizedQuery) || descripcion.includes(normalizedQuery);
        });

        setSearchQuery(trimmedQuery);
        setSearchResults(resultados);
        return resultados;
    }, [metas, fetchMetas]);

    const clearSearch = useCallback(() => {
        setSearchQuery('');
        setSearchResults([]);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const value = {
        metas,
        searchQuery,
        searchResults,
        metaActual,
        progreso,
        loading,
        error,
        fetchMetas,
        fetchMetaPorId,
        fetchProgreso,
        crearMeta: crearNuevaMeta,
        actualizarMeta: actualizarMetaExistente,
        eliminarMeta: eliminarMetaExistente,
        aportarMeta: aportarAMeta,
        searchMetas,
        clearSearch,
        clearError
    };

    return (
        <MetaContext.Provider value={value}>
            {children}
        </MetaContext.Provider>
    );
};
