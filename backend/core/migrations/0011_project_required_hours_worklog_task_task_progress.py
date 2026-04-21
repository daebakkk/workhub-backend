# Generated migration for adding required_hours to Task, and task to WorkLog

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0010_add_performance_indexes'),
    ]

    operations = [
        # Drop old index on (assigned_to, is_completed) if it exists
        migrations.RunSQL(
            sql="DROP INDEX IF EXISTS core_task_assigne_72d350_idx;",
            reverse_sql=migrations.RunSQL.noop,
        ),

        # Add required_hours to Task if not already there
        migrations.RunSQL(
            sql="""
                ALTER TABLE core_task
                ADD COLUMN IF NOT EXISTS required_hours NUMERIC(10, 2) NOT NULL DEFAULT 0;
            """,
            reverse_sql="ALTER TABLE core_task DROP COLUMN IF EXISTS required_hours;",
        ),

        # Add progress to Task if not already there
        migrations.RunSQL(
            sql="""
                ALTER TABLE core_task
                ADD COLUMN IF NOT EXISTS progress INTEGER NOT NULL DEFAULT 0;
            """,
            reverse_sql="ALTER TABLE core_task DROP COLUMN IF EXISTS progress;",
        ),

        # Drop is_completed from Task if it exists
        migrations.RunSQL(
            sql="ALTER TABLE core_task DROP COLUMN IF EXISTS is_completed;",
            reverse_sql=migrations.RunSQL.noop,
        ),

        # Add task_id FK to WorkLog if not already there
        migrations.RunSQL(
            sql="""
                ALTER TABLE core_worklog
                ADD COLUMN IF NOT EXISTS task_id BIGINT NULL
                    REFERENCES core_task(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;
            """,
            reverse_sql="ALTER TABLE core_worklog DROP COLUMN IF EXISTS task_id;",
        ),

        # Create new index on (assigned_to, progress) if not exists
        migrations.RunSQL(
            sql="""
                CREATE INDEX IF NOT EXISTS core_task_assigne_72d350_idx
                ON core_task (assigned_to_id, progress);
            """,
            reverse_sql="DROP INDEX IF EXISTS core_task_assigne_72d350_idx;",
        ),

        # Tell Django's state about the ORM-level changes
        migrations.SeparateDatabaseAndState(
            state_operations=[
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
            ],
            database_operations=[],  # already done via RunSQL above
        ),
    ]
