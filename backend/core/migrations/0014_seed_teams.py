from django.db import migrations


def seed_teams(apps, schema_editor):
    Team = apps.get_model('core', 'Team')
    for slug in ('team_a', 'team_b', 'team_c', 'team_d'):
        Team.objects.get_or_create(name=slug)


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0013_team_user_team'),
    ]

    operations = [
        migrations.RunPython(seed_teams, migrations.RunPython.noop),
    ]
