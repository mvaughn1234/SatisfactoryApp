"""removed primary key constraint from user_id and recipe_id columns of user_recipes table

Revision ID: 1dada2e81d58
Revises: 27cd3148366d
Create Date: 2024-12-03 18:19:16.793965

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1dada2e81d58'
down_revision = '27cd3148366d'
branch_labels = None
depends_on = None


def upgrade():
    # Remove composite primary key and add a single primary key on `id`
    with op.batch_alter_table('user_recipes') as batch_op:
        batch_op.drop_constraint('user_recipes_pkey', type_='primary')  # Drop the existing composite primary key
        batch_op.create_primary_key('pk_user_recipes', ['id'])  # Create new primary key on `id`

        # Make `user_id` and `recipe_id` not nullable
        batch_op.alter_column('user_id', nullable=False)
        batch_op.alter_column('recipe_id', nullable=False)


def downgrade():
    # Revert changes to the primary key
    with op.batch_alter_table('user_recipes') as batch_op:
        batch_op.drop_constraint('pk_user_recipes', type_='primary')  # Drop the new primary key
        batch_op.create_primary_key('user_recipes_pkey', ['user_id', 'recipe_id'])  # Recreate composite primary key

        # Make `user_id` and `recipe_id` nullable (if they were nullable originally)
        batch_op.alter_column('user_id', nullable=True)
        batch_op.alter_column('recipe_id', nullable=True)
