"""
Utility: MongoDB ObjectId serializer
Converts ObjectId fields in MongoDB documents to strings for JSON responses
"""
from bson import ObjectId


def serialize_doc(doc) -> dict:
    """Recursively serialize a MongoDB document, converting ObjectId to str."""
    if doc is None:
        return {}
    if isinstance(doc, list):
        return [serialize_doc(d) for d in doc]
    result = {}
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            result[k] = str(v)
        elif isinstance(v, dict):
            result[k] = serialize_doc(v)
        elif isinstance(v, list):
            result[k] = [serialize_doc(i) if isinstance(i, dict) else i for i in v]
        else:
            result[k] = v
    return result


def serialize_docs(docs: list) -> list:
    """Serialize a list of MongoDB documents."""
    return [serialize_doc(d) for d in (docs or [])]
