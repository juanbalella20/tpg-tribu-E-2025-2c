import sys
import os

# --- TRUCO DE PATH (CRÍTICO) ---
# Esto permite que este archivo encuentre 'servicio_bdd' que está 3 niveles arriba.
# Ruta actual: .../servicios/horas_controller/servicio_registro_horas/
current = os.path.dirname(os.path.abspath(__file__))
# Ruta raíz api_rest: .../api_rest/
root_api = os.path.abspath(os.path.join(current, '../../../'))

# Agregamos la raíz al path de Python si no está
if root_api not in sys.path:
    sys.path.append(root_api)

# Ahora podemos importar servicio_bdd como si estuviéramos en la raíz
try:
    from servicio_bdd.servicio_bdd import agregar_registro
except ImportError:
    # Fallback por si la estructura de carpetas varía ligeramente
    sys.path.append(os.path.join(root_api, 'servicio_bdd'))
    from servicio_bdd import agregar_registro

def registrar_horas(data):
    """
    Recibe un diccionario con los datos del frontend y los guarda en SQLite.
    Expected data: { "id_empleado": int/str, "id_tarea": int/str, "cantidad": float, "fecha": str }
    """
    try:
        # Mapeamos los datos del JSON (snake_case del request) a las variables
        id_empleado = data.get('id_empleado')
        id_tarea = data.get('id_tarea')
        fecha = data.get('fecha')
        horas = data.get('cantidad')

        # Validaciones básicas
        if id_empleado is None or id_tarea is None or fecha is None:
            return {"status": "error", "message": "Faltan datos obligatorios"}

        # Guardar en SQLite llamando a la capa de persistencia
        agregar_registro(
            id_empleado=id_empleado,
            id_tarea=id_tarea,
            fecha_=fecha,
            horas=horas,
            estado="pendiente",  # Valor por defecto
            desc="Carga web"
        )
        
        return {"status": "success", "message": "Horas guardadas correctamente en BD"}
    
    except Exception as e:
        print(f"Excepción en registrar_horas: {e}")
        return {"status": "error", "message": str(e)}