from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("recommendations", "0003_recommendation_score_breakdown"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="interactionhistory",
            index=models.Index(
                fields=["entity_type", "entity_id", "created_at"],
                name="interaction_entity_created_idx",
            ),
        ),
    ]
