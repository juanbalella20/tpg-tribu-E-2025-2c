import sys
import os
import random
from datetime import datetime
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

# --- CONFIGURACIÓN DE RUTAS ---
# Aseguramos que el directorio actual esté en el path para importar módulos locales
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

try:
    from servicio_bdd.servicio_bdd import (
        crear_bd_y_tabla, 
        obtener_registros_por_empleado, 
        eliminar_registro,
        obtener_todos_los_registros
    )
    from servicios.horas_controller.servicio_registro_horas.registro_horas import registrar_horas
except ImportError as e:
    print(f"Error importando servicios base: {e}")
    sys.exit(1)

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
            } for r in registros
        ]

try:
    from servicios.proyecto_controller.servicio_consulta_proyectos import obtener_costos_proyecto
except ImportError:
    def obtener_costos_proyecto(id, anio): 
        return []

app = Flask(__name__)
CORS(app)

# Inicializar Base de Datos
crear_bd_y_tabla()


@app.get("/")
def index():
    """Devuelve un resumen con el contenido actual de registro_horas.db."""
    try:
        registros = obtener_todos_los_registros()
        return jsonify({
            "status": "ok",
            "total": len(registros),
            "registros": registros
        }), 200
    except Exception as exc:
        return jsonify({
            "status": "error",
            "message": "No se pudo leer la base de datos",
            "details": str(exc)
        }), 500

BASE_MOCK_URL = "https://anypoint.mulesoft.com/mocking/api/v1/sources/exchange/assets/32c8fe38-22a6-4fbb-b461-170dfac937e4"
RESOURCES_URL = f"{BASE_MOCK_URL}/recursos-api/1.0.1/m/recursos"
PROJECTS_URL  = f"{BASE_MOCK_URL}/proyectos-api/1.0.0/m/proyectos"
TASKS_URL     = f"{BASE_MOCK_URL}/tareas-api/1.0.0/m/tareas"
ROLES_URL     = f"{BASE_MOCK_URL}/roles-api/1.0.0/m/roles"
# FINANCE_URL   = " "

@app.get("/api/employees/<string:employee_id>")
def get_employee_detail(employee_id):
    """Obtiene los detalles (Nombre, DNI) de un empleado específico por ID"""
    try:
        response = requests.get(RESOURCES_URL)
        if response.status_code == 200:
            data = response.json()
            employee = next((r for r in data if str(r["id"]) == str(employee_id)), None)
            
            if employee:
                return jsonify({
                    "employee_id": employee["id"],
                    "nombre": employee.get("nombre"),
                    "apellido": employee.get("apellido"),
                    "dni": employee.get("dni")
                }), 200
            else:
                return jsonify({"error": "Empleado no encontrado"}), 404
                
        return jsonify({"error": "Error al consultar recursos externos"}), 502
    except Exception as e:
        print(f"Error obteniendo empleado: {e}")
        return jsonify({"error": str(e)}), 500

@app.get("/api/simulate/rand_emplyee_id")
def simulate_login_id():
    """Simula obtener un ID de empleado aleatorio de la lista de recursos"""
    try:
        response = requests.get(RESOURCES_URL)
        if response.status_code == 200:
            data = response.json()
            if data:
                random_emp = random.choice(data)
                return jsonify({
                    "employee_id": random_emp["id"],
                    "nombre": random_emp.get("nombre"),
                    "apellido": random_emp.get("apellido"),
                    "dni": random_emp.get("dni")
                }), 200
    except Exception as e:
        print(f"Error simulando login: {e}")
    
    return jsonify({
        "employee_id": "1", 
        "nombre": "Usuario", 
        "apellido": "Default", 
        "dni": "00000000"
    }), 200

@app.get("/api/roles/")
def get_roles():
    try:
        response = requests.get(ROLES_URL)
        if response.status_code == 200:
            return jsonify(response.json()), 200
        return jsonify({"error": "No se pudieron obtener los roles"}), response.status_code
    except Exception as exc:
        return jsonify({"error": "Error interno del servidor", "details": str(exc)}), 500

# ------------------------------
#   ENDPOINTS ROLES
# ------------------------------

@app.get("/api/roles/<string:employee_id>")
def get_role_for_employee(employee_id):
    try:
        res_response = requests.get(RESOURCES_URL)
        if res_response.status_code != 200:
            return jsonify({"error": "Error consultando recursos externos"}), 502
            
        resources = res_response.json()
        employee = next((r for r in resources if str(r.get("id")) == str(employee_id)), None)
        
        if not employee:
            return jsonify({"status": "error", "message": "Empleado no encontrado"}), 404

        roles_response = requests.get(ROLES_URL)
        if roles_response.status_code != 200:
            return jsonify({"error": "Error consultando roles externos"}), 502

        roles = roles_response.json()
        role_id_target = str(employee.get("rolId"))
        role = next((rol for rol in roles if str(rol.get("id")) == role_id_target), None)

        return jsonify({
            "employeeId": employee_id,
            "roleId": employee.get("rolId"),
            "role": role
        }), 200
    except Exception as exc:
        return jsonify({"error": "Error interno del servidor", "details": str(exc)}), 500

# ------------------------------
#   ENDPOINTS PROYECTOS
# ------------------------------

@app.get("/api/projects/")
def get_all_proyectos():
    try:
        response = requests.get(PROJECTS_URL)
        if response.status_code == 200:
            data = response.json()
            colores = ['bg-red-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500']
            proyectos_formateados = []
            
            for index, proyecto in enumerate(data):
                proyectos_formateados.append({
                    "id": proyecto["id"],
                    "name": proyecto["nombre"],
                    "color": colores[index % len(colores)] 
                })
            return jsonify(proyectos_formateados), 200
        else:
            return jsonify({"error": "No se pudieron obtener los proyectos externos"}), 502
    except Exception as e:
        print(f"Error en get_all_proyectos: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500
    
@app.get("/api/projects/<string:employee_id>/")
def get_projects_per_employee(employee_id):
    try:
        projects=set()
        response_project = requests.get(PROJECTS_URL)
        response = requests.get(TASKS_URL)
        if response.status_code == 200 and response_project.status_code == 200:
            data = response.json()
            data_project= response_project.json()
            for tarea in data:
                pid_tarea = str(tarea.get("proyectoId"))
                recurso_tarea = str(tarea.get("recursoId"))
                
                if recurso_tarea == str(employee_id):
                    projects.add(pid_tarea)
            colores = ['bg-red-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500']
            proyectos_formateados = []
            for index, proyecto in enumerate(data_project):
                if proyecto["id"] in projects:
                    proyectos_formateados.append({
                        "id": proyecto["id"],
                        "name": proyecto["nombre"],
                        "color": colores[index % len(colores)] 
                    })
            return jsonify(proyectos_formateados), 200
        else:
            return jsonify({"error": "No se pudieron obtener las tareas externas"}), 502
    except Exception as e:
        print(f"Error en get_tareas_of_employee: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500


@app.get("/api/projects/<string:project_id>/<string:employee_id>/tasks/")
def get_tareas_of_employee(project_id, employee_id):
    try:
        response = requests.get(TASKS_URL)
        if response.status_code == 200:
            data = response.json()
            tareas_formateadas = []
            for tarea in data:
                pid_tarea = str(tarea.get("proyectoId"))
                recurso_tarea = str(tarea.get("recursoId"))
                
                if pid_tarea == str(project_id) and recurso_tarea == str(employee_id):
                    tareas_formateadas.append({
                        "id": tarea["id"],
                        "name": tarea["nombre"],
                        "projectId": pid_tarea,
                        "recursoId": recurso_tarea
                    })
            
            return jsonify(tareas_formateadas), 200
        else:
            return jsonify({"error": "No se pudieron obtener las tareas externas"}), 502
    except Exception as e:
        print(f"Error en get_tareas_of_employee: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@app.get("/api/projects/<string:project_id>/costos")
def endpoint_costos_proyecto(project_id):
    try:
        anio = request.args.get("anio", type=int)
        data = obtener_costos_proyecto(project_id, anio)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.get("/api/proyectos/<string:project_id>/info")
def get_project_info(project_id):
    """
    Agrega información de Tareas, Recursos, Finanzas y Horas registradas
    para un proyecto específico.
    """
    try:
        requested_year = request.args.get("anio")
        year_filter = datetime.now().year
        if requested_year:
            try:
                year_filter = int(requested_year)
            except ValueError:
                return jsonify({"error": "Parámetro 'anio' inválido"}), 400

        try:
            tasks_resp = requests.get(TASKS_URL)
            res_resp = requests.get(RESOURCES_URL)
            roles_resp = requests.get(ROLES_URL)
            # fin_resp = requests.get(FINANCE_URL)
        except requests.RequestException:
            return jsonify({"error": "Error de conexión con APIs externas"}), 503

        if not all(r.status_code == 200 for r in [tasks_resp, res_resp, roles_resp]):
            return jsonify({"error": "Fallo en respuestas de servicios externos"}), 502

        tasks_data = tasks_resp.json()
        resources_data = res_resp.json()
        roles_data = roles_resp.json()
        # finance_data = fin_resp.json() if fin_resp.status_code == 200 else []

        project_tasks = [
            t for t in tasks_data 
            if str(t.get("proyectoId") or t.get("projectId")) == str(project_id)
        ]
        
        task_ids = {str(t.get("id")) for t in project_tasks if t.get("id")}
        assigned_emp_ids = {str(t.get("recursoId")) for t in project_tasks if t.get("recursoId")}

        resources_map = {str(r.get("id")): r for r in resources_data}
        roles_map = {str(r.get("id")): r for r in roles_data}
        
        role_hourly_cost = {}
        # for profile in finance_data:
            # role_key = str(profile.get("rolAsociado") or profile.get("rolId") or "")
            # if role_key:
                # role_hourly_cost[role_key] = float(profile.get("costoHora") or 0)

        employees_info = []
        monthly_costs = {}
        monthly_hours = {}

        for emp_id in assigned_emp_ids:
            employee = resources_map.get(emp_id)
            if not employee:
                continue

            emp_role_id = str(employee.get("rolId"))
            role_obj = roles_map.get(emp_role_id)
            hourly_rate = role_hourly_cost.get(emp_role_id, 0.0)

            registros = obtener_registros_por_empleado(emp_id)
            
            emp_total_hours_project = 0

            for registro in registros:
                if str(registro.get("idTarea")) not in task_ids:
                    continue

                try:
                    fecha_dt = datetime.fromisoformat(registro.get("fecha"))
                except (TypeError, ValueError):
                    continue

                if fecha_dt.year != year_filter:
                    continue

                month_key = fecha_dt.month
                horas = float(registro.get("horasTrabajadas") or 0)
                
                emp_total_hours_project += horas

                if month_key not in monthly_hours:
                    monthly_hours[month_key] = {}
                if month_key not in monthly_costs:
                    monthly_costs[month_key] = {}

                monthly_hours[month_key][emp_id] = monthly_hours[month_key].get(emp_id, 0) + horas
                monthly_costs[month_key][emp_id] = monthly_costs[month_key].get(emp_id, 0) + (horas * hourly_rate)

            employees_info.append({
                "employeeId": emp_id,
                "nombre": employee.get("nombre"),
                "apellido": employee.get("apellido"),
                "rolId": emp_role_id,
                "rol": role_obj,
                "costoHora": hourly_rate,
                "totalHorasProyecto": emp_total_hours_project
            })
        costos_serializados = {
            str(m): {str(e): round(c, 2) for e, c in e_costs.items()}
            for m, e_costs in monthly_costs.items()
        }

        horas_serializadas = {
            str(m): {str(e): round(h, 2) for e, h in e_hours.items()}
            for m, e_hours in monthly_hours.items()
        }

        return jsonify({
            "projectId": project_id,
            "anio": year_filter,
            "empleados": employees_info,
            "costos": costos_serializados,
            "horas": horas_serializadas,
            "totalEmpleados": len(employees_info)
        }), 200

    except Exception as exc:
        print(f"Error en get_project_info: {exc}")
        return jsonify({"error": "Error interno del servidor", "details": str(exc)}), 500


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
        if not body:
            return jsonify({"status": "error", "message": "Body vacio"}), 400
            
        resultado = registrar_horas(body)
        status_code = 201 if resultado.get("status") == "success" else 400
        return jsonify(resultado), status_code
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.delete("/api/horas/<string:id_empleado>/<string:id_tarea>/<string:fecha>")
def endpoint_eliminar_horas(id_empleado, id_tarea, fecha):
    try:
        eliminar_registro(id_empleado, id_tarea, fecha)
        return jsonify({"status": "success", "message": "Registro eliminado correctamente"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
