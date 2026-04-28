from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0012_rename_core_notifi_user_id_0c3651_idx_core_notifi_user_id_1cc5b6_idx_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Team',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(
                    choices=[
                        ('team_a', 'Team A'),
                        ('team_b', 'Team B'),
                        ('team_c', 'Team C'),
                        ('team_d', 'Team D'),
                    ],
                    max_length=10,
                    unique=True,
                )),
            ],
        ),
        migrations.AddField(
            model_name='user',
            name='team',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='members',
                to='core.team',
            ),
        ),
    ]
