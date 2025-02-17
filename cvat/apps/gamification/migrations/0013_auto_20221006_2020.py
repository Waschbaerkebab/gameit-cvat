# Generated by Django 3.2.12 on 2022-10-06 20:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gamification', '0012_auto_20220924_0852'),
    ]

    operations = [
        migrations.RenameField(
            model_name='userprofile',
            old_name='profile_style',
            new_name='profile_class',
        ),
        migrations.AddField(
            model_name='userprofile',
            name='profile_background_elements',
            field=models.IntegerField(default=0),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='profile_background',
            field=models.IntegerField(default=0),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='profile_border',
            field=models.IntegerField(default=0),
        ),
    ]
