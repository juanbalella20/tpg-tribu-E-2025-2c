import json
import requests
import random
from flask import Flask, request, jsonify
from flask_cors import CORS

# IMPORTAR SERVICIOS
from servicios.horas_controller.servicio_consulta_horas import *
from servicios.horas_controller.servicio_registro_horas import *
from servicios.proyecto_controller.servicio_consulta_proyectos import *

RESOURCES_URL = "https://anypoint.mulesoft.com/mocking/api/v1/sources/exchange/assets/32c8fe38-22a6-4fbb-b461-170dfac937e4/recursos-api/1.0.1/m/recursos"

app = Flask(__name__)
CORS(app)

@app.get("/api/simulate/rand_emplyee_id")
def simulate_login_id():
    data = requests.get(RESOURCES_URL).json()
    employee_id = data[random.randint(0, len(data)-1)]["id"]
    return jsonify({"employee_id" : employee_id}), 200

# -----------------------
#     ENDPOINTS HORAS
# -----------------------

@app.get("/api/horas/<int:id_empleado>/<string:fecha>")
def endpoint_horas_semanales(id_empleado, fecha):
    data = obtener_horas_semanales(id_empleado, fecha)
    return jsonify(data), 200


@app.post("/api/horas")
def endpoint_registrar_horas():
    body = request.get_json()

    resultado = registrar_horas(body)
    return jsonify(resultado), 201


# ------------------------------
#   ENDPOINTS PROYECTOS / COSTOS
# ------------------------------

@app.get("/api/proyectos/<int:id_proyecto>/costos")
def endpoint_costos_proyecto(id_proyecto):
    anio = request.args.get("anio", type=int)

    data = obtener_costos_proyecto(id_proyecto, anio)
    return jsonify(data), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)
