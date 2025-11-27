import React, { useState, useEffect } from 'react';
import { Search, Calendar, Clock, Plus, X, Check, Loader2, Trash2 } from 'lucide-react';

const API_URL = "http://localhost:5000/api";

const formatDate = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

export default function TimesheetApp({ employeeId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [projects, setProjects] = useState([]); 
  const [tasks, setTasks] = useState([]);

  const now = new Date();
  const minSelectableDate = new Date(now);
  minSelectableDate.setDate(now.getDate() - 7);
  const maxSelectableDate = new Date(now);
  maxSelectableDate.setDate(now.getDate() + 1);

  const minDateString = formatDate(minSelectableDate);
  const maxDateString = formatDate(maxSelectableDate);
  const todayString = formatDate(now);

  const [selectedProject, setSelectedProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayString);
  const [timeEntries, setTimeEntries] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`${API_URL}/projects/`);
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (error) {
        console.error("Error cargando proyectos:", error);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    if (!selectedProject || !employeeId) {
      setTasks([]);
      return;
    }

    const fetchTasks = async () => {
      try {
        const response = await fetch(`${API_URL}/projects/${selectedProject}/${employeeId}/tasks/`);
        if (response.ok) {
          const data = await response.json();
          setTasks(data);
        } else {
          setTasks([]);
        }
      } catch (error) {
        console.error("Error cargando tareas del proyecto:", error);
        setTasks([]);
      }
    };

    fetchTasks();
  }, [selectedProject, employeeId]);

  useEffect(() => {
    if (!employeeId || !selectedDate) return;

    const fetchHours = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/horas/${employeeId}/${selectedDate}`);
        if (response.ok) {
            const data = await response.json();
            const daysEntries = data.filter(entry => entry.fecha === selectedDate);
            
            const mappedEntries = daysEntries.map(entry => {
                const taskDef = tasks.find(t => t.id === entry.id_tarea);
                
                return {
                    taskId: entry.id_tarea,
                    taskName: taskDef ? taskDef.name : 'Tarea registrada',
                    projectId: taskDef ? taskDef.projectId : null,
                    date: entry.fecha,
                    hours: parseFloat(entry.cantidad)
                };
            });
            setTimeEntries(mappedEntries);
        }
      } catch (error) {
        console.error("Error fetching hours:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHours();
  }, [employeeId, selectedDate, tasks]);
  const filteredTasks = tasks.filter(task => {
    return task.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleDateChange = (value) => {
    if (!value) return;
    if (value < minDateString) setSelectedDate(minDateString);
    else if (value > maxDateString) setSelectedDate(maxDateString);
    else setSelectedDate(value);
  };

  const addTimeEntry = (task) => {
    const existing = timeEntries.find(e => e.taskId === task.id && e.date === selectedDate);
    if (!existing) {
      setTimeEntries([...timeEntries, { 
        taskId: task.id, 
        taskName: task.name,
        projectId: task.projectId,
        date: selectedDate, 
        hours: 1 
      }]);
    }
  };

  const updateHours = (taskId, hours) => {
    setTimeEntries(timeEntries.map(e => 
      e.taskId === taskId && e.date === selectedDate ? { ...e, hours: parseFloat(hours) || 0 } : e
    ));
  };

  const removeEntry = async (taskId) => {
    setIsDeleting(taskId);
    try {
        const response = await fetch(`${API_URL}/horas/${employeeId}/${taskId}/${selectedDate}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            setTimeEntries(prevEntries => prevEntries.filter(e => !(e.taskId === taskId && e.date === selectedDate)));
            setSuccessMessage("Registro eliminado");
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } else {
            console.error("Error al eliminar en backend");
            alert("No se pudo eliminar el registro. Intente nuevamente.");
        }
    } catch (error) {
        console.error("Error de red:", error);
        alert("Error de conexión al intentar eliminar.");
    } finally {
        setIsDeleting(null);
    }
  };

  const saveEntries = async () => {
    if (!employeeId) return;

    const entriesToSave = timeEntries.filter(e => e.date === selectedDate);

    const totalHorasDia = entriesToSave.reduce((total, entry) => {
        return total + (parseFloat(entry.hours) || 0);
    }, 0);

    if (totalHorasDia > 24) {
        alert(`El total de horas cargadas para hoy suma ${totalHorasDia} horas.\nNo puede superar las 24 horas.`);
        return;
    }
    for (const entry of entriesToSave) {
        const horas = parseFloat(entry.hours);
        if (horas > 0) {
            if (!Number.isInteger(horas * 2)) {
                alert(`Error en tarea "${entry.taskName}":\nLas horas (${horas}) deben ser múltiplos de 0.5 (ej: 1, 1.5, 2...).`);
                return;
            }
        }
    }

    setIsLoading(true);

    try {
      const promises = entriesToSave.map(entry => {
        const horas = parseFloat(entry.hours) || 0;

        if (horas > 0) {
            const payload = {
                id_empleado: employeeId,
                id_tarea: entry.taskId,
                cantidad: horas,
                fecha: entry.date
            };
            
            return fetch(`${API_URL}/horas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            return fetch(`${API_URL}/horas/${employeeId}/${entry.taskId}/${entry.date}`, {
                method: 'DELETE'
            });
        }
      });

      await Promise.all(promises);
      
      // Limpieza visual: Quitamos de la lista local las tareas que quedaron en 0
      setTimeEntries(prevEntries => {
        return prevEntries.filter(e => {
            if (e.date !== selectedDate) return true;
            const horas = parseFloat(e.hours) || 0;
            return horas > 0;
        });
      });

      setSuccessMessage("Horas guardadas exitosamente");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving hours:", error);
      alert("Error al guardar las horas");
    } finally {
      setIsLoading(false);
    }
  };

  const todayEntries = timeEntries.filter(e => e.date === selectedDate);
  const totalHours = todayEntries.reduce((sum, e) => sum + e.hours, 0);

  return (
    <div className="min-h-screen bg-transparent text-white">
      {/* Header interno */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10 rounded-t-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Carga de Horas</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-400">
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : `${totalHours.toFixed(1)}h`}
                </div>
                <div className="text-xs text-slate-400">Total del día</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel izquierdo - Selección */}
          <div className="lg:col-span-2 space-y-4">
            {/* Fecha */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-4">
              <label className="text-sm text-slate-400 mb-2 block flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Fecha
              </label>
              <input
                type="date"
                value={selectedDate}
                min={minDateString}
                max={maxDateString}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Filtros */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-4">
              <label className="text-sm text-slate-400 mb-2 block">Proyecto</label>
              <div className="flex gap-2 flex-wrap">
                {projects.map(project => (
                  <button
                    key={project.id}
                    onClick={() =>
                      setSelectedProject(selectedProject === project.id ? null : project.id)
                    }
                    className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                      selectedProject === project.id
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${project.color}`}></div>
                    {project.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de tareas */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
              <div className="p-4 border-b border-slate-700 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold">Tareas Disponibles</h3>
                  <p className="text-sm text-slate-400 mt-1">{filteredTasks.length} tareas encontradas</p>
                </div>
                <div className="w-full md:w-72">
                  <label className="text-sm text-slate-400 mb-2 block flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Buscar tarea
                  </label>
                  <input
                    type="text"
                    placeholder="Escribe para buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {filteredTasks.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    No se encontraron tareas
                  </div>
                ) : (
                  filteredTasks.map(task => {
                    const project = projects.find(p => p.id === task.projectId);
                    const alreadyAdded = todayEntries.some(e => e.taskId === task.id);
                    return (
                      <div
                        key={task.id}
                        className="p-4 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-2 h-2 rounded-full ${project.color}`}></div>
                          <div>
                            <div className="font-medium">{task.name}</div>
                            <div className="text-xs text-slate-400">{project.name}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => addTimeEntry(task)}
                          disabled={alreadyAdded || isLoading}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                            alreadyAdded
                              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                          }`}
                        >
                          {alreadyAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          {alreadyAdded ? 'Agregada' : 'Agregar'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Panel derecho - Horas cargadas */}
          <div className="space-y-4">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden sticky top-24">
              <div className="p-4 border-b border-slate-700 bg-slate-800/70">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  Horas del {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-AR')}
                </h3>
              </div>
              
              <div className="max-h-[500px] overflow-y-auto p-4 space-y-3">
                {isLoading && todayEntries.length === 0 ? (
                   <div className="text-center py-12 text-slate-400 flex flex-col items-center">
                       <Loader2 className="w-8 h-8 animate-spin mb-2" />
                       <p>Cargando horas...</p>
                   </div>
                ) : todayEntries.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No hay horas cargadas</p>
                    <p className="text-sm mt-1">Agrega tareas desde la lista</p>
                  </div>
                ) : (
                  todayEntries.map(entry => {
                    const project = projects.find(p => p.id === entry.projectId);
                    return (
                      <div key={entry.taskId} className="bg-slate-700/30 rounded-lg p-3 border border-slate-600">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{entry.taskName}</div>
                            <div className="flex items-center gap-2 mt-1">
                              {project && <div className={`w-2 h-2 rounded-full ${project.color}`}></div>}
                              <div className="text-xs text-slate-400">{project ? project.name : 'Proyecto N/A'}</div>
                            </div>
                          </div>
                          
                          {/* BOTÓN DE ELIMINAR CON LOGICA DE BORRADO DE BD */}
                          <button
                            onClick={() => removeEntry(entry.taskId)}
                            disabled={isDeleting === entry.taskId}
                            className="text-slate-400 hover:text-red-400 transition-colors p-2 hover:bg-slate-600/50 rounded-lg"
                            title="Eliminar de la base de datos"
                          >
                            {isDeleting === entry.taskId ? (
                                <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                            ) : (
                                <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0.5"
                            max="24"
                            step="0.5"
                            value={entry.hours}
                            onChange={(e) => updateHours(entry.taskId, e.target.value)}
                            className="w-full bg-slate-600/50 border border-slate-500 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <span className="text-slate-400 text-sm whitespace-nowrap">horas</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {todayEntries.length > 0 && (
                <div className="p-4 border-t border-slate-700 bg-slate-800/70">
                  <button
                    onClick={saveEntries}
                    disabled={isLoading}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:text-slate-400 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    {isLoading ? 'Guardando...' : 'Actualizar Horas'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notificación de éxito */}
      {showSuccess && (
        <div className="fixed bottom-6 right-6 bg-emerald-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom">
          <Check className="w-5 h-5" />
          <div>
            <div className="font-semibold">{successMessage || "¡Operación exitosa!"}</div>
            <div className="text-sm opacity-90">{totalHours.toFixed(1)} horas en total</div>
          </div>
        </div>
      )}
    </div>
  );
}