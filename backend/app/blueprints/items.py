from flask import Blueprint, jsonify, redirect, url_for
from app.services.item_service import ItemService

items_blueprint = Blueprint('items', __name__)

@items_blueprint.route('/detail/', methods=['GET'])
def get_all_items_detail():
    items = ItemService.get_all_items_detail()
    return jsonify(items)

@items_blueprint.route('/summary/', methods=['GET'])
def get_all_items_summary():
    items = ItemService.get_all_items_summary()
    return jsonify(items)

@items_blueprint.route('/detail/<int:item_id>', methods=['GET'])
def get_item_by_id_detail(item_id):
    item = ItemService.get_item_by_id_detail(item_id)
    if item:
        return jsonify(item)
    else:
        return jsonify({'message': 'Item not found'}), 404

@items_blueprint.route('/summary/<int:item_id>', methods=['GET'])
def get_item_by_id_summary(item_id):
    item = ItemService.get_item_by_id_summary(item_id)
    if item:
        return jsonify(item)
    else:
        return jsonify({'message': 'Item not found'}), 404

@items_blueprint.route('/components/detail/', methods=['GET'])
def get_component_items_detail():
    items = ItemService.get_component_items_detail()
    if items:
        return jsonify(items)
    else:
        return jsonify({'message': 'No components found.'}), 404

@items_blueprint.route('/components/summary/', methods=['GET'])
def get_component_items_summary():
    items = ItemService.get_component_items_summary()
    if items:
        return jsonify(items)
    else:
        return jsonify({'message': 'No components found.'}), 404

# Handle Redirects
@items_blueprint.route('/', methods=['GET'])
@items_blueprint.route('/detail', methods=['GET'])
def redirect_to_detail():
    return redirect(url_for('items.get_all_items_detail'))

@items_blueprint.route('/summary', methods=['GET'])
def redirect_to_summary():
    return redirect(url_for('items.get_all_items_summary'))

@items_blueprint.route('/components', methods=['GET'])
@items_blueprint.route('/components/', methods=['GET'])
@items_blueprint.route('/components/detail', methods=['GET'])
def redirect_to_components_detail():
    return redirect(url_for('items.get_component_items_detail'))

@items_blueprint.route('/components/summary', methods=['GET'])
def redirect_to_components_summary():
    return redirect(url_for('items.get_component_items_summary'))

@items_blueprint.route('/detail/<int:item_id>/', methods=['GET'])
def redirect_to_id_detail(item_id):
    return redirect(url_for('items.get_item_by_id_detail', item_id=item_id))

@items_blueprint.route('/summary/<int:item_id>/', methods=['GET'])
def redirect_to_id_summary(item_id):
    return redirect(url_for('items.get_item_by_id_summary', item_id=item_id))
