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
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
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
    
    CHAT_STATUS_CHOICES = [
        ('NONE', 'No Request'),
        ('REQUESTED', 'Requested by User'),
        ('ACCEPTED', 'Accepted by Admin'),
        ('DECLINED', 'Declined by Admin'),
    ]
    evidence_image = models.ImageField(upload_to='grievance_evidence/', null=True, blank=True)
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
    chat_status = models.CharField(max_length=10, choices=CHAT_STATUS_CHOICES, default='NONE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class GrievanceComment(models.Model):
    grievance = models.ForeignKey(Grievance, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey('api.CustomUser', on_delete=models.CASCADE)
    comment_text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Comment by {self.user.username} on {self.grievance.title}'


class ChatMessage(models.Model):
    grievance = models.ForeignKey(Grievance, related_name='chat_messages', on_delete=models.CASCADE)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Message by {self.user.username}'