import React, { useState } from 'react';
import { Search, Calendar, Clock, Plus, X, Check } from 'lucide-react';

const formatDate = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

export default function TimesheetApp() {
  const [projects] = useState([
    { id: 1, name: 'Proyecto 1', color: 'bg-red-500' },
    { id: 2, name: 'Proyecto 2', color: 'bg-purple-500' },
    { id: 3, name: 'Proyecto 3', color: 'bg-blue-500' },
    { id: 4, name: 'Proyecto 4', color: 'bg-green-500' }
  ]);

  const [tasks] = useState([
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
  ]);

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

  const filteredTasks = tasks.filter(task => {
    const matchesProject = !selectedProject || task.projectId === selectedProject;
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesProject && matchesSearch;
  });

  const handleDateChange = (value) => {
    if (!value) return;
    if (value < minDateString) {
      setSelectedDate(minDateString);
      return;
    }
    if (value > maxDateString) {
      setSelectedDate(maxDateString);
      return;
    }
    setSelectedDate(value);
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

  const removeEntry = (taskId) => {
    setTimeEntries(timeEntries.filter(e => !(e.taskId === taskId && e.date === selectedDate)));
  };

  const saveEntries = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const todayEntries = timeEntries.filter(e => e.date === selectedDate);
  const totalHours = todayEntries.reduce((sum, e) => sum + e.hours, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">PSA - Carga de Horas</h1>
              <p className="text-slate-400 text-sm mt-1">Gestiona tu tiempo de forma eficiente</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-3xl font-bold text-emerald-400">{totalHours.toFixed(1)}h</div>
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
                          disabled={alreadyAdded}
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
                {todayEntries.length === 0 ? (
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
                              <div className={`w-2 h-2 rounded-full ${project.color}`}></div>
                              <div className="text-xs text-slate-400">{project.name}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeEntry(entry.taskId)}
                            className="text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="24"
                            step="0.25"
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
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Guardar Horas
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
            <div className="font-semibold">¡Guardado exitoso!</div>
            <div className="text-sm opacity-90">{totalHours.toFixed(1)} horas registradas</div>
          </div>
        </div>
      )}
    </div>
  );
}
