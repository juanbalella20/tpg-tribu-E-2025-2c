import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, DollarSign, TrendingUp } from 'lucide-react';

export default function ProjectCostsReport() {
  const [projects, setProjects] = useState([]);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [projectCosts, setProjectCosts] = useState({});
  const [loading, setLoading] = useState(false);

  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const years = [2023, 2024, 2025, 2026];

  // TODO: reemplazar con llamada real a la API
  useEffect(() => {
    setProjects([
      { id: 1, name: 'Proyecto Alpha', color: 'bg-red-500' },
      { id: 2, name: 'Proyecto Beta', color: 'bg-purple-500' },
      { id: 3, name: 'Proyecto Gamma', color: 'bg-blue-500' },
      { id: 4, name: 'Proyecto Delta', color: 'bg-green-500' }
    ]);

    setProjectCosts({
      1: { 1: 45000, 2: 48000, 3: 47000, 4: 50000, 5: 52000, 6: 51000, 
           7: 49000, 8: 53000, 9: 55000, 10: 54000, 11: 56000, 12: 58000 },
      2: { 1: 38000, 2: 40000, 3: 39000, 4: 42000, 5: 44000, 6: 43000,
           7: 41000, 8: 45000, 9: 47000, 10: 46000, 11: 48000, 12: 50000 },
      3: { 1: 52000, 2: 54000, 3: 53000, 4: 56000, 5: 58000, 6: 57000,
           7: 55000, 8: 59000, 9: 61000, 10: 60000, 11: 62000, 12: 64000 },
      4: { 1: 41000, 2: 43000, 3: 42000, 4: 45000, 5: 47000, 6: 46000,
           7: 44000, 8: 48000, 9: 50000, 10: 49000, 11: 51000, 12: 53000 }
    });
  }, [selectedYear]);

  const getProjectCostForMonth = (projectId, monthIndex) => {
    return projectCosts[projectId]?.[monthIndex + 1] || 0;
  };

  const getMonthTotalCost = (monthIndex) => {
    return projects.reduce((sum, project) => {
      return sum + getProjectCostForMonth(project.id, monthIndex);
    }, 0);
  };

  const getProjectTotalCost = (projectId) => {
    let total = 0;
    for (let month = 1; month <= 12; month++) {
      total += projectCosts[projectId]?.[month] || 0;
    }
    return total;
  };

  const getYearTotalCost = () => {
    return projects.reduce((sum, project) => {
      return sum + getProjectTotalCost(project.id);
    }, 0);
  };

  const changeYear = (direction) => {
    const currentIndex = years.indexOf(selectedYear);
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedYear(years[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < years.length - 1) {
      setSelectedYear(years[currentIndex + 1]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-2">Costos por Proyecto</h2>
          <p className="text-slate-400">Visualiza los costos mensuales calculados por proyecto</p>
        </div>

        {/* Selector de Año */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => changeYear('prev')}
              disabled={years.indexOf(selectedYear) === 0}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              {years.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-8 py-3 rounded-lg transition-all font-semibold ${
                    selectedYear === year
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-110'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>

            <button
              onClick={() => changeYear('next')}
              disabled={years.indexOf(selectedYear) === years.length - 1}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Costos */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
          {/* Header con Total */}
          <div className="p-6 border-b border-slate-700 bg-slate-800/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-emerald-400" />
              <div>
                <h3 className="text-xl font-semibold">Resumen Anual {selectedYear}</h3>
                <p className="text-sm text-slate-400 mt-1">Costos calculados por el sistema</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400 mb-1">Costo Total del Año</div>
              <div className="text-3xl font-bold text-emerald-400">
                ${getYearTotalCost().toLocaleString('es-AR')}
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50 border-b-2 border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 sticky left-0 bg-slate-800/90 backdrop-blur-sm z-10 min-w-[200px]">
                    Proyecto
                  </th>
                  {months.map((month, idx) => (
                    <th
                      key={idx}
                      className="px-4 py-4 text-center text-sm font-semibold text-slate-300 min-w-[120px]"
                    >
                      {month}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-center text-sm font-semibold text-emerald-400 sticky right-0 bg-slate-800/90 backdrop-blur-sm z-10 min-w-[140px]">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project, projectIdx) => (
                  <tr
                    key={project.id}
                    className={`border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors ${
                      projectIdx % 2 === 0 ? 'bg-slate-800/20' : ''
                    }`}
                  >
                    <td className="px-6 py-4 sticky left-0 bg-slate-800/90 backdrop-blur-sm z-10">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${project.color}`}></div>
                        <span className="font-medium text-white">{project.name}</span>
                      </div>
                    </td>
                    {months.map((month, monthIdx) => {
                      const cost = getProjectCostForMonth(project.id, monthIdx);
                      return (
                        <td key={monthIdx} className="px-4 py-4 text-center">
                          <span className="text-slate-300 font-medium">
                            ${cost.toLocaleString('es-AR')}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 text-center sticky right-0 bg-slate-800/90 backdrop-blur-sm z-10">
                      <span className="text-emerald-400 font-bold text-lg">
                        ${getProjectTotalCost(project.id).toLocaleString('es-AR')}
                      </span>
                    </td>
                  </tr>
                ))}

                {/* Fila de Totales por Mes */}
                <tr className="bg-slate-800/70 border-t-2 border-emerald-500 font-bold">
                  <td className="px-6 py-4 sticky left-0 bg-slate-800/90 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      <span className="text-lg">Total</span>
                    </div>
                  </td>
                  {months.map((month, monthIdx) => {
                    const monthTotal = getMonthTotalCost(monthIdx);
                    return (
                      <td key={monthIdx} className="px-4 py-4 text-center">
                        <span className="text-blue-400 font-bold">
                          ${monthTotal.toLocaleString('es-AR')}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 text-center sticky right-0 bg-slate-800/90 backdrop-blur-sm z-10">
                    <span className="text-emerald-400 font-bold text-xl">
                      ${getYearTotalCost().toLocaleString('es-AR')}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer Info */}
          <div className="p-4 bg-slate-800/70 border-t border-slate-700 text-center text-sm text-slate-400">
            <p>Los costos se calculan automáticamente en base a las horas cargadas y los costos por perfil</p>
          </div>
        </div>
      </div>
    </div>
  );
}