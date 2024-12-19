"""set target_id_frontend column to unique constraint

Revision ID: 9c5b96b89e0f
Revises: e7fe54ed1a09
Create Date: 2024-12-09 14:40:55.161958

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9c5b96b89e0f'
down_revision = 'e7fe54ed1a09'
branch_labels = None
depends_on = None


def upgrade():
    # Add unique constraint to the `target_id_frontend` column
    op.create_unique_constraint(
        constraint_name='uq_target_id_frontend',
        table_name='production_line_targets',
        columns=['target_id_frontend']
    )

def downgrade():
    # Remove the unique constraint
    op.drop_constraint(
        constraint_name='uq_target_id_frontend',
        table_name='production_line_targets',
        type_='unique'
    )
