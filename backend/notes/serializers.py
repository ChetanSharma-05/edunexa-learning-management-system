from rest_framework import serializers

from .models import Note


class NoteSerializer(
    serializers.ModelSerializer
):

    subject_name = serializers.CharField(
        source="subject.name",
        read_only=True
    )

    created_by_name = serializers.CharField(
        source="created_by.full_name",
        read_only=True
    )

    file_url = serializers.SerializerMethodField()

    class Meta:

        model = Note

        fields = [
            "id",
            "title",
            "description",
            "subject",
            "subject_name",
            "file",
            "file_url",
            "is_active",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_by",
            "created_at",
            "updated_at",
            "file_url",
        ]

    def get_file_url(self, obj):

        if not obj.file:
            return None

        request = self.context.get(
            "request"
        )

        if request:
            return request.build_absolute_uri(
                obj.file.url
            )

        return obj.file.url