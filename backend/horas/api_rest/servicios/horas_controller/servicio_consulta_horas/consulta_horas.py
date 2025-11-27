import sys
import os

# --- CONFIGURACIÓN DE PATH (igual que en registro_horas.py) ---
current = os.path.dirname(os.path.abspath(__file__))
root_api = os.path.abspath(os.path.join(current, '../../../'))

if root_api not in sys.path:
    sys.path.append(root_api)

try:
    from servicio_bdd.servicio_bdd import obtener_registros_por_empleado
except ImportError:
    sys.path.append(os.path.join(root_api, 'servicio_bdd'))
    from servicio_bdd import obtener_registros_por_empleado

from datetime import datetime, timedelta

def obtener_horas_semanales(id_empleado, fecha):
    """
    Obtiene las horas trabajadas por un empleado en una semana específica.
    
    Args:
        id_empleado: ID del empleado
        fecha: Fecha en formato ISO (YYYY-MM-DD) que representa cualquier día de la semana
    
    Returns:
        Lista de diccionarios con formato:
        [
            {
                "id_tarea": int/str,
                "cantidad": float,
                "fecha": str,
                "estado": str
            }
        ]
    """
    try:
        # Obtener todos los registros del empleado
        todos_registros = obtener_registros_por_empleado(id_empleado)
        
        # Parsear la fecha recibida
        fecha_referencia = datetime.fromisoformat(fecha)
        
        # Calcular el inicio y fin de la semana (lunes a domingo)
        inicio_semana = fecha_referencia - timedelta(days=fecha_referencia.weekday())
        fin_semana = inicio_semana + timedelta(days=6)
        
        # Filtrar registros de la semana
        registros_semana = []
        for registro in todos_registros:
            fecha_registro = datetime.fromisoformat(registro['fecha'])
            if inicio_semana <= fecha_registro <= fin_semana:
                registros_semana.append({
                    "id_tarea": int(registro['idTarea']) if str(registro['idTarea']).isdigit() else registro['idTarea'],
                    "cantidad": registro['horasTrabajadas'],
                    "fecha": registro['fecha'],
                    "estado": registro['estadoValidacion']
                })
        
        return registros_semana
    
    except Exception as e:
        print(f"Error en obtener_horas_semanales: {e}")
        raise e