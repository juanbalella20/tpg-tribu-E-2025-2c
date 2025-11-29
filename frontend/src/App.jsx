import React, { useState, useEffect } from 'react';
import './App.css';
import { Clock, DollarSign, Calendar, User, ArrowLeft, TrendingUp, Edit2 } from 'lucide-react';
import TimesheetApp from './cargaDehoras.jsx';
import CostReport from './reporteCostos.jsx';
import WeeklyReport from './reporteSemanal.jsx';
import ProjectCostsReport from './proyectos.jsx';
import ProfileCostsReport from './perfiles.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function App() {
  const [activeView, setActiveView] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${API_URL}/simulate/rand_emplyee_id`);
        if (response.ok) {
            const data = await response.json();
            setUserData(data);
            console.log("Sesión iniciada:", data);
        }
      } catch (error) {
        console.error("Error obteniendo datos de usuario:", error);
      }
    };
    fetchUserData();
  }, []);

  // Extraemos el ID para pasarlo a los componentes hijos
  const employeeId = userData?.employee_id;

  // Definimos las opciones de navegación
  const navItems = [
    { id: 'hours', label: 'Carga de Horas', icon: Clock },
    { id: 'costs', label: 'Reporte Costos', icon: DollarSign },
    { id: 'weekly', label: 'Reporte Semanal', icon: Calendar },
    { id: 'projects', label: 'Costos Proyecto', icon: TrendingUp },
    { id: 'profiles', label: 'Costos Perfil', icon: Edit2 },
  ];

  // Configuración para las tarjetas del Dashboard (Home)
  const menuOptions = [
    {
      id: 'hours',
      title: 'Carga de Horas',
      description: 'Registra tus horas trabajadas',
      icon: Clock,
      color: 'from-cyan-400 to-blue-500',
      bgColor: 'bg-cyan-400/10',
      borderColor: 'border-cyan-400/30',
      hoverColor: 'hover:border-cyan-400 hover:shadow-cyan-400/50'
    },
    {
      id: 'costs',
      title: 'Ver reportes de costos',
      description: 'Visualiza costos por proyecto',
      icon: DollarSign,
      color: 'from-green-400 to-emerald-500',
      bgColor: 'bg-green-400/10',
      borderColor: 'border-green-400/30',
      hoverColor: 'hover:border-green-400 hover:shadow-green-400/50'
    },
    {
      id: 'weekly',
      title: 'Ver reporte horas cargadas',
      description: 'Consulta reportes semanales',
      icon: Calendar,
      color: 'from-orange-400 to-red-500',
      bgColor: 'bg-orange-400/10',
      borderColor: 'border-orange-400/30',
      hoverColor: 'hover:border-orange-400 hover:shadow-orange-400/50'
    },
    {
      id: 'projects',
      title: 'Costos por Proyecto',
      description: 'Visualiza costos calculados por proyecto',
      icon: TrendingUp,
      color: 'from-purple-400 to-pink-500',
      bgColor: 'bg-purple-400/10',
      borderColor: 'border-purple-400/30',
      hoverColor: 'hover:border-purple-400 hover:shadow-purple-400/50',
    },
    {
      id: 'profiles',
      title: 'Costos por Perfil',
      description: 'Edita costos mensuales de perfiles',
      icon: Edit2,
      color: 'from-indigo-400 to-blue-500',
      bgColor: 'bg-indigo-400/10',
      borderColor: 'border-indigo-400/30',
      hoverColor: 'hover:border-indigo-400 hover:shadow-indigo-400/50',
    }
  ];

  const renderActiveView = () => {
    switch (activeView) {
      case 'hours':
        return <TimesheetApp employeeId={employeeId} />;
      case 'costs':
        return <CostReport />;
      case 'weekly':
        return <WeeklyReport employeeId={employeeId} />;
      case 'projects':
        return <ProjectCostsReport />;
      case 'profiles':
        return <ProfileCostsReport />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header Modificado con Navegación */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            
            {/* Logo e Info - Clickeable para ir a Home */}
            <div 
              className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setActiveView(null)}
            >
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                PSA
              </h1>
            </div>

            {/* Nueva Barra de Navegación */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 
                    ${activeView === item.id 
                      ? 'bg-slate-700 text-emerald-400 shadow-sm border border-slate-600' 
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

             <div className="flex items-center gap-4">
                {userData ? (
                    <div className="flex items-center gap-3 pl-4 border-l border-slate-700/50">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-white leading-tight">
                                {userData.nombre} {userData.apellido}
                            </p>
                            <p className="text-xs text-slate-400">
                                DNI: {userData.dni}
                            </p>
                        </div>
                        {/* Avatar */}
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 p-[2px] shadow-lg shadow-blue-500/20">
                            <div className="h-full w-full rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-sm">
                                {userData.nombre ? userData.nombre.charAt(0) : 'U'}
                                {userData.apellido ? userData.apellido.charAt(0) : ''}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 animate-pulse">
                        <div className="h-8 w-24 bg-slate-700 rounded"></div>
                        <div className="h-10 w-10 bg-slate-700 rounded-full"></div>
                    </div>
                )}
            </div>

            {/* Menú móvil simple (opcional, visible solo si la pantalla es muy chica) */}
            <div className="md:hidden">
               {/* Aquí podrías poner un menú hamburguesa, por ahora solo mostramos el ID */}
            </div>
            
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeView ? (
          <div className="space-y-6">
            {/* Botón Volver adicional */}
            <button
              onClick={() => setActiveView(null)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/70 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Panel Principal
            </button>
            
            <div className="bg-slate-800/30 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
              {renderActiveView()}
            </div>
          </div>
        ) : (
          <>
            {/* Welcome Section */}
            <div className="text-center mb-12 pt-8">
              <h2 className="text-4xl font-bold mb-3">Panel de Control</h2>
              <p className="text-slate-400 text-lg">Bienvenido. Selecciona una opción para gestionar.</p>
            </div>

            {/* Menu Cards (Se mantienen para la vista principal) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {menuOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => setActiveView(option.id)}
                    className={`group relative bg-slate-800/50 backdrop-blur-sm rounded-2xl border-2 ${option.borderColor} ${option.hoverColor} transition-all duration-300 hover:scale-105 hover:shadow-2xl p-8 text-left overflow-hidden`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                    <div className="relative z-10">
                      <div className={`w-16 h-16 ${option.bgColor} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold mb-2 group-hover:text-white transition-colors">
                        {option.title}
                      </h3>
                      <p className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors">
                        {option.description}
                      </p>
                      <div className="mt-6 flex items-center gap-2 text-slate-500 group-hover:text-emerald-400 transition-colors">
                        <span className="text-sm font-medium">Acceder</span>
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}