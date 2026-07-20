import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

async def seed_100_faqs(db):
    """
    Seeds exactly 100 high-quality, professional German FAQs across 10 Swiss construction categories
    if the collection is empty or has fewer than 100 records.
    """
    faq_count = await db.faqs.count_documents({})
    if faq_count >= 100:
        logger.info(f"FAQ collection already has {faq_count} records. Seeding skipped.")
        return

    # Delete existing to prevent duplicates and ensure clean 100 count
    await db.faqs.delete_many({})
    
    categories = {
        "Allgemeine Fragen": [
            ("Welche Dienstleistungen bietet Swiss Platten GmbH an?", "Wir bieten ein umfassendes Leistungsspektrum von der Plattenverlegung über Bodenschleifarbeiten und Bauwerksabdichtungen bis hin zu präzisen Fassadenarbeiten und Fugenreparaturen nach SIA-Norm."),
            ("In welchen Regionen der Schweiz sind Sie tätig?", "Wir sind exklusiv in den Regionen Zürich, Aarau, im gesamten Kanton Aargau und in Olten für Sie vor Ort."),
            ("Wie kann ich eine kostenlose Offerte anfordern?", "Nutzen Sie einfach unser bequemes 8-Schritte-Online-Offertensystem auf der Website. Alternativ können Sie uns telefonisch oder per E-Mail kontaktieren."),
            ("Ist die Besichtigung vor Ort vor der Offertenerstellung kostenlos?", "Ja, für eine präzise Einschätzung bieten wir Ihnen eine komplett kostenlose und unverbindliche Vor-Ort-Besichtigung an."),
            ("Wie schnell erhalte ich mein persönliches Angebot?", "In der Regel erhalten Sie Ihre detaillierte Festpreisofferte innerhalb von 24 bis 48 Stunden nach der Besichtigung oder der vollständigen Datenübermittlung."),
            ("Akzeptieren Sie auch Kleinstaufträge wie einzelne Plattenreparaturen?", "Ja, unser Team führt sowohl Grossprojekte als auch kleinere Ausbesserungen und Fugenreparaturen mit der gleichen Schweizer Sorgfalt aus."),
            ("Führen Sie Arbeiten für Privat- oder Geschäftskunden aus?", "Wir betreuen Privatkunden, anspruchsvolle Architekten, Generalunternehmungen sowie institutionelle Immobilienverwaltungen."),
            ("Bieten Sie auch komplette Badrenovierungen aus einer Hand an?", "Ja, im Rahmen von Renovierungen koordinieren wir die gesamte Untergrundvorbereitung, Abdichtung und Plattenverlegung lückenlos."),
            ("Führen Sie auch Notfall-Reparaturen bei Wasserschäden durch?", "Bei akuten Wasserschäden im Bad oder auf der Terrasse lokalisieren wir die Undichtigkeit und führen sofortige Notabdichtungen durch."),
            ("Wie vereinbare ich am besten einen Beratungstermin?", "Sie können direkt online über unser Kontaktformular oder per WhatsApp einen Rückruf anfordern. Wir melden uns umgehend bei Ihnen.")
        ],
        "Offerten und Preise": [
            ("Sind Ihre Offerten wirklich absolut unverbindlich?", "Ja, alle unsere Angebote und Kostenvoranschläge sind für Sie zu 100% kostenlos und verpflichten Sie zu nichts."),
            ("Wie setzen sich die Preise in der Offerte zusammen?", "Unsere Offerten sind transparent nach SIA-Positionen gegliedert. Wir listen Materialkosten, Maschinenaufwand und Arbeitsstunden detailliert auf."),
            ("Bieten Sie Festpreis-Garantien an?", "Ja, nach einer erfolgreichen Vor-Ort-Besichtigung erhalten Sie auf Wunsch eine verbindliche Festpreisofferte ohne versteckte Nebenkosten."),
            ("Ist es möglich, Arbeiten auf Regie (Stundenaufwand) abzurechnen?", "Für unvorhergesehene Zusatzarbeiten oder Teilsanierungen bieten wir auch eine transparente Abrechnung nach tatsächlichem Stundenaufwand an."),
            ("Sind die benötigten Materialien in der Offerte enthalten?", "In der Regel kalkulieren wir die Offerte inklusive aller Premium-Kleber, Abdichtungsstoffe und Fugenmörtel. Die Platten können beigestellt oder über uns bezogen werden."),
            ("Wie werden unvorhergesehene Zusatzarbeiten berechnet?", "Zusatzarbeiten werden vor der Ausführung schriftlich mit Ihnen besprochen und fliessen als separate Nachtragsposition ein."),
            ("Wie lange ist eine von Ihnen ausgestellte Offerte gültig?", "Unsere Angebote haben standardmässig eine Gültigkeitsdauer von 30 Tagen ab Ausstellungsdatum."),
            ("Kann sich der Preis nach der Unterzeichnung des Vertrags ändern?", "Nein, unser Festpreisversprechen gilt. Preisanpassungen gibt es nur bei nachträglichen Änderungswünschen Ihrerseits."),
            ("Ist die Schweizer Mehrwertsteuer (MWST) in den Preisen enthalten?", "In Offerten für Privatkunden weisen wir die MWST (aktuell 8.1%) stets transparent aus. Für Firmenkunden kalkulieren wir meist exklusive MWST."),
            ("Gewähren Sie Rabatte bei Grossaufträgen?", "Bei grossflächigen Projekten oder Mehrfamilienhaussanierungen gewähren wir attraktive Mengenrabatte auf die Quadratmeterpreise.")
        ],
        "Plattenarbeiten": [
            ("Welche Arten von Fliesen und Platten verlegen Sie?", "Wir verlegen Keramikplatten, robustes Feinsteinzeug, edlen Naturstein (Marmor, Granit), Glasmosaik sowie moderne Zementplatten."),
            ("Verlegen Sie auch moderne XXL-Grossformatplatten?", "Ja, wir sind auf Grossformate spezialisiert und verfügen über die nötigen Spezialsauger und Schneidetische für Platten bis 160x320 cm."),
            ("Führen Sie sowohl Wand- als auch Bodenplattenarbeiten aus?", "Ja, wir verlegen Platten fachgerecht an Wänden, Böden, Treppenanlagen und Nischen im Innen- und Aussenbereich."),
            ("Kann man neue Fliesen direkt über alte Fliesen verlegen?", "Ja (Fliese-auf-Fliese), sofern der Untergrund absolut tragfähig und eben ist. Wir prüfen dies vorab mittels Klopftest."),
            ("Was ist ein Jollyschnitt und führen Sie diesen aus?", "Ein Jollyschnitt ist das präzise Anschleifen der Plattenkanten auf 45 Grad für perfekte, scharfkantige Aussenecken ohne unschöne Kunststoffschiene."),
            ("Wie wird die ideale Fugenbreite bei Platten bestimmt?", "Die Fugenbreite richtet sich nach der Plattengrösse, dem Material und den SIA-Richtlinien, liegt aber meist zwischen 1.5 und 3 mm."),
            ("Welche Fliesen eignen sich am besten für eine rutschfeste Dusche?", "Wir empfehlen Feinsteinzeug mit einer Rutschhemmungsklasse von mindestens R10B oder edle Mosaikverlegungen mit hohem Fugenanteil."),
            ("Können Natursteinplatten im Aussenbereich verlegt werden?", "Ja, Natursteine wie Granit oder Quarzit sind frostbeständig und eignen sich hervorragend für Terrassen und Eingangsbereiche."),
            ("Wie pflege ich meine neu verlegten Keramikplatten richtig?", "Keramik ist extrem pflegeleicht. Klares Wasser mit einem neutralen Reiniger genügt. Vermeiden Sie rückfettende Pflegemittel."),
            ("Müssen Natursteinplatten speziell imprägniert werden?", "Ja, wir empfehlen dringend eine werkseitige oder nachträgliche Imprägnierung nach der Verlegung, um Fleckenbildung vorzubeugen.")
        ],
        "Bodenarbeiten": [
            ("Welche Bodensysteme bereiten Sie vor?", "Wir bereiten Betonböden, Zementestriche, Anhydritestriche sowie alte Fliesen- und Holzuntergründe für die Plattenverlegung vor."),
            ("Warum ist das Bodenschleifen vor der Verlegung so wichtig?", "Das Schleifen entfernt Sinterschichten, Kleberreste und Unebenheiten und stellt die Saugfähigkeit und Haftung des Untergrunds sicher."),
            ("Können Sie Gefälleböden in Nassbereichen ausgleichen?", "Ja, wir erstellen präzise Gefällespachtelungen in Duschen, damit das Wasser perfekt zum Ablauf fliesst."),
            ("Führen Sie Bodenschleifarbeiten auch als eigenständige Leistung aus?", "Ja, wir schleifen und polieren Beton- oder Estrichböden auch im Industrie- und Loftbereich als fertige Sichtböden."),
            ("Kann man Platten direkt auf einer Fussbodenheizung verlegen?", "Ja, wir verlegen Platten im Buttering-Floating-Verfahren, um Lufteinschlüsse zu vermeiden und die Wärmeleitfähigkeit zu maximieren."),
            ("Was tun Sie bei feuchten Untergründen im Keller?", "Wir führen Feuchtigkeitsmessungen durch und applizieren bei Bedarf spezielle Epoxidharzsperren gegen aufsteigende Feuchtigkeit."),
            ("Wie lange muss ein frisch gegossener Estrich trocknen?", "Zementestrich benötigt in der Regel mindestens 28 Tage Trocknungszeit, bis die Belegreife (CM-Messung unter 2.0%) erreicht ist."),
            ("Welcher Bodenbelag eignet sich am besten für stark beanspruchte Gewerberäume?", "Hier empfehlen wir durchgefärbtes Feinsteinzeug der Abriebgruppe 5, da es extrem kratzfest und chemikalienbeständig is."),
            ("Bieten Sie rutschfeste Beschichtungen für Treppenhäuser an?", "Ja, wir verlegen profilierte Sicherheitsstufen oder applizieren rutschfeste Plattenbeläge im gesamten Treppenbereich."),
            ("Wie beheben Sie Risse im Untergrund vor der Verlegung?", "Risse werden von uns kraftschlüssig mit Spezialharz (Wellenverbinder) vergossen, um spätere Risse in den Fliesen zu verhindern.")
        ],
        "Abdichtung": [
            ("Warum ist eine professionelle Bauwerksabdichtung im Bad unerlässlich?", "Ohne fachgerechte Verbundabdichtung dringt Feuchtigkeit durch Fugen in die Bausubstanz und verursacht schwere Schimmel- und Fäulnisschäden."),
            ("Welche Abdichtungsverfahren wenden Sie in Duschen an?", "Wir applizieren flüssige Verbundabdichtungen (Flüssigfolien) in mindestens zwei Schichten, inklusive elastischer Dichtbänder an allen Ecken."),
            ("Dichten Sie auch Balkone und Terrassen ab?", "Ja, Balkonabdichtungen führen wir mit hochelastischen, rissüberbrückenden Flüssigkunststoffen oder Bitumenbahnen aus."),
            ("Wie schützen Sie die Schnittstellen an Fenstern und Türen?", "An Türen und bodengleichen Fenstern montieren wir zertifizierte Anschlussbänder, um das Eindringen von Schlagregen zu verhindern."),
            ("Können Sie bestehende Undichtigkeiten lokalisieren?", "Ja, wir führen zerstörungsfreie Feuchtigkeitsmessungen durch, um die Schwachstellen in der alten Abdichtung zu finden."),
            ("Kann man Fliesen ohne vorherige Abdichtung verlegen?", "Im direkten Nassbereich (Dusche/Badewanne) ist das Verlegen ohne Abdichtung nach Schweizer SIA-Normen strengstens untersagt."),
            ("Welche Trocknungszeit hat eine Flüssigabdichtung?", "Jede Schicht der Flüssigfolie muss vor dem Fliesenlegen vollständig durchtrocknen, was meist zwischen 12 und 24 Stunden dauert."),
            ("Welche Zertifizierungen besitzen Ihre Abdichtungssysteme?", "Wir verwenden ausschliesslich vom Schweizerischen Plattenverband geprüfte und SIA-konforme Verbundabdichtungen."),
            ("Führen Sie nach der Abdichtung Dichtigkeitstests durch?", "Ja, bei Flachdächern und Terrassen führen wir auf Wunsch eine Flutungsprüfung durch, um absolute Wasserdichtigkeit zu garantieren."),
            ("Wie werden Rohrdurchführungen im Bad abgedichtet?", "Rohrdurchführungen werden mit speziellen, hochelastischen Wand- und Bodenmanschetten lückenlos in die Flüssigabdichtung eingebunden.")
        ],
        "Fugen und Silikon": [
            ("Können alte, rissige Zementfugen erneuert werden?", "Ja, wir fräsen alte Zementfugen vorsichtig heraus und verfugen die Flächen fachgerecht mit flexiblem Premium-Fugenmörtel neu."),
            ("Wie reinige ich verfärbte Fliesenuntergründe und Fugen?", "Leichte Verschmutzungen lassen sich mit sauren Reinigern entfernen. Vermeiden Sie scharfe Hausmittel, da diese den Zement angreifen."),
            ("Wie oft müssen elastische Silikonfugen erneuert werden?", "Silikonfugen sind Wartungsfugen und sollten im Nassbereich alle 3 bis 5 Jahre kontrolliert und bei Rissen sofort erneuert werden."),
            ("Was tun Sie gegen Schimmelbefall in der Silikonfuge?", "Schimmeliges Silikon muss komplett entfernt, die Fugenkammer desinfiziert und mit pilzhemmendem Sanitär-Silikon neu ausgespritzt werden."),
            ("Welche verschiedenen Fugenmörtel verwenden Sie?", "Wir verwenden flexible Zementfugen für Standardbereiche und hochfeste, säurebeständige Epoxidharzfugen für Duschen und Gewerbe."),
            ("Kann ich die Fugenfarbe passend zu den Fliesen wählen?", "Ja, wir bieten eine breite Palette an Grautönen, Anthrazit, Pergamon und Sonderfarben passend zu Ihrem Fliesendesign an."),
            ("Warum reissen Zementfugen in den Ecken von Neubauten?", "Das liegt an den natürlichen Setzungsbewegungen des Gebäudes. In allen Ecken müssen daher zwingend elastische Silikonfugen gezogen werden."),
            ("Sind Epoxidharzfugen absolut wasserdicht?", "Ja, Epoxidharzfugen weisen eine geschlossene Oberfläche auf, sind absolut wasser- und schmutzabweisend sowie extrem hygienisch."),
            ("Wie pflege ich Silikonfugen im Duschbereich am besten?", "Nach jedem Duschen sollten die Silikonfugen mit einem Abzieher getrocknet werden, um Seifenreste und Kalkbildung zu minimieren."),
            ("Verhindern Fugen das Eindringen von stehendem Wasser?", "Zementfugen sind wasserhemmend, aber nicht 100% wasserdicht. Daher ist die darunterliegende Flüssigabdichtung so wichtig.")
        ],
        "Fassadenarbeiten": [
            ("Können beschädigte Klinker- oder Steinfassaden neu ausgefugt werden?", "Ja, wir sanieren bröckelnde Fassadenfugen durch fachgerechtes Ausfräsen und Neuverfugen mit witterungsbeständigem Spezialmörtel."),
            ("Bieten Sie Fassadenreinigungen an?", "Ja, wir reinigen Klinker- und Natursteinfassaden materialschonend mit Hochdruck und Spezialreinigern von Algen- und Russbefall."),
            ("Wie reparieren Sie feine Risse im Fassadenmörtel?", "Feine Haarrisse werden mit elastischen Fassadenspachtelmassen verschlossen, um das Eindringen von Frostwasser zu verhindern."),
            ("Sind Ihre Fassadenfugen absolut frostsicher?", "Ja, wir verwenden ausschliesslich zertifizierte, kunststoffvergütete Fassadenmörtel mit hoher Frost-Tau-Wechselbeständigkeit."),
            ("Benötigen Sie für Fassadenarbeiten immer ein Gerüst?", "Bei Arbeiten in grosser Höhe stellen wir ein professionelles Fassadengerüst. Für kleinere Teilstücke nutzen wir oft Hebebühnen."),
            ("In welchen Jahreszeiten können Fassadenfugen saniert werden?", "Die Verarbeitungstemperatur muss konstant über +5 Grad liegen. Daher führen wir Fassadenarbeiten meist von Frühling bis Herbst aus."),
            ("Arbeiten Sie mit WDVS-Wärmedämmfassaden zusammen?", "Wir führen die abschliessenden Riemchen- und Verblenderarbeiten auf vorbereiteten Wärmedämm-Verbundsystemen aus."),
            ("Wie hoch ist die Lebensdauer einer professionell sanierten Fassade?", "Eine fachgerecht sanierte Fassadenverfugung schützt das Gebäude in der Regel für mindestens 25 bis 40 Jahre lückenlos."),
            ("Können Sie auch Denkmalschutz-Fassaden sanieren?", "Ja, wir verwenden historische Kalkmörtelmischungen, um denkmalgeschützte Klinker- und Steinfassaden stilecht zu erhalten."),
            ("Wie lange dauert die Sanierung einer Einfamilienhaus-Fassade?", "Je nach Grösse und Fugenanteil dauert ein typisches Einfamilienhaus-Projekt in der Regel zwischen 5 und 10 Werktagen.")
        ],
        "Ablauf und Ausführung": [
            ("Wie bereite ich meine Wohnung auf die Plattenarbeiten vor?", "Bitte räumen Sie den betroffenen Raum leer. Empfindliche Möbel in Fluren sollten abgedeckt oder geschützt werden."),
            ("Muss ich während der gesamten Arbeitszeit vor Ort sein?", "Nein, es reicht vollkommen aus, wenn Sie uns am ersten Tag den Zugang ermöglichen und für Rückfragen telefonisch erreichbar sind."),
            ("Kann das Badezimmer während der Renovierung benutzt werden?", "Während der Abdichtungs-, Verlege- und Trocknungsphase kann das Bad (insb. Dusche/Boden) für einige Tage leider nicht benutzt werden."),
            ("Wie minimieren Sie Staub und Schmutz im Wohnbereich?", "Wir nutzen professionelle Staubschutzwände an den Zimmertüren sowie moderne Absauganlagen an unseren Schneidemaschinen."),
            ("Entsorgen Sie den anfallenden Bauschutt und die alten Fliesen?", "Ja, die umweltgerechte Entsorgung von Altbelägen und Verpackungen ist in unseren Offerten als Pauschale enthalten."),
            ("Führen Sie nach Abschluss der Arbeiten eine Endreinigung durch?", "Wir übergeben Ihnen die Baustelle besenrein und führen eine gründliche Zementschleierentfernung auf den neuen Platten durch."),
            ("Wie flexibel sind Sie bei Verzögerungen anderer Gewerke?", "Wir stimmen uns eng mit Ihren Sanitär- und Gipserbetrieben ab, um den Bauzeitenplan auch bei Verzögerungen optimal anzupassen."),
            ("Wie wird die Qualität der ausgeführten Arbeiten kontrolliert?", "Unser Bauleiter führt vor Ort eine detaillierte Qualitätsprüfung (Ebenheit, Fugenbild, Haftung) nach SIA-Normen durch."),
            ("Wer ist mein direkter Ansprechpartner während des Projekts?", "Ihnen wird ein fester Projektleiter zugewiesen, der Sie vom Erstkontakt bis zur Abnahme persönlich betreut."),
            ("Bieten Sie flexible Arbeitszeiten (z.B. Samstagsarbeit) an?", "Für dringende Terminarbeiten oder gewerbliche Ausfallzeiten können wir nach Absprache auch samstags für Sie arbeiten.")
        ],
        "Material und Qualität": [
            ("Kann ich die Fliesen auch selbst im Baumarkt kaufen?", "Ja, Sie können Ihr Material selbst beistellen. Wir verlegen dieses gern, übernehmen jedoch keine Garantie für die Materialqualität."),
            ("Bieten Sie Musterplatten zur Ansicht an?", "Ja, wir bringen Ihnen zu unserem Beratungstermin gerne ausgewählte Musterkollektionen und Farbpaletten direkt nach Hause."),
            ("Woher beziehen Sie Ihre Fliesen und Platten?", "Wir arbeiten eng mit führenden Schweizer Platten-Importeuren und renommierten italienischen und italienischen Manufakturen zusammen."),
            ("Wie wird die Abriebklasse (Qualität) von Fliesen bestimmt?", "Die Abriebklassen (PEI 1-5) geben die Strapazierfähigkeit an. PEI 4-5 eignet sich perfekt für Küchen, Flure und Nasszonen."),
            ("Sind geringe Farbunterschiede bei Fliesen normal?", "Ja, Fliesen werden in Bränden (Tonalitäten) hergestellt. Geringe Nuancen sind herstellungsbedingt normal und machen den Charme aus."),
            ("Warum sollte ich immer einige Reserveplatten aufbewahren?", "Sollte es in vielen Jahren zu einem Rohrbruch kommen, können beschädigte Platten so farbidentisch ausgetauscht werden."),
            ("Welche Plattenkleber verwenden Sie für Grossformate?", "Wir verwenden ausschliesslich hochflexible, kunststoffvergütete S1/S2 Flexkleber, die Spannungen im Untergrund perfekt abfangen."),
            ("Sind Ihre verwendeten Materialien umweltfreundlich?", "Ja, wir achten auf schadstoff- und emissionsarme Verlegewerkstoffe, die mit dem EMICODE EC1-Label zertifiziert sind."),
            ("Erhalte ich technische Datenblätter zu den verlegten Platten?", "Ja, auf Wunsch händigen wir Ihnen alle herstellerseitigen Datenblätter und Pflegehinweise vollständig aus."),
            ("Wie funktioniert die Garantie auf das verlegte Material?", "Bei Materialfehlern greift die gesetzliche Herstellergarantie. Wir wickeln die Reklamation in Ihrem Namen unkompliziert ab.")
        ],
        "Zahlung, Garantie und Abnahme": [
            ("Welche Zahlungsmethoden werden von Ihnen akzeptiert?", "Wir akzeptieren Banküberweisungen auf unser Schweizer PostFinance Konto sowie bargeldlose Zahlungen mit dem Swiss QR-Bill Verfahren."),
            ("Verlangen Sie eine Anzahlung (Akontozahlung) bei Projektbeginn?", "Bei grösseren Aufträgen vereinbaren wir meist eine Akontozahlung von 30% bei Auftragserteilung und 40% bei Arbeitsbeginn."),
            ("Wann erhalte ich die Schlussrechnung für mein Projekt?", "Die Schlussrechnung wird Ihnen nach der erfolgreichen gemeinsamen Abnahme und Mängelprüfung per Post oder E-Mail zugestellt."),
            ("Unterstützen Sie die Zahlung via Swiss QR-Bill?", "Ja, alle unsere Rechnungen verfügen über den standardisierten Schweizer QR-Zahlteil für eine unkomplizierte Überweisung."),
            ("Bieten Sie Ratenzahlungen an?", "Ratenzahlungen sind in Ausnahmefällen nach vorheriger Bonitätsprüfung und schriftlicher Vereinbarung vor Projektbeginn möglich."),
            ("Wie läuft die offizielle Bauabnahme am Ende ab?", "Wir begehen das fertige Werk gemeinsam mit Ihnen und halten das Ergebnis in einem offiziellen Abnahmeprotokoll fest."),
            ("Was passiert, wenn nach der Abnahme ein Mangel entdeckt wird?", "Melden Sie uns den verdeckten Mangel bitte umgehend schriftlich. Wir beheben diesen innerhalb der Gewährleistungsfrist kostenlos."),
            ("Wie lange habe ich Gewährleistung auf Ihre Arbeiten?", "Wir gewähren Ihnen standardmässig eine Garantie von 2 Jahren auf alle unsere Verlege- und Abdichtungsarbeiten nach SIA 118."),
            ("Sind Zusatzleistungen transparent auf der Rechnung aufgeführt?", "Ja, alle Regie- oder Zusatzleistungen werden mit genauen Stunden- und Materialnachweisen separat auf der Rechnung ausgewiesen."),
            ("Erhalte ich nach Projektabschluss eine Kopie des unterschriebenen Vertrags?", "Ja, das unterschriebene Vertragsprotokoll sowie das Abnahmeprotokoll werden Ihnen automatisch als schreibgeschütztes PDF per E-Mail zugestellt.")
        ]
    }

    # Bulk insert
    faq_docs = []
    for cat_name, qas in categories.items():
        for q, a in qas:
            faq_docs.append({
                "question_de": q,
                "answer_de": a,
                "question_en": "",
                "answer_en": "",
                "question_it": "",
                "answer_it": "",
                "question_fr": "",
                "answer_fr": "",
                "category": cat_name,
                "created_at": datetime.now(timezone.utc)
            })
            
    await db.faqs.insert_many(faq_docs)
    logger.info(f"Seed: Successfully populated exact {len(faq_docs)} high-quality German FAQs!")
