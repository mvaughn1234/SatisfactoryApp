"""changing preferred column of user_recipes to map to the recipe_id of the preferred recipe, to match the change in data structure on the frontend

Revision ID: 3491433f7f87
Revises: f62550756d0c
Create Date: 2024-12-13 10:09:11.733357

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3491433f7f87'
down_revision = 'f62550756d0c'
branch_labels = None
depends_on = None


def upgrade():
    # Step 1: Add a temporary column `preferred_temp` with the same type and constraints as `recipe_id`
    op.add_column('user_recipes', sa.Column('preferred_temp', sa.Integer, sa.ForeignKey('recipes.id'), nullable=True))

    # Step 2: Populate `preferred_temp` with values from `recipe_id`
    op.execute("""
        UPDATE user_recipes
        SET preferred_temp = recipe_id
    """)

    # Step 3: Set `preferred_temp` to be non-nullable
    op.alter_column('user_recipes', 'preferred_temp', nullable=False)

    # Step 4: Drop the old `preferred` column
    op.drop_column('user_recipes', 'preferred')

    # Step 5: Rename `preferred_temp` to `preferred`
    op.alter_column('user_recipes', 'preferred_temp', new_column_name='preferred')


def downgrade():
    # Reverse the upgrade steps

    # Step 1: Add the old `preferred` column back as a boolean
    op.add_column('user_recipes', sa.Column('preferred', sa.Boolean, nullable=False, server_default=sa.false()))

    # Step 2: Populate `preferred` with default data (or set based on the use case)
    op.execute("""
        UPDATE user_recipes
        SET preferred = false
    """)

    # Step 3: Drop the new `preferred` column
    op.drop_column('user_recipes', 'preferred')

    # Step 4: Rename `preferred` back to `preferred_temp`
    op.alter_column('user_recipes', 'preferred', new_column_name='preferred_temp')
