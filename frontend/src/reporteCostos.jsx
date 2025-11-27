import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, Calendar, User, Loader2 } from 'lucide-react';

// LINKEAR ::::
const PROJECTS_API = 'API-PROYECTO';
const TASKS_API = 'API-TAREA';
const RESOURCES_API = 'API-RECURSO';
const ROLES_API = 'API-ROL';
const FINANCE_API = 'API-FINANZAS';
const HOURS_API = 'API-HORAS';

const years = ['2023', '2024', '2025'];
const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error al cargar ${url}`);
  }

  try {
    return await response.json();
  } catch (error) {
    console.warn(`No se pudo parsear la respuesta de ${url}`, error);
    return [];
  }
};

const normalizeHourEntry = (entry) => {
  const employeeId = entry.id_empleado || entry.idEmpleado || entry.idEmpleado?.toString() || entry.empleadoId;
  const taskId = entry.id_tarea || entry.idTarea || entry.tareaId;
  const rawDate = entry.fecha || entry.date;

  return {
    employeeId: employeeId ? String(employeeId) : null,
    taskId: taskId ? String(taskId) : null,
    date: rawDate,
    hours: parseFloat(entry.horasTrabajadas ?? entry.cantidad ?? entry.horas ?? 0) || 0
  };
};

export default function CostReport() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [financeProfiles, setFinanceProfiles] = useState([]);
  const [costData, setCostData] = useState({});

  const [catalogError, setCatalogError] = useState(null);
  const [costError, setCostError] = useState(null);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(true);
  const [isLoadingCostData, setIsLoadingCostData] = useState(false);

  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    const loadCatalogs = async () => {
      setIsLoadingCatalogs(true);
      setCatalogError(null);

      try {
        const [projectsResponse, tasksResponse, resourcesResponse, rolesResponse, financeResponse] =
          await Promise.all([
            fetchJson(PROJECTS_API),
            fetchJson(TASKS_API),
            fetchJson(RESOURCES_API),
            fetchJson(ROLES_API),
            fetchJson(FINANCE_API)
          ]);

        setProjects(projectsResponse || []);
        setTasks(tasksResponse || []);
        setEmployees(resourcesResponse || []);
        setRoles(rolesResponse || []);
        setFinanceProfiles(financeResponse || []);
      } catch (error) {
        console.error('Error al cargar catálogos:', error);
        setCatalogError('No se pudieron cargar los catálogos. Intenta nuevamente más tarde.');
      } finally {
        setIsLoadingCatalogs(false);
      }
    };

    loadCatalogs();
  }, []);

  const tasksById = useMemo(() => {
    return tasks.reduce((acc, task) => {
      if (task?.id) {
        acc[String(task.id)] = task;
      }
      return acc;
    }, {});
  }, [tasks]);

  const projectAssignments = useMemo(() => {
    const assignments = {};

    tasks.forEach(task => {
      if (!task?.proyectoId || !task?.recursoId) return;
      const projectId = String(task.proyectoId);
      const resourceId = String(task.recursoId);

      if (!assignments[projectId]) assignments[projectId] = new Set();
      assignments[projectId].add(resourceId);
    });

    return assignments;
  }, [tasks]);

  const rolesById = useMemo(() => {
    return roles.reduce((acc, role) => {
      if (role?.id) {
        acc[String(role.id)] = role;
      }
      return acc;
    }, {});
  }, [roles]);

  const costPerRole = useMemo(() => {
    return financeProfiles.reduce((acc, profile) => {
      if (profile?.idPerfil) {
        acc[String(profile.idPerfil)] = parseFloat(profile.costoHora) || 0;
      }
      return acc;
    }, {});
  }, [financeProfiles]);

  const employeesById = useMemo(() => {
    return employees.reduce((acc, employee) => {
      if (!employee?.id) return acc;
      const profileInfo = rolesById[employee.rolId]
        ? `${rolesById[employee.rolId].nombre} ${rolesById[employee.rolId].experiencia || ''}`.trim()
        : 'Perfil sin rol';

      acc[String(employee.id)] = {
        ...employee,
        displayName: `${employee.nombre || ''} ${employee.apellido || ''}`.trim() || employee.nombre || 'Empleado',
        profileLabel: profileInfo
      };
      return acc;
    }, {});
  }, [employees, rolesById]);

  const employeeCostPerHour = useMemo(() => {
    return employees.reduce((acc, employee) => {
      if (!employee?.id) return acc;
      acc[String(employee.id)] = costPerRole[employee.rolId] || 0;
      return acc;
    }, {});
  }, [employees, costPerRole]);

  const selectedEmployees = useMemo(() => {
    if (!selectedProject) return [];

    const assignedEmployees = projectAssignments[selectedProject]
      ? Array.from(projectAssignments[selectedProject])
      : [];

    const costMatrix = costData[selectedProject]?.[selectedYear] || {};
    Object.values(costMatrix).forEach(monthData => {
      Object.keys(monthData).forEach(empId => {
        if (!assignedEmployees.includes(empId)) assignedEmployees.push(empId);
      });
    });

    const fallback = assignedEmployees.length > 0 ? assignedEmployees : employees.map(emp => String(emp.id));

    return fallback
      .map(empId => employeesById[String(empId)])
      .filter(Boolean);
  }, [selectedProject, selectedYear, costData, projectAssignments, employees, employeesById]);

  useEffect(() => {
    if (!selectedProject || !selectedYear) return;

    setCostError(null);
    setIsLoadingCostData(true);

    const loadCostData = async () => {
      try {
        const response = await fetch(
          `${HOURS_API}?proyectoId=${encodeURIComponent(selectedProject)}&anio=${encodeURIComponent(selectedYear)}`
        );

        if (!response.ok) {
          throw new Error('No se pudieron obtener las horas del proyecto');
        }

        const payload = await response.json();
        const normalizedEntries = Array.isArray(payload) ? payload.map(normalizeHourEntry) : [];

        const projectYearCosts = {};

        normalizedEntries.forEach(entry => {
          if (!entry.employeeId || !entry.taskId || !entry.date) return;

          const task = tasksById[entry.taskId];
          if (!task || String(task.proyectoId) !== String(selectedProject)) return;

          const date = new Date(`${entry.date}T00:00:00`);
          if (Number.isNaN(date.getTime())) return;
          if (date.getFullYear().toString() !== String(selectedYear)) return;

          const month = date.getMonth() + 1;
          if (!projectYearCosts[month]) projectYearCosts[month] = {};

          const cost = entry.hours * (employeeCostPerHour[entry.employeeId] || 0);
          projectYearCosts[month][entry.employeeId] =
            (projectYearCosts[month][entry.employeeId] || 0) + cost;
        });

        setCostData(prev => ({
          ...prev,
          [selectedProject]: {
            ...(prev[selectedProject] || {}),
            [selectedYear]: projectYearCosts
          }
        }));
      } catch (error) {
        console.error('Error al calcular costos:', error);
        setCostError('No se pudieron cargar los costos del proyecto.');
        setCostData(prev => ({
          ...prev,
          [selectedProject]: {
            ...(prev[selectedProject] || {}),
            [selectedYear]: {}
          }
        }));
      } finally {
        setIsLoadingCostData(false);
      }
    };

    loadCostData();
  }, [selectedProject, selectedYear, employeeCostPerHour, tasksById]);

  const getEmployeeCostForMonth = (employeeId, monthIndex) => {
    if (!selectedProject || !selectedYear) return 0;

    const monthData = costData[selectedProject]?.[selectedYear]?.[monthIndex + 1];
    return monthData?.[employeeId] || 0;
  };

  const getEmployeeTotalCost = (employeeId) => {
    if (!selectedProject || !selectedYear) return 0;

    let total = 0;
    for (let month = 1; month <= 12; month++) {
      const monthData = costData[selectedProject]?.[selectedYear]?.[month];
      total += monthData?.[employeeId] || 0;
    }
    return total;
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
  const projectEmployees = selectedEmployees;

  if (isLoadingCatalogs) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col items-center text-center text-slate-300">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-emerald-400" />
        <p>Cargando catálogos de proyectos, tareas y recursos...</p>
      </div>
    );
  }

  if (catalogError) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center">
        <h2 className="text-2xl font-semibold text-red-400 mb-2">Ups…</h2>
        <p className="text-slate-400">{catalogError}</p>
      </div>
    );
  }

  return (

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Título centrado */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Reporte de Costos</h2>
          <p className="text-slate-400">Visualiza los costos anuales por proyecto y empleado</p>
        </div>

        {/* Selectores de proyecto y año */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 ${
                      String(selectedProject) === String(project.id)
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${project.color}`}></div>
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
                    className={`px-6 py-2.5 rounded-lg transition-all ${
                      selectedYear === year
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de costos */}
        {selectedProject && selectedYear && projectEmployees.length > 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-700 bg-slate-800/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${selectedProjectInfo?.color || 'bg-emerald-400'}`}></div>
                <div>
                  <h3 className="text-xl font-semibold">
                    {(selectedProjectInfo?.nombre || selectedProjectInfo?.name || 'Proyecto sin nombre')} - {selectedYear}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">Costos mensuales por empleado</p>
                </div>
              </div>
              {isLoadingCostData && (
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  Actualizando costos...
                </div>
              )}
            </div>

            {/* Tabla con scroll horizontal */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50 border-b-2 border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 sticky left-0 bg-slate-800/90 backdrop-blur-sm z-10 min-w-[200px]">
                      Empleado
                    </th>
                    {months.map((month, idx) => (
                      <th
                        key={idx}
                        className="px-4 py-4 text-center text-sm font-semibold text-slate-300 min-w-[100px]"
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
                      className={`border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors ${
                        empIdx % 2 === 0 ? 'bg-slate-800/20' : ''
                      }`}
                    >
                      <td className="px-6 py-4 sticky left-0 bg-slate-800/90 backdrop-blur-sm z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div>
                            <div className="font-medium text-white">{employee.displayName || employee.name}</div>
                            <div className="text-xs text-slate-400">{employee.profileLabel || employee.profile}</div>
                          </div>
                        </div>
                      </td>
                      {months.map((month, monthIdx) => {
                        const cost = getEmployeeCostForMonth(employee.id, monthIdx);
                        return (
                          <td key={monthIdx} className="px-4 py-4 text-center">
                            {cost > 0 ? (
                              <span className="text-slate-300 font-medium">
                                ${cost.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Fila de totales por mes */}
                  <tr className="bg-slate-800/70 border-t-2 border-emerald-500 font-bold">
                    <td className="px-6 py-4 sticky left-0 bg-slate-800/90 backdrop-blur-sm z-10">
                      <span className="text-lg">Total por mes</span>
                    </td>
                    {months.map((month, monthIdx) => {
                      const monthTotal = getMonthTotalCost(monthIdx);
                      return (
                        <td key={monthIdx} className="px-4 py-4 text-center">
                          <span className="text-blue-400 font-bold">
                            ${monthTotal.toLocaleString()}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                </tbody> {/* <-- AQUÍ EL CAMBIO: antes decía </tfoot> */}
              </table>
            </div>

            {/* Resumen inferior */}
            <div className="p-6 bg-slate-800/70 border-t border-slate-700">
              <div className="flex items-center justify-between">
                <div className="text-slate-400">
                  <span className="text-sm">Total de empleados: </span>
                  <span className="font-semibold text-white">{projectEmployees.length}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-400 mb-1">Costo Total del Año</div>
                  <div className="text-3xl font-bold text-emerald-400">
                    ${getTotalCost().toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-12 text-center">
            <DollarSign className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <h3 className="text-xl font-semibold mb-2 text-slate-300">Selecciona proyecto y año</h3>
            <p className="text-slate-400">
              {!selectedProject
                ? 'Primero elige un proyecto'
                : !selectedYear
                ? 'Ahora selecciona un año'
                : costError || 'No hay datos disponibles para esta selección'}
            </p>
          </div>
        )}
      </div>
  );
}
