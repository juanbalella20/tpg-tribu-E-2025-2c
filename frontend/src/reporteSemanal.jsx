import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, User, Loader2, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function WeeklyReport({ employeeId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isMetadataLoading, setIsMetadataLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState({});
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [taskLookup, setTaskLookup] = useState({}); 
  const [error, setError] = useState(null);

  const [currentEmployee, setCurrentEmployee] = useState({});

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        let url;
        
        if (employeeId) {
          url = `${API_URL}/employees/${employeeId}`;
        }

        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          setCurrentEmployee({
            id: data.employee_id,
            name: data.nombre, 
            lastName: data.apellido,
            dni: data.dni
          });
        } else {
          console.error("Error respuesta API usuario:", response.status);
          setCurrentEmployee(prev => ({ ...prev, name: 'Usuario', lastName: 'Desconocido' }));
        }
      } catch (err) {
        console.error("Error fetch usuario:", err);
      }
    };

    fetchEmployeeData();
  }, [employeeId]);

  // --- UTILIDADES DE FECHA ---

  const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  // Función para formatear fecha como YYYY-MM-DD
  const formatDate = (date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().split('T')[0];
  };

  // Función para obtener los días de la semana
  const getWeekDays = useCallback((monday) => {
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
  }, []);

  // --- CARGA DE DATOS ---

  // 1. Cargar Proyectos y Tareas (Metadatos) para saber los nombres y colores
  const fetchMetadata = useCallback(async () => {
    if (!currentEmployee.id) return;
    setIsMetadataLoading(true);
    setError(null);

    try {
      // A. Obtener todos los proyectos
      const projectsRes = await fetch(`${API_URL}/projects/`);
      if (!projectsRes.ok) throw new Error("Error cargando proyectos");
      const projectsData = await projectsRes.json();

      // B. Obtener tareas de cada proyecto para este empleado
      // (Necesitamos esto para mapear ID_TAREA -> NOMBRE_TAREA)
      const tasksPromises = projectsData.map(project => 
        fetch(`${API_URL}/projects/${project.id}/tasks/`)
          .then(res => res.ok ? res.json() : [])
          .then(tasks => tasks.map(t => ({ ...t, projectColor: project.color, projectName: project.name })))
      );

      const tasksResults = await Promise.all(tasksPromises);
      const allTasks = tasksResults.flat();

      // C. Crear un mapa de búsqueda rápida: { [idTarea]: { nombre, proyecto, color } }
      const lookup = {};
      allTasks.forEach(task => {
        lookup[task.id] = {
          name: task.name,
          projectName: task.projectName,
          color: task.projectColor || 'bg-slate-500' // Fallback color
        };
      });

      setTaskLookup(lookup);

    } catch (err) {
      console.error("Error fetching metadata:", err);
      setError("No se pudo cargar la información de proyectos y tareas.");
    } finally {
      setIsMetadataLoading(false);
    }
  }, [currentEmployee.id]);

  // Ejecutar carga de metadatos al montar o cambiar empleado
  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);


  // 2. Cargar Horas de la semana
  const fetchWeekData = useCallback(async () => {
    if (!currentEmployee.id || isMetadataLoading) return;

    setIsLoading(true);
    try {
      const monday = getMonday(currentWeekStart);
      const mondayStr = formatDate(monday);
      const weekDays = getWeekDays(monday);

      const response = await fetch(`${API_URL}/horas/${currentEmployee.id}/${mondayStr}`);

      if (response.ok) {
        const data = await response.json();

        // Agrupar datos por fecha
        const groupedData = {};
        weekDays.forEach(day => {
          groupedData[day.displayName] = [];
        });

        // Procesar registros
        data.forEach(entry => {
          // Normalizar fecha para evitar problemas de zona horaria simples
          const dayInfo = weekDays.find(d => d.dateStr === entry.fecha);

          if (dayInfo) {
            // Buscar info de la tarea en nuestro mapa cargado previamente
            // Nota: Forzamos String() porque a veces los IDs vienen como números o strings
            const taskInfo = taskLookup[String(entry.id_tarea)] || taskLookup[Number(entry.id_tarea)];
            
            groupedData[dayInfo.displayName].push({
              id: entry.id_tarea, // Necesario para key
              task: taskInfo ? taskInfo.name : `Tarea ID: ${entry.id_tarea}`,
              project: taskInfo ? taskInfo.projectName : 'Desconocido',
              hours: parseFloat(entry.cantidad),
              color: taskInfo ? taskInfo.color : 'bg-slate-600',
              estado: entry.estado
            });
          }
        });

        setWeeklyData(groupedData);
      } else {
        throw new Error("Error cargando horas semanales");
      }
    } catch (error) {
      console.error("Error fetching week data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentEmployee.id, currentWeekStart, isMetadataLoading, taskLookup, getWeekDays]);

  // Cargar horas cuando cambia la semana o terminan de cargar los metadatos
  useEffect(() => {
    fetchWeekData();
  }, [fetchWeekData]);

  // --- NAVEGACIÓN ---

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

  // --- CÁLCULO DE UI ---

  const calculateUniformColumnWidth = () => {
    const allTasks = Object.values(weeklyData).flat();
    let maxWidthPerHour = 80;

    allTasks.forEach(task => {
      const hours = task.hours;
      const taskTextLength = task.task.length;
      const projectTextLength = `${task.project} - ${task.hours}h`.length;
      const maxTextLength = Math.max(taskTextLength, projectTextLength);
      const estimatedTotalWidth = maxTextLength * 8 + 40; 
      const widthPerHour = estimatedTotalWidth / hours;

      if (widthPerHour > maxWidthPerHour) {
        maxWidthPerHour = widthPerHour;
      }
    });

    return maxWidthPerHour;
  };

  const uniformColumnWidth = calculateUniformColumnWidth();
  const weekDays = getWeekDays(getMonday(currentWeekStart));

  const getWeekRangeDisplay = () => {
    const monday = getMonday(currentWeekStart);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const options = { day: 'numeric', month: 'long' };
    const mondayStr = monday.toLocaleDateString('es-AR', options);
    const sundayStr = sunday.toLocaleDateString('es-AR', options);

    return `${mondayStr} - ${sundayStr}`;
  };

  // --- RENDER ---

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 text-center text-red-400 bg-red-900/20 rounded-xl border border-red-800">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <h3 className="text-xl font-bold">Error de conexión</h3>
        <p>{error}</p>
        <button 
          onClick={fetchMetadata}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 text-slate-200">
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
            disabled={isLoading || isMetadataLoading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Semana anterior
          </button>

          <div className="text-center">
            <div className="flex items-center gap-2 justify-center mb-1">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold">
                {isLoading || isMetadataLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Cargando...</span>
                  </div>
                ) : (
                  `Semana del ${getWeekRangeDisplay()}`
                )}
              </h2>
            </div>
          </div>

          <button
            onClick={goToNextWeek}
            disabled={isLoading || isMetadataLoading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 rounded-lg transition-colors"
          >
            Semana siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabla de reporte */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between bg-slate-800/70">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
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
            <div className="text-3xl font-bold text-emerald-400">
              {isMetadataLoading ? '-' : calculateWeekTotal()}h
            </div>
            <div className="text-xs text-slate-400">Total semanal</div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <div className="inline-block min-w-full">
            {/* Encabezado con escala de horas */}
            <div className="flex border-b border-slate-700 bg-slate-900/50 sticky top-0 z-10">
              <div className="w-32 flex-shrink-0 p-4 font-semibold text-slate-300 border-r border-slate-700 bg-slate-900/50 sticky left-0 z-20">
                Día
              </div>
              <div className="w-24 flex-shrink-0 p-4 text-center font-semibold text-slate-300 border-r border-slate-700 bg-slate-900/50">
                Total
              </div>
              <div className="flex relative h-12">
                {Array.from({ length: 24 }, (_, i) => {
                  const hourNum = i + 1;
                  return (
                    <div key={i} className="border-r border-slate-700/30 text-center px-2 flex-shrink-0 flex items-center justify-center" style={{ width: `${uniformColumnWidth}px` }}>
                      <span className="text-xs text-slate-500 font-mono">{hourNum}h</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Filas de días */}
            {isMetadataLoading ? (
               <div className="p-12 text-center text-slate-500">
                 <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                 <p>Sincronizando proyectos...</p>
               </div>
            ) : (
              weekDays.map(day => {
                const dayTasks = weeklyData[day.displayName] || [];
                const dayTotal = dayTasks.reduce((sum, task) => sum + task.hours, 0);

                return (
                  <div key={day.displayName} className="flex border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors group">
                    {/* Nombre del día (Sticky left) */}
                    <div className="w-32 flex-shrink-0 p-4 font-medium border-r border-slate-700 flex items-center bg-slate-800/30 sticky left-0 z-10 group-hover:bg-slate-700/80 transition-colors backdrop-blur-md">
                      {day.displayName}
                    </div>
                    {/* Total diario */}
                    <div className="w-24 flex-shrink-0 p-4 text-center border-r border-slate-700 flex items-center justify-center bg-slate-800/10">
                      <span className={`font-bold text-lg ${dayTotal > 8 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {dayTotal}h
                      </span>
                    </div>
                    {/* Grilla de horas */}
                    <div className="flex relative min-h-[5rem]">
                      {/* Columnas de fondo (Grid lines) */}
                      {Array.from({ length: 24 }, (_, hourIndex) => {
                        return (
                          <div key={hourIndex} className="border-r border-slate-700/20 relative flex-shrink-0" style={{ width: `${uniformColumnWidth}px` }}>
                          </div>
                        );
                      })}

                      {/* Tareas superpuestas */}
                      <div className="absolute inset-0 py-3 px-2">
                        {dayTasks.length === 0 ? (
                          <span className="text-slate-600 text-sm italic ml-2 mt-2 inline-block">Sin actividad registrada</span>
                        ) : (
                          dayTasks.map((task, idx) => {
                            // Calcular el ancho: ancho de columna × número de horas
                            const taskWidth = uniformColumnWidth * task.hours;

                            // Calcular la posición de inicio basada en las tareas anteriores
                            let leftOffset = 0;
                            for (let i = 0; i < idx; i++) {
                              const prevTask = dayTasks[i];
                              leftOffset += uniformColumnWidth * prevTask.hours;
                              leftOffset += 8; // gap
                            }

                            return (
                              <div
                                key={`${task.id}-${idx}`}
                                className={`${task.color} rounded-lg px-3 py-2 text-white text-sm font-medium shadow-md whitespace-nowrap absolute border border-white/10 hover:brightness-110 transition-all cursor-default z-0 hover:z-10`}
                                style={{
                                  width: `${taskWidth}px`,
                                  left: `${leftOffset}px`,
                                  top: '12px'
                                }}
                                title={`${task.task} (${task.hours}h) - ${task.estado}`}
                              >
                                <div className="font-bold truncate drop-shadow-md">{task.task}</div>
                                <div className="text-xs opacity-90 truncate flex justify-between gap-2">
                                  <span>{task.project}</span>
                                  <span className="font-mono bg-black/20 px-1 rounded">{task.hours}h</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}