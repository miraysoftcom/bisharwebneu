import os
import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

DEFAULT_PROJECTS = [
    {
        "title": "Luxuriöse Badezimmer-Oase",
        "slug": "luxurioese-badezimmer-oase",
        "category": "bathroom",
        "image_url": "https://images.pexels.com/photos/7018379/pexels-photo-7018379.jpeg",
        "location": "Zürich",
        "duration": "8 Tage",
        "materials": "Grossformat-Feinsteinzeug (120x120 cm), Marmor-Optik",
        "works": "Untergrundschleifen, Wand- und Bodenabdichtung nach SIA, Plattenverlegung, Fugenarbeiten",
        "desc": "Komplette Sanierung eines Master-Badezimmers mit bodengleicher Walk-In Dusche und millimetergenauen Gehrungsschnitten.",
        "active": True,
        "featured": False,
        "order": 0,
        "created_at": datetime.now(timezone.utc)
    },
    {
        "title": "Exklusive Terrassen-Plattenverlegung",
        "slug": "exklusive-terrassen-plattenverlegung",
        "category": "outdoor",
        "image_url": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a",
        "location": "Aarau",
        "duration": "5 Tage",
        "materials": "Naturstein-Keramikplatten (2cm Dicke), Stelzlager-System",
        "works": "Flüssigabdichtung, Spezialentwässerung, Plattenverlegung auf Stelzlager, elastische Fugen",
        "desc": "Wasserdichte Abdichtung und Verlegung strapazierfähiger Feinsteinzeugplatten auf einer modernen Dachterrasse.",
        "active": True,
        "featured": False,
        "order": 1,
        "created_at": datetime.now(timezone.utc)
    },
    {
        "title": "Modernes Wohnzimmer mit XXL-Feinsteinzeug",
        "slug": "modernes-wohnzimmer-xxl-feinsteinzeug",
        "category": "flooring",
        "image_url": "https://images.pexels.com/photos/1388944/floor-flooring-hand-man-1388944.jpeg",
        "location": "Olten",
        "duration": "6 Tage",
        "materials": "Feinsteinzeugplatten (160x80 cm), hochfester Zementmörtel",
        "works": "Kratzgrundierung, Heizestrich-Ausgleich, Verlegung im Buttering-Floating-Verfahren",
        "desc": "Großflächiges Verlegen von modernen Grossformatplatten im gesamten Wohnbereich.",
        "active": True,
        "featured": False,
        "order": 2,
        "created_at": datetime.now(timezone.utc)
    },
    {
        "title": "Gewerbliche Wellnessanlage 'Thermal-Pool'",
        "slug": "gewerbliche-wellnessanlage-thermal-pool",
        "category": "commercial",
        "image_url": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f",
        "location": "Baden",
        "duration": "14 Tage",
        "materials": "Mosaikfliesen, Epoxidharz-Fugenmörtel, Spezial-Haftbrücke",
        "works": "Flüssig-Druckwasserabdichtung, Mosaik-Präzisionsverlegung, chemikalienbeständige Verfugung",
        "desc": "Hochkomplexe Spezialabdichtung und Verfliesung einer Hotel-Wellnesslandschaft.",
        "active": True,
        "featured": False,
        "order": 3,
        "created_at": datetime.now(timezone.utc)
    }
]


async def seed():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    inserted = 0
    for proj in DEFAULT_PROJECTS:
        # don't duplicate by slug
        if await db.projects.find_one({"slug": proj["slug"]}):
            continue
        await db.projects.insert_one(proj)
        inserted += 1
    print(f"Seed complete. Inserted {inserted} new projects.")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
