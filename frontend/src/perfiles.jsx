import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Edit2, Save, X, Percent, Check, DollarSign } from 'lucide-react';

export default function ProfileCostsReport() {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [editingCell, setEditingCell] = useState(null); // {profileId, monthIndex}
  const [showBulkModal, setShowBulkModal] = useState(null); // monthIndex si está abierto
  const [bulkPercentage, setBulkPercentage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const years = [2023, 2024, 2025, 2026];
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  // ejemplo
  const profiles = [
    { id: 1, name: 'Ing de Software', color: 'bg-red-500' },
    { id: 2, name: 'Analista de Datos', color: 'bg-purple-500' }
  ];

  // estado inicial de costos (esto vendría de la API)
  const [profileCosts, setProfileCosts] = useState({
    1: { 1: 4000, 2: 4000, 3: 4000, 4: 4000, 5: 4000, 6: 4000, 
         7: 4000, 8: 4000, 9: 4000, 10: 4000, 11: 4000, 12: 4000 },
    2: { 1: 2000, 2: 2000, 3: 2000, 4: 2000, 5: 2000, 6: 2000,
         7: 2000, 8: 2000, 9: 2000, 10: 2000, 11: 2000, 12: 2000 }
  });

  const [tempValue, setTempValue] = useState('');

  const changeYear = (direction) => {
    const currentIndex = years.indexOf(selectedYear);
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedYear(years[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < years.length - 1) {
      setSelectedYear(years[currentIndex + 1]);
    }
  };

  const handleCellClick = (profileId, monthIndex) => {
    setEditingCell({ profileId, monthIndex });
    setTempValue(profileCosts[profileId]?.[monthIndex + 1] || 0);
  };

  const handleCellSave = () => {
    if (editingCell) {
      const { profileId, monthIndex } = editingCell;
      setProfileCosts(prev => ({
        ...prev,
        [profileId]: {
          ...prev[profileId],
          [monthIndex + 1]: parseFloat(tempValue) || 0
        }
      }));
      setEditingCell(null);
      
      // TODO: POST/PUT a la API
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setTempValue('');
  };

  const handleBulkUpdate = (monthIndex) => {
    if (!bulkPercentage) return;

    const percentage = parseFloat(bulkPercentage) / 100;
    const prevMonthIndex = monthIndex === 0 ? 12 : monthIndex;

    setProfileCosts(prev => {
      const updated = { ...prev };
      profiles.forEach(profile => {
        const prevValue = prev[profile.id]?.[prevMonthIndex] || 0;
        const newValue = Math.round(prevValue * (1 + percentage));
        updated[profile.id] = {
          ...updated[profile.id],
          [monthIndex + 1]: newValue
        };
      });
      return updated;
    });

    // TODO: POST/PUT masivo a la API
    
    setShowBulkModal(null);
    setBulkPercentage('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const getProfileCostForMonth = (profileId, monthIndex) => {
    return profileCosts[profileId]?.[monthIndex + 1] || 0;
  };

  const getMonthTotalCost = (monthIndex) => {
    return profiles.reduce((sum, profile) => {
      return sum + getProfileCostForMonth(profile.id, monthIndex);
    }, 0);
  };

  const getProfileTotalCost = (profileId) => {
    let total = 0;
    for (let month = 1; month <= 12; month++) {
      total += profileCosts[profileId]?.[month] || 0;
    }
    return total;
  };

  const getYearTotalCost = () => {
    return profiles.reduce((sum, profile) => {
      return sum + getProfileTotalCost(profile.id);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-2">Costos por Perfil</h2>
          <p className="text-slate-400">Edita manualmente los costos mensuales de cada perfil</p>
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
          {/* Header */}
          <div className="p-6 border-b border-slate-700 bg-slate-800/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Edit2 className="w-8 h-8 text-emerald-400" />
              <div>
                <h3 className="text-xl font-semibold">Perfiles {selectedYear}</h3>
                <p className="text-sm text-slate-400 mt-1">Haz clic en una celda para editar</p>
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
                    Perfil
                  </th>
                  {months.map((month, idx) => (
                    <th
                      key={idx}
                      className="px-2 py-4 text-center text-sm font-semibold text-slate-300 min-w-[140px]"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span>{month}</span>
                        <button
                          onClick={() => setShowBulkModal(idx)}
                          className="text-xs px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-md transition-colors flex items-center gap-1"
                          title="Actualizar columna"
                        >
                          <Percent className="w-3 h-3" />
                          Actualizar
                        </button>
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-4 text-center text-sm font-semibold text-emerald-400 sticky right-0 bg-slate-800/90 backdrop-blur-sm z-10 min-w-[140px]">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile, profileIdx) => (
                  <tr
                    key={profile.id}
                    className={`border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors ${
                      profileIdx % 2 === 0 ? 'bg-slate-800/20' : ''
                    }`}
                  >
                    <td className="px-6 py-4 sticky left-0 bg-slate-800/90 backdrop-blur-sm z-10">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${profile.color}`}></div>
                        <span className="font-medium text-white">{profile.name}</span>
                      </div>
                    </td>
                    {months.map((month, monthIdx) => {
                      const cost = getProfileCostForMonth(profile.id, monthIdx);
                      const isEditing = editingCell?.profileId === profile.id && editingCell?.monthIndex === monthIdx;

                      return (
                        <td key={monthIdx} className="px-2 py-4 text-center">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                className="w-24 bg-slate-700 border border-emerald-500 rounded px-2 py-1 text-white text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleCellSave();
                                  if (e.key === 'Escape') handleCellCancel();
                                }}
                              />
                              <button
                                onClick={handleCellSave}
                                className="p-1 bg-emerald-500 hover:bg-emerald-600 rounded text-white"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCellCancel}
                                className="p-1 bg-red-500 hover:bg-red-600 rounded text-white"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleCellClick(profile.id, monthIdx)}
                              className="w-full px-3 py-2 text-slate-300 font-medium hover:bg-slate-700/50 rounded transition-colors group"
                            >
                              <span className="group-hover:hidden">
                                ${cost.toLocaleString('es-AR')}
                              </span>
                              <span className="hidden group-hover:inline-flex items-center gap-1 text-emerald-400">
                                <Edit2 className="w-3 h-3" />
                                Editar
                              </span>
                            </button>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 text-center sticky right-0 bg-slate-800/90 backdrop-blur-sm z-10">
                      <span className="text-emerald-400 font-bold text-lg">
                        ${getProfileTotalCost(profile.id).toLocaleString('es-AR')}
                      </span>
                    </td>
                  </tr>
                ))}

                {/* Fila de Totales */}
                <tr className="bg-slate-800/70 border-t-2 border-emerald-500 font-bold">
                  <td className="px-6 py-4 sticky left-0 bg-slate-800/90 backdrop-blur-sm z-10">
                    <span className="text-lg">Total</span>
                  </td>
                  {months.map((month, monthIdx) => {
                    const monthTotal = getMonthTotalCost(monthIdx);
                    return (
                      <td key={monthIdx} className="px-2 py-4 text-center">
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

          {/* Footer */}
          <div className="p-4 bg-slate-800/70 border-t border-slate-700 text-center text-sm text-slate-400">
            <p>Los valores son editables manualmente. Usa el botón "Actualizar" para aplicar cambios porcentuales a todo un mes</p>
          </div>
        </div>
      </div>

      {/* Modal de Actualización Masiva */}
      {showBulkModal !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border-2 border-slate-700 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Percent className="w-6 h-6 text-emerald-400" />
                Actualizar {months[showBulkModal]}
              </h3>
              <button
                onClick={() => {
                  setShowBulkModal(null);
                  setBulkPercentage('');
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-slate-400 mb-6 text-sm">
              Ingresa el porcentaje de aumento o disminución que deseas aplicar a todos los perfiles para este mes (basado en el mes anterior)
            </p>

            <div className="mb-6">
              <label className="text-sm text-slate-400 mb-2 block">Porcentaje de cambio</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={bulkPercentage}
                  onChange={(e) => setBulkPercentage(e.target.value)}
                  placeholder="Ej: 5 para +5%, -3 para -3%"
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
                <span className="text-2xl text-slate-400">%</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Ejemplo: Si el mes anterior tenía $4000 y pones 5%, el nuevo valor será $4200
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleBulkUpdate(showBulkModal)}
                disabled={!bulkPercentage}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Aplicar cambios
              </button>
              <button
                onClick={() => {
                  setShowBulkModal(null);
                  setBulkPercentage('');
                }}
                className="px-6 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificación de Éxito */}
      {showSuccess && (
        <div className="fixed bottom-6 right-6 bg-emerald-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom z-50">
          <Check className="w-5 h-5" />
          <div>
            <div className="font-semibold">¡Guardado exitoso!</div>
            <div className="text-sm opacity-90">Los costos se actualizaron correctamente</div>
          </div>
        </div>
      )}
    </div>
  );
}