from flask import Blueprint, jsonify, redirect, url_for
from app.services.building_service import BuildingService

buildings_blueprint = Blueprint('buildings', __name__)

@buildings_blueprint.route('/detail/', methods=['GET'])
def get_all_buildings_detail():
    buildings = BuildingService.get_all_buildings_detail()
    return jsonify(buildings)

@buildings_blueprint.route('/summary/', methods=['GET'])
def get_all_buildings_summary():
    buildings = BuildingService.get_all_buildings_summary()
    return jsonify(buildings)

@buildings_blueprint.route('/detail/<int:building_id>', methods=['GET'])
def get_building_by_id_detail(building_id):
    building = BuildingService.get_building_by_id_detail(building_id)
    if building:
        return jsonify(building)
    else:
        return jsonify({'message': 'Building not found'}), 404

@buildings_blueprint.route('/summary/<int:building_id>', methods=['GET'])
def get_building_by_id_summary(building_id):
    building = BuildingService.get_building_by_id_summary(building_id)
    if building:
        return jsonify(building)
    else:
        return jsonify({'message': 'Building not found'}), 404



# Handle Redirects
@buildings_blueprint.route('/', methods=['GET'])
@buildings_blueprint.route('/detail', methods=['GET'])
def redirect_to_detail():
    return redirect(url_for('buildings.get_all_buildings_detail'))

@buildings_blueprint.route('/summary', methods=['GET'])
def redirect_to_summary():
    return redirect(url_for('buildings.get_all_buildings_summary'))

@buildings_blueprint.route('/detail/<int:building_id>/', methods=['GET'])
def redirect_to_id_detail(building_id):
    return redirect(url_for('buildings.get_building_by_id_detail', building_id=building_id))

@buildings_blueprint.route('/summary/<int:building_id>/', methods=['GET'])
def redirect_to_id_summary(building_id):
    return redirect(url_for('buildings.get_building_by_id_summary', building_id=building_id))
