from django.db import migrations


def update_teams(apps, schema_editor):
    Team = apps.get_model('core', 'Team')
    User = apps.get_model('core', 'User')
    
    # Map old names to new names
    mapping = {
        'team_a': 'p_team',
        'team_b': 'd_team',
        'team_c': 's_team',
    }
    
    # Update existing teams
    for old_name, new_name in mapping.items():
        try:
            team = Team.objects.get(name=old_name)
            team.name = new_name
            team.save()
        except Team.DoesNotExist:
            pass
    
    # Delete team_d if it exists
    Team.objects.filter(name='team_d').delete()
    
    # Create new teams if they don't exist
    for new_name in ('p_team', 'd_team', 's_team'):
        Team.objects.get_or_create(name=new_name)


def reverse_update(apps, schema_editor):
    Team = apps.get_model('core', 'Team')
    
    # Reverse mapping
    mapping = {
        'p_team': 'team_a',
        'd_team': 'team_b',
        's_team': 'team_c',
    }
    
    for new_name, old_name in mapping.items():
        try:
            team = Team.objects.get(name=new_name)
            team.name = old_name
            team.save()
        except Team.DoesNotExist:
            pass
    
    # Recreate team_d
    Team.objects.get_or_create(name='team_d')


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0014_seed_teams'),
    ]

    operations = [
        migrations.RunPython(update_teams, reverse_update),
    ]
