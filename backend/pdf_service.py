import os
import uuid
import hashlib
from datetime import datetime, timezone
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing, Rect, String, Line

# Swiss Currency Formatter: CHF 1’250.00
def format_swiss_currency(val) -> str:
    try:
        val = float(val)
    except (ValueError, TypeError):
        val = 0.0
    formatted = f"{val:,.2f}"
    # Replace comma with single quotation mark for Swiss standard: 1,250.00 -> 1'250.00
    # But keep decimal point
    return "CHF " + formatted.replace(",", "’")

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and render total page counts 
    along with consistent Swiss corporate headers/footers on A4.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            
            # Set PDF/A compliant metadata tags
            self.setTitle("SWISS PLATTEN Dokumentation")
            self.setSubject("Archivierungsstandard PDF/A - SIA Handwerk")
            self.setAuthor("Swiss Platten GmbH")
            self.setCreator("Swiss Platten PDF Engine v2.0")
            
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        
        # 1. Page Margin boundary: A4 is 595.27 x 841.89 points
        width, height = A4
        margin = 54 # 1.9cm
        
        # 2. Draw Header for pages > 1
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#111418"))
            self.drawString(margin, height - 36, "SWISS PLATTEN GMBH  |  ATELIER D'ARCHITECTURE")
            
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#C5A880"))
            self.drawRightString(width - margin, height - 36, "SIA HANDWERKS-STANDARD")
            
            # Draw elegant thin champagne-gold header line
            self.setStrokeColor(colors.HexColor("#C5A880"))
            self.setLineWidth(0.5)
            self.line(margin, height - 42, width - margin, height - 42)

        # 3. Draw Footer on all pages
        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#64748B"))
        
        footer_text = "Plattenleger aller Art | info@plattenlegerallerart.ch | +41 79 123 45 67 | UID: CHE-123.456.789 MWST"
        self.drawString(margin, 36, footer_text)
        
        page_num_text = f"Seite {self._pageNumber} von {page_count}"
        self.drawRightString(width - margin, 36, page_num_text)
        
        # Draw thin gold footer line
        self.setStrokeColor(colors.HexColor("#C5A880"))
        self.setLineWidth(0.5)
        self.line(margin, 46, width - margin, 46)
        
        self.restoreState()


def build_swiss_pdf(quote: dict, output_path: str, is_contract: bool = False):
    """
    Generates an ultra-professional, Swiss-grade A4 corporate PDF document 
    for Quotes (Offerte) and Contracts (Vertrag) using ReportLab Flowables.
    """
    # A4 Dimensions: 595.27 x 841.89
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Corporate Typography Styles
    style_h1 = ParagraphStyle(
        name="LuxuryH1",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#111418"),
        spaceAfter=15
    )
    
    style_h2 = ParagraphStyle(
        name="LuxuryH2",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#C5A880"),
        spaceAfter=8,
        spaceBefore=12
    )

    style_body = ParagraphStyle(
        name="LuxuryBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1E2328")
    )
    
    style_body_bold = ParagraphStyle(
        name="LuxuryBodyBold",
        parent=style_body,
        fontName="Helvetica-Bold"
    )

    style_table_header = ParagraphStyle(
        name="LuxuryTableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.white
    )

    style_table_cell = ParagraphStyle(
        name="LuxuryTableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#1E2328")
    )

    story = []

    # ================= PAGE 1: COVER PAGE & COORDINATES =================
    
    # 1. Company Coordinates / Logo Area with Dynamic Verification QR-Code
    from reportlab.graphics.barcode import qr
    token = quote.get("secure_token", "default")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    verify_url = f"{frontend_url}/quotes/token/{token}"
    
    qr_widget = qr.QrCodeWidget(verify_url)
    qr_widget.barWidth = 45
    qr_widget.barHeight = 45
    qr_widget.qrVersion = 1
    
    qr_drawing = Drawing(45, 45)
    qr_drawing.add(qr_widget)

    logo_data = [
        [
            Paragraph("<b>PLATTENLEGER ALLER ART</b><br/>Atelier d'Architecture & Plattenleger<br/>Bahnhofstrasse 30, 5430 Wettingen<br/>info@plattenlegerallerart.ch | +41 79 123 45 67", style_body),
            qr_drawing
        ]
    ]
    logo_table = Table(logo_data, colWidths=[410, 77])
    logo_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
    ]))
    story.append(logo_table)
    story.append(Spacer(1, 30))

    # 2. Recipient Address Window (Left-aligned Swiss Envelope layout)
    anrede = "Herr" if quote.get("gender") == "m" else "Frau"
    client_name = f"{quote.get('first_name', '')} {quote.get('last_name', '')}"
    company_name = quote.get("company", "")
    
    recipient_text = f"<b>{company_name}</b><br/>" if company_name else ""
    recipient_text += f"{anrede} {client_name}<br/>{quote.get('street', '')} {quote.get('house_number', '')}<br/>{quote.get('postal_code', '')} {quote.get('city', '')}"
    
    recipient_data = [
        [
            Paragraph(recipient_text, style_body),
            Paragraph(f"<b>Datum:</b> {datetime.now(timezone.utc).strftime('%d.%m.%Y')}<br/><b>Gültigkeit:</b> {quote.get('validity_days', 30)} Tage<br/><b>Referenz:</b> {quote.get('reference_number', '')}", style_body)
        ]
    ]
    recipient_table = Table(recipient_data, colWidths=[280, 207])
    recipient_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(recipient_table)
    story.append(Spacer(1, 40))

    # 3. Document Title
    doc_title = f"VERTRAGS-URKUNDE" if is_contract else "PROV. OFFERTENANFRAGE"
    doc_num = quote.get("contract_number") if is_contract else quote.get("reference_number")
    story.append(Paragraph(f"{doc_title}  |  {doc_num}", style_h1))
    
    # 4. Intro Greetings
    introduction = (
        f"Sehr geehrte Damen und Herren,<br/><br/>"
        f"vielen Dank für das uns entgegengebrachte Vertrauen. Basierend auf Ihren Projektangaben "
        f"für {', '.join(quote.get('services', []))} im Objektbereich {', '.join(quote.get('object_areas', []))} "
        f"haben wir folgende detaillierte Leistungsaufstellung nach Schweizer SIA-Handwerksstandards kalkuliert."
    )
    story.append(Paragraph(introduction, style_body))
    story.append(Spacer(1, 20))

    # ================= PAGE 2: ITEMIZED COST POSITIONS =================
    
    # Header block
    story.append(Paragraph("Detaillierte Leistungsaufstellung", style_h2))
    
    # Table headers
    pos_data = [[
        Paragraph("<b>Pos.</b>", style_table_header),
        Paragraph("<b>Leistungsbeschreibung (SIA Richtlinien)</b>", style_table_header),
        Paragraph("<b>Menge</b>", style_table_header),
        Paragraph("<b>Einheit</b>", style_table_header),
        Paragraph("<b>E-Preis</b>", style_table_header),
        Paragraph("<b>Rabatt</b>", style_table_header),
        Paragraph("<b>Gesamt</b>", style_table_header),
    ]]

    items = quote.get("items", [])
    subtotal = 0.0
    
    for idx, item in enumerate(items, 1):
        desc = item.get("description", "")
        qty = float(item.get("qty", 1))
        unit = item.get("unit", "m²")
        price = float(item.get("unit_price", 0))
        item_discount = float(item.get("discount_pct", 0))
        
        # Calculate item totals
        raw_total = qty * price
        discount_deduct = raw_total * (item_discount / 100)
        item_total = raw_total - discount_deduct
        subtotal += item_total
        
        pos_data.append([
            Paragraph(f"{idx}", style_table_cell),
            Paragraph(desc, style_table_cell),
            Paragraph(f"{qty:.1f}", style_table_cell),
            Paragraph(unit, style_table_cell),
            Paragraph(format_swiss_currency(price), style_table_cell),
            Paragraph(f"{item_discount}%" if item_discount > 0 else "-", style_table_cell),
            Paragraph(format_swiss_currency(item_total), style_table_cell),
        ])

    # Table layout: A4 total drawable is ~487 points (595 - 108 margin)
    col_widths = [25, 202, 40, 45, 65, 45, 65]
    pos_table = Table(pos_data, colWidths=col_widths)
    pos_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#111418")), # Obsidian header
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#C5A880")), # Champagne line grid
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(pos_table)
    story.append(Spacer(1, 15))

    # ================= CALCULATIONS BLOCK =================
    discount_pct = float(quote.get("discount_pct", 0.0))
    discount_amount = subtotal * (discount_pct / 100)
    net_after_discount = subtotal - discount_amount
    vat_rate = float(quote.get("mwst_rate", 8.1)) if quote.get("mwst_active", True) else 0.0
    vat_amount = net_after_discount * (vat_rate / 100)
    grand_total = net_after_discount + vat_amount

    calc_data = [
        [Paragraph("Zwischensumme brutto:", style_body), Paragraph(format_swiss_currency(subtotal), style_body_bold)],
    ]
    if discount_pct > 0:
        calc_data.append([Paragraph(f"Zusatz-Rabatt ({discount_pct}%):", style_body), Paragraph(f"- {format_swiss_currency(discount_amount)}", style_body_bold)])
    
    if vat_rate > 0:
        calc_data.append([Paragraph(f"MWST ({vat_rate}%):", style_body), Paragraph(format_swiss_currency(vat_amount), style_body_bold)])
    else:
        calc_data.append([Paragraph("MWST (Deaktiviert):", style_body), Paragraph("CHF 0.00", style_body_bold)])
        
    calc_data.append([Paragraph("<font size=11><b>GESAMTBETRAG INKL. MWST:</b></font>", style_body), Paragraph(f"<font size=11 color='#C5A880'><b>{format_swiss_currency(grand_total)}</b></font>", style_body_bold)])

    calc_table = Table(calc_data, colWidths=[300, 187])
    calc_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LINEABOVE', (0,-1), (-1,-1), 1, colors.HexColor("#C5A880")), # Thick double gold line for totals
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(calc_table)
    story.append(Spacer(1, 25))

    # ================= TERMS & SIGNATURE BLOCK =================
    
    legal_text = (
        "<b>Zahlungsbedingungen:</b> 30% bei Auftragserteilung, 40% bei Arbeitsbeginn, 30% nach Abnahme.<br/>"
        "<b>Garantie:</b> 2 Jahre auf alle verlegten Fliesen und Abdichtungsarbeiten nach SIA-Richtlinien.<br/>"
        "Diese Offerte ist freibleibend. Es gelten die allgemeinen Geschäftsbedingungen der Swiss Platten GmbH."
    )
    story.append(Paragraph(legal_text, style_body))
    story.append(Spacer(1, 30))

    if is_contract:
        # Draw dynamic signature overlay with cryptographic hash details
        sig_svg = quote.get("signature_svg", "")
        signer = quote.get("signer_name", client_name)
        ip = quote.get("ip_address", "127.0.0.1")
        date_signed = datetime.now(timezone.utc).strftime("%d.%m.%Y %H:%M UTC")
        
        signature_block_data = [
            [
                Paragraph(f"<b>Unterschrift Auftragnehmer</b><br/><br/><br/><br/>___________________________<br/>Swiss Platten GmbH", style_body),
                Paragraph(f"<b>Digitale Unterschrift Auftraggeber</b><br/><br/><font color='#C5A880'><b>[DIGITALLY SIGNED VIA SCREEN CANVAS]</b></font><br/>Signer: {signer}<br/>IP: {ip}<br/>Datum: {date_signed}<br/>Verification Hash: <code color='red'>{quote.get('verification_hash', 'N/A')}</code>", style_body)
            ]
        ]
        sig_table = Table(signature_block_data, colWidths=[240, 247])
        sig_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#C5A880")),
            ('PADDING', (0,0), (-1,-1), 12),
            ('BACKGROUND', (1,0), (1,0), colors.HexColor("#FAF9F6")),
        ]))
        story.append(KeepTogether([sig_table]))
    else:
        # Standard empty sign spaces
        signature_block_data = [
            [
                Paragraph("<b>Ort, Datum</b><br/><br/>___________________________", style_body),
                Paragraph("<b>Unterschrift Auftraggeber</b><br/><br/>___________________________", style_body)
            ]
        ]
        sig_table = Table(signature_block_data, colWidths=[240, 247])
        sig_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('PADDING', (0,0), (-1,-1), 12),
        ]))
        story.append(KeepTogether([sig_table]))

    # Build Document using NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
