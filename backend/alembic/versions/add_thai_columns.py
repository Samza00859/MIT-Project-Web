"""Add Thai translation columns to report_results

Revision ID: add_thai_columns
Revises: 
Create Date: 2026-01-12 15:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_thai_columns'
down_revision: Union[str, None] = 'b3b72141a976'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add Thai title column
    op.add_column('report_results', sa.Column('title_th', sa.String(), nullable=True))
    
    # Add Thai content column (JSON)
    op.add_column('report_results', sa.Column('content_th', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('report_results', 'content_th')
    op.drop_column('report_results', 'title_th')
