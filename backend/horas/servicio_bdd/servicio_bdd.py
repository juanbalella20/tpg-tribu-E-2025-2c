import sqlite3
from datetime import date

# Archivo de la base de datos SQLite
DB_FILE = "registro_horas.db"


# ---------------------------------------------------------
# Crear base de datos y tabla
# ---------------------------------------------------------
def crear_bd_y_tabla():
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS RegistroDeHoras (
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
    conn.close()


# ---------------------------------------------------------
# Insertar nuevo registro
# ---------------------------------------------------------
def agregar_registro(id_empleado, id_tarea, fecha_, horas, estado="pendiente", desc=""):
    """
    fecha_: string 'YYYY-MM-DD' o date de Python.
    """
    if isinstance(fecha_, date):
        fecha_str = fecha_.isoformat()
    else:
        fecha_str = fecha_

    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO RegistroDeHoras
        (idEmpleado, idTarea, fecha, horasTrabajadas, estadoValidacion, descripcion)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (id_empleado, id_tarea, fecha_str, horas, estado, desc))

    conn.commit()
    conn.close()


# ---------------------------------------------------------
# Obtener registros por empleado
# ---------------------------------------------------------
def obtener_registros_por_empleado(id_empleado):
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()

    cur.execute("""
        SELECT idEmpleado, idTarea, fecha, horasTrabajadas, estadoValidacion, descripcion
        FROM RegistroDeHoras
        WHERE idEmpleado = ?
        ORDER BY fecha ASC
    """, (id_empleado,))

    filas = cur.fetchall()
    conn.close()
    return filas


# ---------------------------------------------------------
# Obtener registros por empleado y rango de fechas
# ---------------------------------------------------------
def obtener_registros_empleado_rango(id_empleado, fecha_desde, fecha_hasta):
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()

    cur.execute("""
        SELECT idEmpleado, idTarea, fecha, horasTrabajadas, estadoValidacion, descripcion
        FROM RegistroDeHoras
        WHERE idEmpleado = ?
          AND fecha BETWEEN ? AND ?
        ORDER BY fecha ASC
    """, (id_empleado, fecha_desde, fecha_hasta))

    filas = cur.fetchall()
    conn.close()
    return filas


# ---------------------------------------------------------
# Ejemplo de uso
# ---------------------------------------------------------
if __name__ == "__main__":
    # Crear BD y tabla
    crear_bd_y_tabla()

    print("Base de datos y tabla creadas.")

    # Inserciones de ejemplo (podés borrarlas si querés)
    agregar_registro("EMP001", "TAR001", "2025-01-10", 8.0, "pendiente", "Carga diaria")
    agregar_registro("EMP001", "TAR002", "2025-01-11", 4.5, "aprobado", "Horas extra")
    agregar_registro("EMP002", "TAR001", "2025-01-10", 7.0, "pendiente", "")

    # Consulta de ejemplo
    print("\nRegistros de EMP001:\n")
    registros = obtener_registros_por_empleado("EMP001")
    for r in registros:
        print(r)