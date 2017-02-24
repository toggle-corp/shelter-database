"""Add h_id and image column to User table for
   humantarian id and profile image

Revision ID: 0a3993734aa2
Revises: fce90de893ef
Create Date: 2017-02-21 15:49:22.533563

"""

# revision identifiers, used by Alembic.
revision = '0a3993734aa2'
down_revision = 'fce90de893ef'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.add_column('user', sa.Column('h_id', sa.String(),
                  default='en'))
    op.add_column('user', sa.Column('image', postgresql.JSON(), nullable=True))
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('user', 'h_id')
    op.drop_column('user', 'image')
    ### end Alembic commands ###