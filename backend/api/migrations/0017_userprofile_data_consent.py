from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Record whether a user agreed to CyberSentinel processing their details.

    Existing accounts default to 'pending' rather than 'granted': nobody was
    ever shown the dialog, so there is no answer to inherit. They are asked the
    next time they sign in.
    """

    dependencies = [
        ('api', '0016_add_userprofile_phone'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='data_consent',
            field=models.CharField(
                choices=[
                    ('pending', 'Not yet asked'),
                    ('granted', 'Granted'),
                    ('declined', 'Declined'),
                ],
                default='pending',
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='data_consent_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='data_consent_version',
            field=models.CharField(blank=True, default='', max_length=20),
        ),
    ]
