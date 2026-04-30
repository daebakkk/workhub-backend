from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0015_update_team_names'),
    ]

    operations = [
        migrations.AlterField(
            model_name='team',
            name='name',
            field=models.CharField(
                choices=[
                    ('p_team', 'Product Team'),
                    ('d_team', 'Developers Team'),
                    ('s_team', 'Support Team'),
                ],
                max_length=10,
                unique=True,
            ),
        ),
    ]
