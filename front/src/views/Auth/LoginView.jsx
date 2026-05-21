import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/Icon';
import './LoginView.css';

const LoginView = () => {
    const { loginUser, registerUser } = useAuth();
    const [isRegister, setIsRegister] = useState(false);
    
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmarPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (isRegister) {
                if (formData.password !== formData.confirmarPassword) {
                    setError('Las contraseñas no coinciden');
                    setLoading(false);
                    return;
                }
                if (formData.password.length < 4) {
                    setError('La contraseña debe tener al menos 4 caracteres');
                    setLoading(false);
                    return;
                }
                await registerUser(formData.email, formData.password);
                setSuccess('¡Registro exitoso! Ahora puedes iniciar sesión.');
                setFormData({ email: '', password: '', confirmarPassword: '' });
                setIsRegister(false);
            } else {
                await loginUser(formData.email, formData.password);
            }
        } catch (err) {
            const mensaje = err.response?.data?.error || err.message || 'Error al procesar la solicitud';
            setError(mensaje);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-logo">
                    <Icon name="shield" className="login-logo-icon" />
                    <span>FinFlow</span>
                </div>
                <h2>{isRegister ? 'Crear Cuenta' : 'Bienvenido'}</h2>
                <p className="login-subtitle">
                    {isRegister ? 'Crea tu cuenta para empezar a planificar tus metas financieras.' : 'Ingresa para ver tus metas y avanzar con más control financiero.'}
                </p>
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Correo electrónico</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="tu@email.com"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            minLength={4}
                            autoComplete={isRegister ? 'new-password' : 'current-password'}
                        />
                    </div>

                    {isRegister && (
                        <div className="form-group">
                            <label htmlFor="confirmarPassword">Confirmar Contraseña</label>
                            <input
                                type="password"
                                id="confirmarPassword"
                                name="confirmarPassword"
                                value={formData.confirmarPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                minLength={4}
                                autoComplete="new-password"
                            />
                        </div>
                    )}

                    {error && <div className="login-error">{error}</div>}
                    {success && <div className="login-success">{success}</div>}

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'Procesando...' : isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="login-toggle">
                    {isRegister ? (
                        <>
                            ¿Ya tienes cuenta?{' '}
                            <button type="button" onClick={() => { setIsRegister(false); setError(''); setSuccess(''); }}>
                                Inicia sesión
                            </button>
                        </>
                    ) : (
                        <>
                            ¿No tienes cuenta?{' '}
                            <button type="button" onClick={() => { setIsRegister(true); setError(''); setSuccess(''); }}>
                                Regístrate
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginView;