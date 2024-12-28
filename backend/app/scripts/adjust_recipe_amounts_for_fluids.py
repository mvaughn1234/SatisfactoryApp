from app.models import RecipeInputs, RecipeOutputs, Item
from app.utils import get_session


from app.models import RecipeInputs, RecipeOutputs, Item
from app.utils import get_session

class UpdateLiquids:
    @staticmethod
    def adjust_recipe_amounts_for_fluids():
        with get_session() as session:
            # Load all data at once
            recipe_inputs = session.query(RecipeInputs).all()
            recipe_outputs = session.query(RecipeOutputs).all()
            items = session.query(Item).all()

            # Create a lookup dictionary
            item_forms = {item.id: item.form for item in items}

            for ingredient in recipe_inputs:
                form = item_forms.get(ingredient.item_id)
                if form is not None and form != "RF_SOLID":
                    print("adjusting input:", ingredient.item_id,
                          "form:", form,
                          "amount:", ingredient.input_quantity,
                          "desired:", ingredient.input_quantity/1000)
                    ingredient.input_quantity = ingredient.input_quantity / 1000

            for ingredient in recipe_outputs:
                form = item_forms.get(ingredient.item_id)
                if form is not None and form != "RF_SOLID":
                    print("adjusting output:", ingredient.item_id,
                          "form:", form,
                          "amount:", ingredient.output_quantity,
                          "desired:", ingredient.output_quantity/1000)
                    ingredient.output_quantity = ingredient.output_quantity / 1000

            for ingredient in recipe_inputs:
                form = item_forms.get(ingredient.item_id)
                if form is not None and form == "RF_INVALID":
                    print("adjusting input:", ingredient.item_id,
                          "form:", form,
                          "amount:", ingredient.input_quantity,
                          "desired:", 1)
                    ingredient.input_quantity = 1

            for ingredient in recipe_outputs:
                form = item_forms.get(ingredient.item_id)
                if form is not None and form == "RF_INVALID":
                    print("adjusting output:", ingredient.item_id,
                          "form:", form,
                          "amount:", ingredient.output_quantity,
                          "desired:", 1)
                    ingredient.output_quantity = 1

            session.commit()
