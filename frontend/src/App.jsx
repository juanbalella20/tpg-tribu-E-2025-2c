import React, { useState } from 'react';
import './App.css';
import { Clock, DollarSign, Calendar, User, ArrowLeft } from 'lucide-react';
import TimesheetApp from './cargaDehoras.jsx';
import CostReport from './reporteCostos.jsx';
import WeeklyReport from './reporteSemanal.jsx';


export default function App() {
  const [activeView, setActiveView] = useState(null);

  const menuOptions = [
    {
      id: 'hours',
      title: 'Cargar Horas',
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
    }
  ];

  const renderActiveView = () => {
    switch (activeView) {
      case 'hours':
        return <TimesheetApp />;
      case 'costs':
        return <CostReport />;
      case 'weekly':
        return <WeeklyReport />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">PSA</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                  <User className="w-5 h-5 text-slate-300" />
                </div>
              </div>
              <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {activeView ? (
          <div className="space-y-6">
            <button
              onClick={() => setActiveView(null)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/70 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al panel
            </button>
            <div className="bg-slate-800/30 rounded-2xl border border-slate-700 overflow-hidden">
              {renderActiveView()}
            </div>
          </div>
        ) : (
          <>
            {/* Welcome Section */}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-3">Panel de Control</h2>
              <p className="text-slate-400 text-lg">Selecciona una opción para comenzar</p>
            </div>

            {/* Menu Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {menuOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => setActiveView(option.id)}
                    className={`group relative bg-slate-800/50 backdrop-blur-sm rounded-2xl border-2 ${option.borderColor} ${option.hoverColor} transition-all duration-300 hover:scale-105 hover:shadow-2xl p-8 text-left overflow-hidden`}
                  >
                    {/* Background Gradient Effect */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                    ></div>

                    {/* Content */}
                    <div className="relative z-10">
                      {/* Icon */}
                      <div
                        className={`w-16 h-16 ${option.bgColor} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold mb-2 group-hover:text-white transition-colors">
                        {option.title}
                      </h3>

                      {/* Description */}
                      <p className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors">
                        {option.description}
                      </p>

                      {/* Arrow indicator */}
                      <div className="mt-6 flex items-center gap-2 text-slate-500 group-hover:text-emerald-400 transition-colors">
                        <span className="text-sm font-medium">Acceder</span>
                        <svg
                          className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Decorative corner */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full"></div>
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
