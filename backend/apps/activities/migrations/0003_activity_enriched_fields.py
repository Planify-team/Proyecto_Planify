from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("activities", "0002_activity_city"),
    ]

    operations = [
        migrations.AddField(
            model_name="activity",
            name="latitude",
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
        migrations.AddField(
            model_name="activity",
            name="longitude",
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
        migrations.AddField(
            model_name="activity",
            name="address",
            field=models.CharField(blank=True, default="", max_length=300),
        ),
        migrations.AddField(
            model_name="activity",
            name="is_free",
            field=models.BooleanField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="activity",
            name="external_url",
            field=models.URLField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="activity",
            name="image_url",
            field=models.URLField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="activity",
            name="source",
            field=models.CharField(blank=True, db_index=True, default="manual", max_length=50),
        ),
        migrations.AddField(
            model_name="activity",
            name="external_id",
            field=models.CharField(blank=True, db_index=True, default="", max_length=200),
        ),
    ]
