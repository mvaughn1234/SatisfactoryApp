"""added frontend_target_id column to production_line_target table, temporarily adding default value to populate rows already present in db

Revision ID: e7fe54ed1a09
Revises: d3735f67e60f
Create Date: 2024-12-05 13:29:06.873181

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e7fe54ed1a09'
down_revision = 'd3735f67e60f'
branch_labels = None
depends_on = None


def upgrade():
    # Add the column with a default value and NOT NULL constraint
    op.add_column(
        'production_line_targets',
        sa.Column('target_id_frontend', sa.String(), nullable=False, server_default='1')
    )
    # Remove the default value after the column is added (if needed later)
    op.alter_column(
        'production_line_targets',
        'target_id_frontend',
        server_default=None
    )


def downgrade():
    # Drop the column during downgrade
    op.drop_column('production_line_targets', 'target_id_frontend')
