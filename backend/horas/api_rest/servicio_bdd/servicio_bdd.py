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
        conn.execute("""
        CREATE TABLE IF NOT EXISTS registro_horas (
            idEmpleado       TEXT NOT NULL,
            idTarea          TEXT NOT NULL,
            fecha            TEXT NOT NULL,
            horasTrabajadas  REAL NOT NULL,
            PRIMARY KEY (idEmpleado, idTarea, fecha)
        );
        """)
        conn.commit()
        print(f"--- Base de datos verificada: {DB_FILE} ---")
    except Exception as e:
        print(f"Error creando base de datos: {e}")
    finally:
        conn.close()

def agregar_registro(id_empleado, id_tarea, fecha_, horas, desc=""):
    """Inserta o actualiza un registro de horas."""
    # Convertir fecha a string si es objeto date
    if isinstance(fecha_, date):
        fecha_str = fecha_.isoformat()
    else:
        fecha_str = fecha_

    crear_bd_y_tabla()

    conn = get_db_connection()
    try:
        # Usamos REPLACE para actualizar si ya existe la combinación PK
        conn.execute("""
            INSERT OR REPLACE INTO registro_horas
            (idEmpleado, idTarea, fecha, horasTrabajadas)
            VALUES (?, ?, ?, ?)
        """, (str(id_empleado), str(id_tarea), fecha_str, float(horas)))
        
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
            SELECT idEmpleado, idTarea, fecha, horasTrabajadas
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


def obtener_todos_los_registros():
    """Devuelve todos los registros de la tabla sin filtrar por empleado."""
    crear_bd_y_tabla()
    conn = get_db_connection()
    filas = []
    try:
        cursor = conn.execute("""
            SELECT idEmpleado, idTarea, fecha, horasTrabajadas
            FROM registro_horas
            ORDER BY fecha ASC
        """)
        filas = [dict(row) for row in cursor.fetchall()]
    except Exception as e:
        print(f"Error SQL al consultar todos los registros: {e}")
    finally:
        conn.close()

    return filas
    
