"""Model fields that encrypt their value on the way to the database.

Encryption happens in `get_prep_value` and decryption in `from_db_value`, so
application code reads and writes plain strings and never has to remember to
call the crypto helpers. The column stores a longer string than the plaintext
(Fernet output plus the marker), which is why the concrete fields below widen
`max_length` on the way to the database.

Encrypted columns cannot be filtered, ordered, or matched with `__icontains`
— the ciphertext is different every time the same plaintext is written. Nothing
in this project queries by credential value; if that ever changes, store a
separate hash column to query against.
"""

from django.db import models

from .crypto import decrypt, encrypt


class EncryptedTextField(models.TextField):
    """TextField whose contents are encrypted at rest."""

    def from_db_value(self, value, expression, connection):
        return decrypt(value)

    def to_python(self, value):
        return decrypt(value) if isinstance(value, str) else value

    def get_prep_value(self, value):
        return encrypt(super().get_prep_value(value))


class EncryptedCharField(models.CharField):
    """CharField whose contents are encrypted at rest.

    `max_length` describes the plaintext the caller may store; the column is
    sized generously for the ciphertext, which is roughly 100 bytes of overhead
    plus base64 expansion.
    """

    def __init__(self, *args, **kwargs):
        self.plaintext_max_length = kwargs.get('max_length', 255)
        kwargs['max_length'] = max(self.plaintext_max_length * 3 + 200, 512)
        super().__init__(*args, **kwargs)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        kwargs['max_length'] = self.plaintext_max_length
        return name, path, args, kwargs

    def from_db_value(self, value, expression, connection):
        return decrypt(value)

    def to_python(self, value):
        return decrypt(value) if isinstance(value, str) else value

    def get_prep_value(self, value):
        return encrypt(super().get_prep_value(value))
