"""Add unique constraint to line_id and target_id_frontend

Revision ID: 6309d32de1bc
Revises: 3491433f7f87
Create Date: 2024-12-19 12:25:16.478584

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6309d32de1bc'
down_revision = '3491433f7f87'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint('uq_target_id_frontend', 'production_line_targets', type_='unique')
    op.create_unique_constraint('uq_line_id_target_id_frontend', 'production_line_targets', ['line_id', 'target_id_frontend'])
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint('uq_line_id_target_id_frontend', 'production_line_targets', type_='unique')
    op.create_unique_constraint('uq_target_id_frontend', 'production_line_targets', ['target_id_frontend'])
    # ### end Alembic commands ###
