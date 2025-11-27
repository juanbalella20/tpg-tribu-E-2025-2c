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
PROJECTS_URL = "https://anypoint.mulesoft.com/mocking/api/v1/sources/exchange/assets/32c8fe38-22a6-4fbb-b461-170dfac937e4/proyectos-api/1.0.0/m/proyectos"
TASKS_URL = "https://anypoint.mulesoft.com/mocking/api/v1/sources/exchange/assets/32c8fe38-22a6-4fbb-b461-170dfac937e4/tareas-api/1.0.0/m/tareas"
ROLES_URL = "https://anypoint.mulesoft.com/mocking/api/v1/sources/exchange/assets/32c8fe38-22a6-4fbb-b461-170dfac937e4/roles-api/1.0.0/m/roles"
# FINANCE_URL = ""

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

@app.get("/api/projects/")
def get_all_proyectos():
    try:
        response = requests.get(PROJECTS_URL)
        if response.status_code == 200:
            data = response.json()
            colores = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500']
            proyectos_formateados = []
            for index, proyecto in enumerate(data):
                proyectos_formateados.append({
                    "id": proyecto["id"],
                    "name": proyecto["nombre"],
                    "description": proyecto["descripcion"],
                    "color": colores[index % len(colores)] 
                })
            return jsonify(proyectos_formateados), 200
        else:
            return jsonify({"error": "No se pudieron obtener los proyectos externos"}), 502
    except Exception as e:
        print(f"Error en get_proyectos: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@app.get("/api/projects/<string:project_id>/tasks/")
def get_all_tareas(project_id):
    try:
        response = requests.get(TASKS_URL)
        if response.status_code == 200:
            data = response.json()
            tareas_formateadas = []
            for tarea in data:
                pid_tarea = tarea.get("proyectoId")
                if str(pid_tarea) == str(project_id):
                    tareas_formateadas.append({
                        "id": tarea["id"],
                        "name": tarea["nombre"],
                        "projectId": pid_tarea
                    })
            
            return jsonify(tareas_formateadas), 200
        else:
            return jsonify({"error": "No se pudieron obtener las tareas externas"}), 502
    except Exception as e:
        print(f"Error en get_all_tareas: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500



@app.get("/api/roles/")
def get_roles():
    try:
        data = requests.get(ROLES_URL).json()
        return jsonify(data), 200
    except Exception as exc:
        return jsonify({"error": "Error interno del servidor"}), 500

# ------------------------------
#   ENDPOINTS ROLES
# ------------------------------

@app.get("/api/roles/<string:employee_id>")
def get_role_for_employee(employee_id):
    try:
        resources = requests.get(RESOURCES_URL).json()
        employee = next((resource for resource in resources if str(resource.get("id")) == str(employee_id)), None)
        if not employee:
            return jsonify({"status": "error", "message": "Empleado no encontrado"}), 404

        roles = requests.get(ROLES_URL).json()
        role = next((rol for rol in roles if str(rol.get("id")) == str(employee.get("rolId"))), None)

        return jsonify({
            "employeeId": employee_id,
            "roleId": employee.get("rolId"),
            "role": role
        }), 200
    except Exception as exc:
        return jsonify({"error": "Error interno del servidor"}), 500


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
