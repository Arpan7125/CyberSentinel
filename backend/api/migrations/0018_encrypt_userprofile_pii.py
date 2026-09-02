"""Encrypt the personal details stored on UserProfile.

`company` and `phone` were plaintext columns, so a database dump — or the free
tier's nightly backup — read as a contact list. Both are now Fernet-encrypted
at rest by EncryptedCharField.

Two steps, in this order:

1. Widen the columns. Ciphertext is substantially longer than the plaintext it
   replaces, so encrypting into a varchar(32) would truncate and destroy data.
2. Re-save every existing row through the field so the plaintext already in the
   table becomes ciphertext.

Step 2 is written against the raw column rather than the model manager because
the historical model Django hands a migration still carries the encrypted field
class; reading through it would decrypt (harmlessly passing plaintext through)
and writing through it re-encrypts, which is exactly what we want, but doing it
in explicit SQL-free Python keeps the intent obvious and the reverse honest.

The reverse migration decrypts back to plaintext so the change is not a one-way
door.
"""

from django.db import migrations

import api.fields
from api.crypto import PREFIX, decrypt, encrypt


def encrypt_existing(apps, schema_editor):
    UserProfile = apps.get_model('api', 'UserProfile')

    for profile in UserProfile.objects.all().iterator():
        updates = {}
        for field in ('company', 'phone'):
            raw = getattr(profile, field) or ''
            # `decrypt` passes plaintext through untouched, so a row that is
            # somehow already encrypted is not double-wrapped here.
            if raw and not raw.startswith(PREFIX):
                updates[field] = raw
        if updates:
            for field, value in updates.items():
                setattr(profile, field, value)
            profile.save(update_fields=list(updates))


def decrypt_existing(apps, schema_editor):
    UserProfile = apps.get_model('api', 'UserProfile')

    for profile in UserProfile.objects.all().iterator():
        changed = []
        for field in ('company', 'phone'):
            raw = getattr(profile, field) or ''
            if raw:
                setattr(profile, field, decrypt(raw))
                changed.append(field)
        if changed:
            profile.save(update_fields=changed)


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0017_userprofile_data_consent'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='company',
            field=api.fields.EncryptedCharField(blank=True, default='', max_length=150),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='phone',
            field=api.fields.EncryptedCharField(blank=True, default='', max_length=32),
        ),
        migrations.RunPython(encrypt_existing, decrypt_existing),
    ]
