from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("planner", "0002_add_planned_status_and_plan_feedback"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="plan",
            index=models.Index(fields=["user", "-created_at"], name="plans_user_created_idx"),
        ),
        migrations.AddIndex(
            model_name="plan",
            index=models.Index(fields=["date", "status"], name="plans_date_status_idx"),
        ),
    ]
