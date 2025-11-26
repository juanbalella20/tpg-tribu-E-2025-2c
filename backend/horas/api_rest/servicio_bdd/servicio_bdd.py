import sqlite3
import os
from datetime import date

# Obtenemos la ruta absoluta de ESTE archivo para guardar la DB en la misma carpeta
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "registro_horas.db")

def get_db_connection():
    """Crea una conexión a la base de datos configurada para devolver diccionarios."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row  # Permite acceder a las columnas por nombre
    return conn

def crear_bd_y_tabla():
    """Crea la tabla 'registro_horas' si no existe."""
    conn = get_db_connection()
    try:
        # Usamos nombres de columnas en CamelCase para compatibilidad, 
        # pero nombre de tabla en minúsculas 'registro_horas' para evitar errores.
        conn.execute("""
        CREATE TABLE IF NOT EXISTS registro_horas (
            idEmpleado       TEXT NOT NULL,
            idTarea          TEXT NOT NULL,
            fecha            TEXT NOT NULL,
            horasTrabajadas  REAL NOT NULL,
            estadoValidacion TEXT,
            descripcion      TEXT,
            PRIMARY KEY (idEmpleado, idTarea, fecha)
        );
        """)
        conn.commit()
        print(f"--- Base de datos verificada: {DB_FILE} ---")
    except Exception as e:
        print(f"Error creando base de datos: {e}")
    finally:
        conn.close()

def agregar_registro(id_empleado, id_tarea, fecha_, horas, estado="pendiente", desc=""):
    """Inserta o actualiza un registro de horas."""
    # Convertir fecha a string si es objeto date
    if isinstance(fecha_, date):
        fecha_str = fecha_.isoformat()
    else:
        fecha_str = fecha_

    # Aseguramos que la tabla exista antes de insertar
    crear_bd_y_tabla()

    conn = get_db_connection()
    try:
        # Usamos REPLACE para que si el usuario corrige horas del mismo día/tarea, se actualice
        conn.execute("""
            INSERT OR REPLACE INTO registro_horas
            (idEmpleado, idTarea, fecha, horasTrabajadas, estadoValidacion, descripcion)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (str(id_empleado), str(id_tarea), fecha_str, float(horas), estado, desc))
        
        conn.commit()
        print(f"Registro guardado: {id_empleado} - Tarea {id_tarea} - {horas}hs")
    except Exception as e:
        print(f"Error SQL al insertar: {e}")
        raise e  # Relanzamos para que el servicio superior se entere
    finally:
        conn.close()

def eliminar_registro(id_empleado, id_tarea, fecha):
    """Elimina un registro específico de la base de datos."""
    crear_bd_y_tabla()
    conn = get_db_connection()
    try:
        conn.execute("""
            DELETE FROM registro_horas
            WHERE idEmpleado = ? AND idTarea = ? AND fecha = ?
        """, (str(id_empleado), str(id_tarea), fecha))
        conn.commit()
        print(f"Registro eliminado: {id_empleado} - Tarea {id_tarea} - {fecha}")
    except Exception as e:
        print(f"Error SQL al eliminar: {e}")
        raise e
    finally:
        conn.close()

def obtener_registros_por_empleado(id_empleado):
    """Obtiene todas las horas cargadas por un empleado."""
    crear_bd_y_tabla()
    conn = get_db_connection()
    filas = []
    try:
        cursor = conn.execute("""
            SELECT idEmpleado, idTarea, fecha, horasTrabajadas, estadoValidacion, descripcion
            FROM registro_horas
            WHERE idEmpleado = ?
            ORDER BY fecha ASC
        """, (str(id_empleado),))
        
        # Convertimos los resultados a una lista de diccionarios real
        filas = [dict(row) for row in cursor.fetchall()]
    except Exception as e:
        print(f"Error SQL al consultar: {e}")
    finally:
        conn.close()
        
    return filas