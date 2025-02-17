# Generated by Django 3.2.12 on 2022-09-22 08:22

import cvat.apps.gamification.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gamification', '0009_userprofile_selectedstatistics'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='items_bought',
            field=models.CharField(default='', max_length=255),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='mystery_gifts_bought',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='online_status',
            field=models.CharField(choices=[('Online', 'ONLINE'), ('Do not Disturb', 'DO_NOT_DISTURB'), ('Offline', 'OFFLINE')], default=cvat.apps.gamification.models.OnlineStatusChoice['ONLINE'], max_length=32),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='profile_style',
            field=models.CharField(default='', max_length=255),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='selectedBadges',
            field=models.CharField(default='', max_length=255),
        ),
    ]
