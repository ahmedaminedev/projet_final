# Generated by Django 4.1.13 on 2024-07-16 21:44

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100)),
                ('parent_category', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='subcategories', to='categories.category')),
            ],
        ),
        migrations.CreateModel(
            name='Page',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('id_fournisseur', models.IntegerField()),
                ('username', models.CharField(max_length=100)),
                ('username_scraper', models.CharField(blank=True, max_length=100, null=True)),
                ('nombre_page_max', models.IntegerField(blank=True, null=True)),
                ('base_url', models.URLField()),
                ('page_suffix', models.CharField(blank=True, max_length=100, null=True)),
                ('description', models.TextField(blank=True, null=True)),
                ('Type', models.CharField(choices=[('Avec_pagination', 'Avec_pagination'), ('Autre', 'Autre')], default='Avec_pagination', max_length=20)),
                ('etat_service', models.CharField(choices=[('EN_ATTENTE', 'En Attente'), ('TERMINER', 'Terminé')], default='EN_ATTENTE', max_length=20)),
                ('date_creation', models.DateTimeField(auto_now_add=True, null=True)),
                ('date_dernier_scraping', models.DateTimeField(blank=True, null=True)),
                ('category', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='categories.category')),
            ],
        ),
        migrations.CreateModel(
            name='ConfigurationSchedule',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('frequency', models.CharField(choices=[('DAILY', 'Chaque jour'), ('WEEKLY', 'Chaque semaine'), ('MONTHLY', 'Chaque mois')], default='MONTHLY', max_length=10)),
                ('hour', models.PositiveIntegerField(blank=True, null=True)),
                ('minute', models.PositiveIntegerField(blank=True, null=True)),
                ('hours', models.PositiveIntegerField(blank=True, null=True)),
                ('minutes', models.PositiveIntegerField(blank=True, null=True)),
                ('day_of_week', models.CharField(blank=True, choices=[('mon', 'Lundi'), ('tue', 'Mardi'), ('wed', 'Mercredi'), ('thu', 'Jeudi'), ('fri', 'Vendredi'), ('sat', 'Samedi'), ('sun', 'Dimanche')], max_length=10, null=True)),
                ('day', models.PositiveIntegerField(blank=True, null=True)),
                ('page', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to='categories.page')),
            ],
        ),
    ]
