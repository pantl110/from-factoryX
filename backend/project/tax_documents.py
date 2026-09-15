def get_linked_tax_documents(project):
    """Return every tax document represented by a project's legacy anchor FK."""
    if not project.tax_invoice_id:
        return []

    anchor = project.tax_invoice
    if not anchor.document_group_id:
        return [anchor]

    return sorted(
        anchor.document_group.documents.all(),
        key=lambda document: document.id,
    )
