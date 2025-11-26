import sys
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import random

# --- CONFIGURACIÓN DE RUTAS ---
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from servicio_bdd.servicio_bdd import crear_bd_y_tabla, obtener_registros_por_empleado, eliminar_registro
from servicios.horas_controller.servicio_registro_horas.registro_horas import registrar_horas

# Cuando se implementen los otros servicios, se deben importar aca
try:
    from servicios.horas_controller.servicio_consulta_horas import obtener_horas_semanales
except ImportError:
    def obtener_horas_semanales(id_emp, fecha):
        registros = obtener_registros_por_empleado(id_emp)
        return [
            {
                "id_tarea": int(r['idTarea']) if str(r['idTarea']).isdigit() else r['idTarea'],
                "cantidad": r['horasTrabajadas'],
                "fecha": r['fecha'],
                "estado": r['estadoValidacion']
            } for r in registros
        ]

try:
    from servicios.proyecto_controller.servicio_consulta_proyectos import obtener_costos_proyecto
except ImportError:
    def obtener_costos_proyecto(id, anio): return []

app = Flask(__name__)
CORS(app)

# Inicializar Base de Datos al arrancar la app
crear_bd_y_tabla()

RESOURCES_URL = "https://anypoint.mulesoft.com/mocking/api/v1/sources/exchange/assets/32c8fe38-22a6-4fbb-b461-170dfac937e4/recursos-api/1.0.1/m/recursos"

@app.get("/api/simulate/rand_emplyee_id")
def simulate_login_id():
    """Simula obtener un ID de empleado de un sistema externo"""
    try:
        data = requests.get(RESOURCES_URL).json()
        if data:
            employee_id = data[random.randint(0, len(data)-1)]["id"]
            return jsonify({"employee_id" : employee_id}), 200
    except:
        pass
    return jsonify({"employee_id": 1}), 200

# -----------------------
#     ENDPOINTS HORAS
# -----------------------

@app.get("/api/horas/<string:id_empleado>/<string:fecha>")
def endpoint_horas_semanales(id_empleado, fecha):
    try:
        data = obtener_horas_semanales(id_empleado, fecha)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.post("/api/horas")
def endpoint_registrar_horas():
    try:
        body = request.get_json()
        resultado = registrar_horas(body)
        status_code = 201 if resultado.get("status") == "success" else 400
        return jsonify(resultado), status_code
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.delete("/api/horas/<string:id_empleado>/<int:id_tarea>/<string:fecha>")
def endpoint_eliminar_horas(id_empleado, id_tarea, fecha):
    try:
        eliminar_registro(id_empleado, id_tarea, fecha)
        return jsonify({"status": "success", "message": "Registro eliminado correctamente"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ------------------------------
#   ENDPOINTS PROYECTOS
# ------------------------------

@app.get("/api/proyectos/<int:id_proyecto>/costos")
def endpoint_costos_proyecto(id_proyecto):
    anio = request.args.get("anio", type=int)
    data = obtener_costos_proyecto(id_proyecto, anio)
    return jsonify(data), 200

if __name__ == "__main__":
    app.run(debug=True, port=5000)