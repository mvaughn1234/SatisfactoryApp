"""re-doing the user_recipes table because i can't figure out how to unfuck it

Revision ID: 902918036a4f
Revises: a1dd4d8869cf
Create Date: 2024-12-03 18:00:02.789029

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '902918036a4f'
down_revision = 'a1dd4d8869cf'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('user_recipes')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('user_recipes',
    sa.Column('recipe_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('known', sa.BOOLEAN(), autoincrement=False, nullable=False),
    sa.Column('preferred', sa.BOOLEAN(), autoincrement=False, nullable=False),
    sa.Column('excluded', sa.BOOLEAN(), autoincrement=False, nullable=False),
    sa.Column('id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('user_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.ForeignKeyConstraint(['recipe_id'], ['recipes.id'], name='user_recipes_recipe_id_fkey'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='user_recipes_user_id_fkey')
    )
    # ### end Alembic commands ###
