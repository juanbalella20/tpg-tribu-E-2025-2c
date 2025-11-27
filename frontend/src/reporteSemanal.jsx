import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, User, Loader2 } from 'lucide-react';

const API_URL = "http://localhost:5000/api";

// Datos estáticos de proyectos y tareas (igual que en cargaDehoras.jsx)
const projects = [
  { id: 1, name: 'Proyecto 1', color: 'bg-red-500' },
  { id: 2, name: 'Proyecto 2', color: 'bg-purple-500' },
  { id: 3, name: 'Proyecto 3', color: 'bg-blue-500' },
  { id: 4, name: 'Proyecto 4', color: 'bg-green-500' }
];

const tasks = [
  { id: 1, projectId: 1, name: 'Diseño de interfaz' },
  { id: 2, projectId: 1, name: 'Desarrollo frontend' },
  { id: 3, projectId: 1, name: 'Testing de componentes' },
  { id: 4, projectId: 2, name: 'Configuración servidor' },
  { id: 5, projectId: 2, name: 'API REST' },
  { id: 6, projectId: 2, name: 'Documentación técnica' },
  { id: 7, projectId: 3, name: 'Análisis de requisitos' },
  { id: 8, projectId: 3, name: 'Base de datos' },
  { id: 9, projectId: 3, name: 'Integración de sistemas' },
  { id: 10, projectId: 4, name: 'Revisión de código' },
  { id: 11, projectId: 4, name: 'Optimización' },
  { id: 12, projectId: 4, name: 'Deploy producción' }
];

// Colores para las tareas
const taskColors = [
  'bg-pink-300', 'bg-yellow-200', 'bg-green-200', 'bg-blue-200',
  'bg-purple-200', 'bg-orange-200', 'bg-teal-200', 'bg-indigo-200'
];

export default function WeeklyReport({ employeeId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [weeklyData, setWeeklyData] = useState({});
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());

  // Empleado actual (usamos el prop o un valor por defecto)
  const [currentEmployee] = useState({
    id: employeeId || 18423123859,
    name: 'Lautaro',
    lastName: 'Martinez'
  });

  // Función para obtener el lunes de una semana dada
  const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar cuando es domingo
    return new Date(d.setDate(diff));
  };

  // Función para formatear fecha como YYYY-MM-DD
  const formatDate = (date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().split('T')[0];
  };

  // Función para obtener los días de la semana
  const getWeekDays = (monday) => {
    const days = [];
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      days.push({
        name: dayNames[i],
        date: date,
        dateStr: formatDate(date),
        displayName: `${dayNames[i]} ${date.getDate()}`
      });
    }
    return days;
  };

  const weekDays = getWeekDays(getMonday(currentWeekStart));

  // Función para cargar datos de la semana
  const fetchWeekData = async () => {
    if (!currentEmployee.id) return;

    setIsLoading(true);
    try {
      // Usamos el lunes de la semana actual como referencia
      const monday = getMonday(currentWeekStart);
      const mondayStr = formatDate(monday);

      const response = await fetch(`${API_URL}/horas/${currentEmployee.id}/${mondayStr}`);

      if (response.ok) {
        const data = await response.json();

        // Agrupar datos por fecha
        const groupedData = {};
        weekDays.forEach(day => {
          groupedData[day.displayName] = [];
        });

        // Mapear los datos recibidos
        data.forEach(entry => {
          const entryDate = new Date(entry.fecha + 'T00:00:00');
          const dayInfo = weekDays.find(d => d.dateStr === entry.fecha);

          if (dayInfo) {
            const taskInfo = tasks.find(t => t.id === entry.id_tarea);
            const projectInfo = taskInfo ? projects.find(p => p.id === taskInfo.projectId) : null;

            // Asignar color basado en el id de tarea
            const colorIndex = (entry.id_tarea - 1) % taskColors.length;

            groupedData[dayInfo.displayName].push({
              task: taskInfo ? taskInfo.name : `Tarea ${entry.id_tarea}`,
              project: projectInfo ? projectInfo.name : 'Proyecto desconocido',
              hours: parseFloat(entry.cantidad),
              color: taskColors[colorIndex],
              estado: entry.estado
            });
          }
        });

        setWeeklyData(groupedData);
      }
    } catch (error) {
      console.error("Error fetching week data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos cuando cambia la semana
  useEffect(() => {
    fetchWeekData();
  }, [currentWeekStart, currentEmployee.id]);

  // Navegación de semanas
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const calculateWeekTotal = () => {
    return Object.values(weeklyData).flat().reduce((sum, task) => sum + task.hours, 0);
  };

  // Formatear el rango de la semana para mostrar
  const getWeekRangeDisplay = () => {
    const monday = getMonday(currentWeekStart);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const options = { day: 'numeric', month: 'long' };
    const mondayStr = monday.toLocaleDateString('es-AR', options);
    const sundayStr = sunday.toLocaleDateString('es-AR', options);

    return `${mondayStr} - ${sundayStr}`;
  };

  return (
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
            onClick={goToPreviousWeek}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Semana anterior
          </button>

          <div className="text-center">
            <div className="flex items-center gap-2 justify-center mb-1">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin inline" />
                ) : (
                  `Semana del ${getWeekRangeDisplay()}`
                )}
              </h2>
            </div>
          </div>

          <button
            onClick={goToNextWeek}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 rounded-lg transition-colors"
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
              const dayTasks = weeklyData[day.displayName] || [];
              const dayTotal = dayTasks.reduce((sum, task) => sum + task.hours, 0);

              return (
                <div key={day.displayName} className="flex border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                  <div className="w-32 flex-shrink-0 p-4 font-medium border-r border-slate-700 flex items-center">
                    {day.displayName}
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
  );
}