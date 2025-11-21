import React, { useState } from 'react';
import { DollarSign, Calendar, User } from 'lucide-react';

export default function CostReport() {
  const [projects] = useState([
    { id: 1, name: 'Proyecto 1', color: 'bg-red-500' },
    { id: 2, name: 'Proyecto 2', color: 'bg-purple-500' },
    { id: 3, name: 'Proyecto 3', color: 'bg-blue-500' },
    { id: 4, name: 'Proyecto 4', color: 'bg-green-500' }
  ]);

  const [employees] = useState([
    { id: 1, name: 'Lautaro Martinez', profile: 'Dev Sr' },
    { id: 2, name: 'Emanuel Rodriguez', profile: 'Dev Jr' },
    { id: 3, name: 'María García', profile: 'PM' },
    { id: 4, name: 'Juan Pérez', profile: 'QA' },
    { id: 5, name: 'Laura Fernández', profile: 'Tech Lead' },
    { id: 6, name: 'Carlos López', profile: 'Designer' }
  ]);

  const [costData] = useState({
    1: {
      2024: {
        1: { 1: 4000, 2: 2000, 3: 6000, 4: 3000 },
        2: { 1: 4200, 2: 2100, 3: 6200, 4: 3100 },
        3: { 1: 3800, 2: 1900, 3: 5800, 4: 2900 },
        4: { 1: 4100, 2: 2050, 3: 6100, 4: 3050 },
        5: { 1: 4000, 2: 2000, 3: 6000, 4: 3000 },
        6: { 1: 4300, 2: 2150, 3: 6300, 4: 3150 },
        7: { 1: 3900, 2: 1950, 3: 5900, 4: 2950 },
        8: { 1: 4000, 2: 2000, 3: 6000, 4: 3000 },
        9: { 1: 4100, 2: 2050, 3: 6100, 4: 3050 },
        10: { 1: 4200, 2: 2100, 3: 6200, 4: 3100 },
        11: { 1: 3800, 2: 1900, 3: 5800, 4: 2900 },
        12: { 1: 4000, 2: 2000, 3: 6000, 4: 3000 }
      }
    },
    2: {
      2024: {
        1: { 1: 4800, 5: 5000, 6: 2800 },
        2: { 1: 4900, 5: 5100, 6: 2900 },
        3: { 1: 4700, 5: 4900, 6: 2700 },
        4: { 1: 4800, 5: 5000, 6: 2800 },
        5: { 1: 5000, 5: 5200, 6: 3000 },
        6: { 1: 4800, 5: 5000, 6: 2800 },
        7: { 1: 4900, 5: 5100, 6: 2900 },
        8: { 1: 4800, 5: 5000, 6: 2800 },
        9: { 1: 4700, 5: 4900, 6: 2700 },
        10: { 1: 4800, 5: 5000, 6: 2800 },
        11: { 1: 4900, 5: 5100, 6: 2900 },
        12: { 1: 4800, 5: 5000, 6: 2800 }
      }
    }
  });

  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedYear, setSelectedYear] = useState('');

  const years = ['2023', '2024', '2025'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const getProjectEmployees = () => {
    if (!selectedProject || !selectedYear) return [];
    
    const yearData = costData[selectedProject]?.[selectedYear];
    if (!yearData) return [];

    const employeeIds = new Set();
    Object.values(yearData).forEach(monthData => {
      Object.keys(monthData).forEach(empId => employeeIds.add(parseInt(empId)));
    });

    return employees.filter(emp => employeeIds.has(emp.id));
  };

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

  const projectEmployees = getProjectEmployees();
  const selectedProjectInfo = projects.find(p => p.id === selectedProject);

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
              <button className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-sm">
                Reporte Semanal
              </button>
              <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium">
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
                    onClick={() => setSelectedProject(project.id)}
                    className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 ${
                      selectedProject === project.id
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${project.color}`}></div>
                    {project.name}
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
                <div className={`w-4 h-4 rounded-full ${selectedProjectInfo.color}`}></div>
                <div>
                  <h3 className="text-xl font-semibold">
                    {selectedProjectInfo.name} - {selectedYear}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">Costos mensuales por empleado</p>
                </div>
              </div>
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
                            <div className="font-medium text-white">{employee.name}</div>
                            <div className="text-xs text-slate-400">{employee.profile}</div>
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
                : 'No hay datos disponibles para esta selección'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
