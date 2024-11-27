from rest_framework import serializers
from .models import Category, ConfigurationSchedule, Page

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class PageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Page
        fields = '__all__'

class ConfigurationScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfigurationSchedule
        fields = ['id', 'page', 'frequency', 'hour', 'minute', 'day_of_week', 'day']