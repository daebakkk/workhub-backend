# Generated migration for adding required_hours to Task, and task to WorkLog

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0010_add_performance_indexes'),
    ]

    operations = [
        migrations.RemoveIndex(
            model_name='task',
            name='core_task_assigne_72d350_idx',
        ),
        migrations.AddField(
            model_name='task',
            name='required_hours',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='task',
            name='progress',
            field=models.IntegerField(default=0),
        ),
        migrations.RemoveField(
            model_name='task',
            name='is_completed',
        ),
        migrations.AddField(
            model_name='worklog',
            name='task',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='logs', to='core.task'),
        ),
        migrations.AddIndex(
            model_name='task',
            index=models.Index(fields=['assigned_to', 'progress'], name='core_task_assigne_72d350_idx'),
        ),
    ]
