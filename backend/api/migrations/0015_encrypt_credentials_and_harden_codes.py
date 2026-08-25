"""Move stored secrets off plaintext, and harden verification codes.

Three separate problems, one migration because they share a deployment:

1. `AdminAuthKey.auth_key` held an administrator's second factor in the clear.
   It becomes a SHA-256 hash plus a display prefix. Existing keys are hashed in
   place, so administrators keep the key they already have.
2. Credentials that must be replayed to a third party (Twilio, Google, OpenAI,
   VirusTotal) move to encrypted columns. Existing values are re-saved through
   the new field, which encrypts them on the way out.
3. `PasswordResetOTP` gains `purpose` and `attempts`, and stores a hash instead
   of the code. Outstanding codes are deleted rather than migrated — they live
   ten minutes, and asking a handful of users to click "resend" is better than
   carrying plaintext forward.

The credential encryption is reversible: `crypto.decrypt` passes through any
value without the `enc$v1$` marker, so a rollback to the previous field classes
still reads rows written before this ran. Rows written *after* it will not be
readable by the old code — that is the intended one-way step.
"""

from django.db import migrations, models
import django.db.models.deletion

import api.fields


def hash_existing_admin_keys(apps, schema_editor):
    from api.crypto import hash_secret

    AdminAuthKey = apps.get_model('api', 'AdminAuthKey')
    for key in AdminAuthKey.objects.all().iterator():
        raw = (key.auth_key or '').strip()
        if not raw:
            continue
        key.key_hash = hash_secret(raw)
        key.prefix = raw[:12]
        key.save(update_fields=['key_hash', 'prefix'])


def unhash_admin_keys(apps, schema_editor):
    """Irreversible by design — a hash cannot be turned back into the key.

    Rolling back leaves `auth_key` blank, which fails closed: every
    administrator has to be reissued a key rather than silently keeping a
    guessable one.
    """
    pass


def encrypt_existing_credentials(apps, schema_editor):
    """Re-save every row so the new encrypted fields write ciphertext.

    Reading is safe: `decrypt` returns a value that lacks the marker unchanged,
    so pre-migration plaintext comes back as itself and is written back
    encrypted.
    """
    UserIntegration = apps.get_model('api', 'UserIntegration')
    for row in UserIntegration.objects.all().iterator():
        row.save(update_fields=[
            'gmail_access_token', 'twilio_token', 'openai_api_key', 'virustotal_api_key',
        ])

    UserProfile = apps.get_model('api', 'UserProfile')
    for row in UserProfile.objects.exclude(mfa_secret='').iterator():
        row.save(update_fields=['mfa_secret'])

    OAuthProvider = apps.get_model('api', 'OAuthProvider')
    for row in OAuthProvider.objects.exclude(client_secret='').iterator():
        row.save(update_fields=['client_secret'])

    ConnectedAccount = apps.get_model('api', 'ConnectedAccount')
    for row in ConnectedAccount.objects.all().iterator():
        row.save(update_fields=['access_token', 'refresh_token'])


def noop(apps, schema_editor):
    pass


def drop_outstanding_codes(apps, schema_editor):
    """Outstanding verification codes cannot survive the switch to hashed
    storage, and they expire in ten minutes anyway."""
    apps.get_model('api', 'PasswordResetOTP').objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0014_alter_scanlog_risk_level_alter_scanlog_scan_type_and_more'),
    ]

    operations = [
        # ── 1. Admin auth keys become hashes ────────────────────────────────
        migrations.AddField(
            model_name='adminauthkey',
            name='key_hash',
            field=models.CharField(default='', max_length=64),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='adminauthkey',
            name='prefix',
            field=models.CharField(blank=True, default='', max_length=20),
        ),
        migrations.RunPython(hash_existing_admin_keys, unhash_admin_keys),
        migrations.RemoveField(model_name='adminauthkey', name='auth_key'),
        migrations.AlterField(
            model_name='adminauthkey',
            name='key_hash',
            field=models.CharField(max_length=64, unique=True),
        ),

        # ── 2. Verification codes: hashed, purposed, attempt-limited ────────
        migrations.RunPython(drop_outstanding_codes, noop),
        migrations.AlterField(
            model_name='passwordresetotp',
            name='otp',
            field=models.CharField(
                help_text='SHA-256 of the code; never the code itself.', max_length=64),
        ),
        migrations.AddField(
            model_name='passwordresetotp',
            name='purpose',
            field=models.CharField(
                choices=[('reset', 'Password reset'), ('login', 'Passwordless login')],
                default='reset', max_length=10),
        ),
        migrations.AddField(
            model_name='passwordresetotp',
            name='attempts',
            field=models.PositiveSmallIntegerField(default=0),
        ),
        migrations.AlterModelOptions(
            name='passwordresetotp',
            options={'verbose_name': 'Verification Code',
                     'verbose_name_plural': 'Verification Codes'},
        ),
        migrations.AddIndex(
            model_name='passwordresetotp',
            index=models.Index(fields=['email', 'purpose'],
                               name='api_passwor_email_33e7c2_idx'),
        ),

        # ── 3. Credentials encrypted at rest ────────────────────────────────
        migrations.AlterField(
            model_name='userintegration',
            name='gmail_access_token',
            field=api.fields.EncryptedTextField(blank=True, default=''),
        ),
        migrations.AlterField(
            model_name='userintegration',
            name='twilio_token',
            field=api.fields.EncryptedCharField(blank=True, default='', max_length=100),
        ),
        migrations.AlterField(
            model_name='userintegration',
            name='openai_api_key',
            field=api.fields.EncryptedCharField(blank=True, default='', max_length=255),
        ),
        migrations.AlterField(
            model_name='userintegration',
            name='virustotal_api_key',
            field=api.fields.EncryptedCharField(blank=True, default='', max_length=255),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='mfa_secret',
            field=api.fields.EncryptedCharField(blank=True, default='', max_length=32),
        ),
        migrations.AlterField(
            model_name='oauthprovider',
            name='client_secret',
            field=api.fields.EncryptedCharField(blank=True, default='', max_length=255),
        ),
        migrations.AlterField(
            model_name='connectedaccount',
            name='access_token',
            field=api.fields.EncryptedTextField(blank=True, default=''),
        ),
        migrations.AlterField(
            model_name='connectedaccount',
            name='refresh_token',
            field=api.fields.EncryptedTextField(blank=True, default=''),
        ),
        migrations.RunPython(encrypt_existing_credentials, noop),

        # ── 4. OAuth state, so the callback can verify it ───────────────────
        migrations.CreateModel(
            name='OAuthState',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True,
                                           serialize=False, verbose_name='ID')),
                ('state', models.CharField(db_index=True, max_length=64, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('provider', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE, to='api.oauthprovider')),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='oauth_states', to='auth.user')),
            ],
            options={
                'verbose_name': 'OAuth State',
                'verbose_name_plural': 'OAuth States',
            },
        ),
    ]
