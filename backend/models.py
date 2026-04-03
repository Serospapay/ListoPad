
from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name

class Book(models.Model):
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    inventory = models.IntegerField(default=0)
    description = models.TextField(blank=True, null=True)
    cover_image = models.TextField() # Base64 або URL
    pages = models.IntegerField(default=0)
    year = models.IntegerField(default=2024)
    publisher = models.CharField(max_length=100, default='ЛистоПад')
    cover = models.CharField(max_length=100, default='Тверда')
    format = models.CharField(max_length=100, default='145x215 мм')
    weight = models.CharField(max_length=100, default='550 г')
    rating = models.FloatField(default=0.0)
    categories = models.ManyToManyField(Category, blank=True)
    
    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-id']

class Order(models.Model):
    customer_id = models.CharField(max_length=100)
    customer_name = models.CharField(max_length=255)
    book_title = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, default='ordered')
    
    class Meta:
        ordering = ['-date']
