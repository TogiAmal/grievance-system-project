# api/models.py

from django.db import models
from django.contrib.auth.models import AbstractUser


class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('staff', 'Non-Teaching Staff'),
        ('grievance_cell', 'Grievance Cell'),
        ('admin', 'Admin'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    name = models.CharField(max_length=150, blank=True)
    is_approved = models.BooleanField(default=False)
    # UPDATED: Validator removed and max_length increased for flexibility
    admission_number = models.CharField(
        max_length=100, 
        unique=True,
        null=True, 
        blank=True 
    )
    
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    college_email = models.EmailField(max_length=255, unique=True, null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.college_email:
            self.email = self.college_email
        super().save(*args, **kwargs)


class Grievance(models.Model):
    STATUS_CHOICES = [
        ('SUBMITTED', 'Submitted'),
        ('IN_REVIEW', 'In Review'),
        ('ACTION_TAKEN', 'Action Taken'),
        ('RESOLVED', 'Resolved'),
    ]
    submitted_by = models.ForeignKey(
        'api.CustomUser',
        on_delete=models.CASCADE,
        related_name='submitted_grievances'
    )
    assigned_to = models.ForeignKey(
        'api.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_grievances',
        limit_choices_to={'role__in': ['admin', 'grievance_cell']}
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SUBMITTED')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class GrievanceComment(models.Model):
    grievance = models.ForeignKey(Grievance, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey('api.CustomUser', on_delete=models.CASCADE)
    comment_text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Comment by {self.user.username} on {self.grievance.title}'