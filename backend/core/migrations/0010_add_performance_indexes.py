from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0009_alter_user_specialization'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['user', '-created_at'], name='core_notifi_user_id_0c3651_idx'),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['user', 'is_read'], name='core_notifi_user_id_3d72ff_idx'),
        ),
        migrations.AddIndex(
            model_name='task',
            index=models.Index(fields=['project', '-created_at'], name='core_task_project_f7ecb6_idx'),
        ),
        migrations.AddIndex(
            model_name='task',
            index=models.Index(fields=['project', 'assigned_to'], name='core_task_project_90b3ef_idx'),
        ),
        migrations.AddIndex(
            model_name='task',
            index=models.Index(fields=['assigned_to', 'is_completed'], name='core_task_assigne_72d350_idx'),
        ),
        migrations.AddIndex(
            model_name='worklog',
            index=models.Index(fields=['staff', '-created_at'], name='core_worklo_staff_i_c226b2_idx'),
        ),
        migrations.AddIndex(
            model_name='worklog',
            index=models.Index(fields=['status', '-created_at'], name='core_worklo_status_5f2068_idx'),
        ),
        migrations.AddIndex(
            model_name='worklog',
            index=models.Index(fields=['approved_by', 'approved_at'], name='core_worklo_approve_e0dbce_idx'),
        ),
        migrations.AddIndex(
            model_name='worklog',
            index=models.Index(fields=['rejected_by', 'rejected_at'], name='core_worklo_rejecte_b9e456_idx'),
        ),
        migrations.AddIndex(
            model_name='worklog',
            index=models.Index(fields=['date'], name='core_worklog_date_7a52f0_idx'),
        ),
    ]
