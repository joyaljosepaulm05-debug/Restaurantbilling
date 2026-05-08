from django.db import models
class Category(models.Model):
    name= models.CharField(max_length=50)
    def __str__(self):
        return self.name
class MenuItem(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=6, decimal_places=2)
    is_available = models.BooleanField(default=True)
    itemno = models.IntegerField(default=0)
    category=models.ForeignKey(Category,on_delete=models.CASCADE,null=True,blank=True)
    def __str__(self):
        return self.name
class Inventory(models.Model):
    # Link to the MenuItem
    item = models.OneToOneField(MenuItem, on_delete=models.CASCADE, related_name='stock')
    
    quantity = models.IntegerField(default=0)
    supplier_name = models.CharField(max_length=100, blank=True)
    last_restock_date = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Stock for {self.item.name}: {self.quantity}"