# Generated manually on 2026-04-23

import django.db.models.fields
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0011_add_personal_ledger_entries'),
    ]

    operations = [
        migrations.AlterField(
            model_name='visitrecord',
            name='unpaid_date',
            field=django.db.models.fields.DateField(db_column='unpaid_date', null=True, blank=True),
        ),
    ]
