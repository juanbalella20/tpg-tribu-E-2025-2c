import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, User } from 'lucide-react';

export default function WeeklyReport() {
  // Empleado actual (simulado - en producción vendría de la sesión)
  const [currentEmployee] = useState({
    id: 18423123859,
    name: 'Lautaro',
    lastName: 'Martinez'
  });

  const [weeklyData] = useState({
    'Lunes 24': [
      { task: 'Tarea Y', project: 'Proyecto 1', hours: 6, color: 'bg-pink-300' },
      { task: 'Tarea X', project: 'Proyecto 1', hours: 4, color: 'bg-yellow-200' }
    ],
    'Martes 25': [
      { task: 'Tarea Y', project: 'Proyecto 1', hours: 6, color: 'bg-pink-300' }
    ],
    'Miercoles 26': [
      { task: 'Tarea X', project: 'Proyecto 1', hours: 6, color: 'bg-yellow-200' },
      { task: 'Tarea Y', project: 'Proyecto 1', hours: 6, color: 'bg-pink-300' }
    ],
    'Jueves 27': [
      { task: 'Tarea Y', project: 'Proyecto 1', hours: 6, color: 'bg-pink-300' },
      { task: 'Trayecto Z', project: 'Proyecto 2', hours: 2, color: 'bg-green-200' }
    ],
    'Viernes 28': [
      { task: 'Tarea Y', project: 'Proyecto 1', hours: 6, color: 'bg-pink-300' },
      { task: 'Tarea P', project: 'Proyecto 3', hours: 3, color: 'bg-blue-200' }
    ],
    'Sabado 29': [],
    'Domingo 30': [
      { task: 'Tarea Y', project: 'Proyecto 1', hours: 6, color: 'bg-pink-300' },
      { task: 'Tarea Z', project: 'Proyecto 2', hours: 4, color: 'bg-green-200' }
    ]
  });

  const [currentWeekStart, setCurrentWeekStart] = useState('24 de octubre');

  const weekDays = ['Lunes 24', 'Martes 25', 'Miercoles 26', 'Jueves 27', 'Viernes 28', 'Sabado 29', 'Domingo 30'];

  const calculateWeekTotal = () => {
    return Object.values(weeklyData).flat().reduce((sum, task) => sum + task.hours, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navbar */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-8">
            <button className="text-2xl font-bold hover:text-emerald-400 transition-colors">
              PSA
            </button>
            <nav className="flex items-center gap-2">
              <button className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-sm">
                Cargar Horas
              </button>
              <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium">
                Reporte Semanal
              </button>
              <button className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-sm">
                Reporte Costos
              </button>
              <button className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-sm">
                Reporte Finanzas
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Título centrado */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Mis Horas Trabajadas</h2>
          <p className="text-slate-400">Reporte semanal de tu carga horaria</p>
        </div>

        {/* Navegación de semana */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setCurrentWeekStart('Semana anterior')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Semana anterior
            </button>
            
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center mb-1">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-semibold">Semana del {currentWeekStart}</h2>
              </div>
            </div>

            <button 
              onClick={() => setCurrentWeekStart('Semana siguiente')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              Semana siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabla de reporte */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700 flex items-center justify-between bg-slate-800/70">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                <User className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {currentEmployee.name} {currentEmployee.lastName}
                </h3>
                <p className="text-sm text-slate-400">ID {currentEmployee.id}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-emerald-400">{calculateWeekTotal()}h</div>
              <div className="text-xs text-slate-400">Total semanal</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Encabezado con escala de horas */}
              <div className="flex border-b border-slate-700 bg-slate-800/50">
                <div className="w-32 flex-shrink-0 p-4 font-semibold text-slate-300 border-r border-slate-700">
                  Día
                </div>
                <div className="flex-1 relative h-12">
                  <div className="absolute inset-0 flex">
                    {Array.from({ length: 24 }, (_, i) => (
                      <div key={i} className="flex-1 border-r border-slate-700/30 text-center">
                        <span className="text-xs text-slate-500">{i + 1}h</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="w-24 flex-shrink-0 p-4 text-center font-semibold text-slate-300 border-l border-slate-700">
                  Total
                </div>
              </div>

              {/* Filas de días */}
              {weekDays.map(day => {
                const dayTasks = weeklyData[day] || [];
                const dayTotal = dayTasks.reduce((sum, task) => sum + task.hours, 0);
                
                return (
                  <div key={day} className="flex border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                    <div className="w-32 flex-shrink-0 p-4 font-medium border-r border-slate-700 flex items-center">
                      {day}
                    </div>
                    <div className="flex-1 relative min-h-20">
                      {/* Líneas de fondo */}
                      <div className="absolute inset-0 flex">
                        {Array.from({ length: 24 }, (_, i) => (
                          <div key={i} className="flex-1 border-r border-slate-700/20"></div>
                        ))}
                      </div>
                      
                      {/* Tareas con posicionamiento absoluto basado en horas */}
                      <div className="relative h-full py-3">
                        {dayTasks.length === 0 ? (
                          <span className="text-slate-500 text-sm italic ml-2">Sin horas registradas</span>
                        ) : (
                          <div className="absolute inset-0 py-3 flex">
                            {dayTasks.map((task, idx) => {
                              const widthPercentage = (task.hours / 24) * 100;
                              
                              return (
                                <div
                                  key={idx}
                                  className={`${task.color} rounded-lg px-3 py-2 text-slate-900 text-sm font-medium shadow-sm`}
                                  style={{
                                    width: `${widthPercentage}%`
                                  }}
                                >
                                  <div className="font-semibold truncate">{task.task}</div>
                                  <div className="text-xs opacity-75 truncate">{task.project} - {task.hours}h</div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-24 flex-shrink-0 p-4 text-center border-l border-slate-700 flex items-center justify-center">
                      <span className="font-bold text-emerald-400 text-lg">{dayTotal}h</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}