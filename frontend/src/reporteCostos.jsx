import React, { useEffect, useState, useMemo } from 'react';
import { DollarSign, Calendar, User, Loader2, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const PROJECTS_ENDPOINT = `${API_BASE_URL}/projects/`;

const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function CostReport() {
  const [projects, setProjects] = useState([]);
  const [projectEmployees, setProjectEmployees] = useState([]);
  const [costData, setCostData] = useState({});

  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingCostData, setIsLoadingCostData] = useState(false);
  const [projectError, setProjectError] = useState(null);
  const [costError, setCostError] = useState(null);

  // Generar años dinámicamente (año actual y 2 anteriores)
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2].map(String);
  }, []);

  // 1. Cargar lista de proyectos al iniciar
  useEffect(() => {
    const loadProjects = async () => {
      setIsLoadingProjects(true);
      setProjectError(null);

      try {
        const response = await fetch(PROJECTS_ENDPOINT);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || 'No se pudieron obtener los proyectos');
        }

        // La API devuelve un array directamente
        setProjects(Array.isArray(payload) ? payload : []);
      } catch (error) {
        console.error('Error al cargar proyectos:', error);
        setProjectError('No se pudieron cargar los proyectos. Verifica que el servidor esté corriendo.');
      } finally {
        setIsLoadingProjects(false);
      }
    };

    loadProjects();
  }, []);

  // 2. Cargar detalles del proyecto (empleados y costos) cuando cambia la selección
  useEffect(() => {
    if (!selectedProject || !selectedYear) return;

    const loadProjectInfo = async () => {
      setIsLoadingCostData(true);
      setCostError(null);

      try {
        // Endpoint corregido según api.py: /api/proyectos/<id>/info
        const response = await fetch(
          `${API_BASE_URL}/proyectos/${selectedProject}/info?anio=${encodeURIComponent(selectedYear)}`
        );
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || 'No se pudieron obtener los costos del proyecto');
        }

        // Procesar empleados
        const employees = (payload.empleados || []).map(employee => {
          // Intentar obtener nombre del rol de varias formas posibles según la API externa
          const roleName = employee.rol?.nombre || employee.rol?.name || employee.rol?.descripcion || 'Rol Estándar';
          
          return {
            id: String(employee.employeeId),
            displayName: `${employee.nombre || ''} ${employee.apellido || ''}`.trim() || 'Empleado Desconocido',
            profileLabel: roleName,
            costoHora: parseFloat(employee.costoHora || 0),
            totalHoras: parseFloat(employee.totalHorasProyecto || 0)
          };
        });

        // Procesar matriz de costos (Mes -> Empleado -> Costo)
        const normalizedCosts = {};
        Object.entries(payload.costos || {}).forEach(([monthKey, employeesCost]) => {
          const monthNumber = parseInt(monthKey, 10);
          if (Number.isNaN(monthNumber)) return;

          normalizedCosts[monthNumber] = {};
          Object.entries(employeesCost || {}).forEach(([employeeId, value]) => {
            normalizedCosts[monthNumber][String(employeeId)] = parseFloat(value) || 0;
          });
        });

        setProjectEmployees(employees);
        
        // Actualizar el estado global de costos
        setCostData(prev => ({
          ...prev,
          [selectedProject]: {
            ...(prev[selectedProject] || {}),
            [selectedYear]: normalizedCosts
          }
        }));

      } catch (error) {
        console.error('Error al obtener info del proyecto:', error);
        setProjectEmployees([]);
        // Limpiar datos para evitar mostrar información vieja en caso de error
        setCostData(prev => ({
          ...prev,
          [selectedProject]: {
            ...(prev[selectedProject] || {}),
            [selectedYear]: {}
          }
        }));
        setCostError(error.message || 'Error de conexión con el servicio de costos.');
      } finally {
        setIsLoadingCostData(false);
      }
    };

    loadProjectInfo();
  }, [selectedProject, selectedYear]);

  // --- Helpers de cálculo ---

  const getEmployeeCostForMonth = (employeeId, monthIndex) => {
    if (!selectedProject || !selectedYear) return 0;
    // La API devuelve meses base 1 (1=Enero), el array months es base 0
    const monthData = costData[selectedProject]?.[selectedYear]?.[monthIndex + 1];
    return monthData?.[employeeId] || 0;
  };

  const getMonthTotalCost = (monthIndex) => {
    if (!selectedProject || !selectedYear) return 0;
    const monthData = costData[selectedProject]?.[selectedYear]?.[monthIndex + 1];
    if (!monthData) return 0;
    return Object.values(monthData).reduce((sum, cost) => sum + cost, 0);
  };

  const getTotalCost = () => {
    if (!selectedProject || !selectedYear) return 0;
    let total = 0;
    const yearData = costData[selectedProject]?.[selectedYear];
    if (!yearData) return 0;

    Object.values(yearData).forEach(monthData => {
      Object.values(monthData).forEach(cost => {
        total += cost;
      });
    });
    return total;
  };

  const selectedProjectInfo = projects.find(p => String(p.id) === String(selectedProject));

  // --- Render ---

  if (isLoadingProjects) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col items-center text-center text-slate-300">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-emerald-400" />
        <p>Cargando lista de proyectos...</p>
      </div>
    );
  }

  if (projectError) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center">
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-6 inline-block">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 text-red-400" />
            <h2 className="text-xl font-semibold text-red-400 mb-2">Error de Conexión</h2>
            <p className="text-slate-300">{projectError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 text-slate-200">
      {/* Título centrado */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Reporte de Costos</h2>
        <p className="text-slate-400">Visualiza los costos anuales por proyecto y empleado</p>
      </div>

      {/* Selectores de proyecto y año */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Selector de proyecto */}
          <div>
            <label className="text-sm text-slate-400 mb-3 block font-medium">
              Seleccionar proyecto
            </label>
            <div className="flex gap-2 flex-wrap">
              {projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(String(project.id))}
                  className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 border ${
                    String(selectedProject) === String(project.id)
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${project.color || 'bg-slate-400'}`}></div>
                  {project.nombre || project.name}
                </button>
              ))}
            </div>
          </div>

          {/* Selector de año */}
          <div>
            <label className="text-sm text-slate-400 mb-3 block font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Seleccionar año
            </label>
            <div className="flex gap-2 flex-wrap">
              {years.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-6 py-2.5 rounded-lg transition-all border ${
                    selectedYear === year
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600 hover:border-slate-500'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      {selectedProject && selectedYear ? (
        projectEmployees.length > 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden shadow-xl">
            {/* Header de la Tabla */}
            <div className="p-6 border-b border-slate-700 bg-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-12 rounded-full ${selectedProjectInfo?.color || 'bg-emerald-500'}`}></div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {selectedProjectInfo?.nombre || selectedProjectInfo?.name || 'Proyecto'}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                     <span className="bg-slate-700 px-2 py-0.5 rounded text-xs text-emerald-400 border border-slate-600">{selectedYear}</span>
                     <span>Costos mensuales detallados</span>
                  </div>
                </div>
              </div>
              
              {isLoadingCostData && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-900/20 px-3 py-1.5 rounded-full border border-emerald-900/50">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Actualizando...
                </div>
              )}
            </div>

            {/* Tabla con scroll horizontal */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 sticky left-0 bg-slate-900 z-20 min-w-[220px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] border-b border-slate-700">
                      Empleado
                    </th>
                    {months.map((month, idx) => (
                      <th
                        key={idx}
                        className="px-4 py-4 text-center text-sm font-semibold text-slate-300 min-w-[100px] border-b border-slate-700 bg-slate-800/30"
                      >
                        {month}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projectEmployees.map((employee, empIdx) => (
                    <tr
                      key={employee.id}
                      className={`border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors group ${
                        empIdx % 2 === 0 ? 'bg-slate-800/10' : 'bg-transparent'
                      }`}
                    >
                      <td className="px-6 py-4 sticky left-0 bg-slate-900 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] group-hover:bg-slate-800 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-600">
                            <User className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-200">{employee.displayName}</div>
                            <div className="text-xs text-slate-500">{employee.profileLabel}</div>
                          </div>
                        </div>
                      </td>
                      {months.map((_, monthIdx) => {
                        const cost = getEmployeeCostForMonth(employee.id, monthIdx);
                        return (
                          <td key={monthIdx} className="px-4 py-4 text-center">
                            {cost > 0 ? (
                              <span className="text-slate-300 font-mono text-sm">
                                ${cost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </span>
                            ) : (
                              <span className="text-slate-700 text-xs">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Fila de totales por mes */}
                  <tr className="bg-slate-800/90 font-bold border-t-2 border-emerald-500/50">
                    <td className="px-6 py-4 sticky left-0 bg-slate-800 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                      <span className="text-emerald-400 text-sm uppercase tracking-wider">Total Mensual</span>
                    </td>
                    {months.map((_, monthIdx) => {
                      const monthTotal = getMonthTotalCost(monthIdx);
                      return (
                        <td key={monthIdx} className="px-4 py-4 text-center bg-slate-800/50">
                          {monthTotal > 0 ? (
                             <span className="text-emerald-400 font-mono font-bold text-sm">
                                ${monthTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </span>
                          ) : (
                             <span className="text-slate-600 text-xs">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer con Resumen */}
            <div className="p-6 bg-slate-800/90 border-t border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-8">
                 <div className="text-slate-400 text-sm">
                    <span className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Empleados</span>
                    <span className="text-white font-semibold text-lg">{projectEmployees.length}</span>
                 </div>
                 <div className="text-slate-400 text-sm">
                    <span className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Año Fiscal</span>
                    <span className="text-white font-semibold text-lg">{selectedYear}</span>
                 </div>
              </div>
              
              <div className="text-right bg-slate-900/50 px-6 py-3 rounded-xl border border-slate-700/50">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Costo Total Anual</div>
                <div className="text-3xl font-bold text-emerald-400 font-mono">
                  ${getTotalCost().toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ) : (
            // Estado vacío si no hay datos para el proyecto/año seleccionados (pero no es error)
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-12 text-center">
                 <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-slate-500" />
                 </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-300">Sin registros</h3>
                <p className="text-slate-400 max-w-md mx-auto">
                    No se encontraron empleados asignados o costos registrados para el proyecto <span className="text-white font-medium">{selectedProjectInfo?.name}</span> en el año {selectedYear}.
                </p>
                {costError && <p className="mt-4 text-red-400 text-sm bg-red-900/20 py-1 px-3 rounded inline-block">{costError}</p>}
            </div>
        )
      ) : (
        // Estado inicial (nada seleccionado)
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-16 text-center border-dashed">
          <DollarSign className="w-20 h-20 mx-auto mb-6 text-slate-600 opacity-50" />
          <h3 className="text-2xl font-semibold mb-3 text-slate-300">Comienza tu análisis</h3>
          <p className="text-slate-400 text-lg">
            {!selectedProject
              ? 'Selecciona un proyecto arriba para ver el desglose de costos.'
              : 'Ahora selecciona el año fiscal que deseas consultar.'}
          </p>
        </div>
      )}
    </div>
  );
}